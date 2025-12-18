/**
 * Managed Zoom OAuth Example
 * Node.js Express app using Attendee's managed Zoom OAuth
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const db = require('./db');

// Configuration
const PORT = process.env.PORT || 5005;
const CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ATTENDEE_API_KEY = process.env.ATTENDEE_API_KEY;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/zoom_oauth_callback`;
const ATTENDEE_API_URL = process.env.ATTENDEE_API_URL || 'https://app.attendee.dev';
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
const IS_LOCAL_RECORDING_TOKEN_SUPPORTED = process.env.IS_LOCAL_RECORDING_TOKEN_SUPPORTED === 'true';
const IS_ONBEHALF_TOKEN_SUPPORTED = process.env.IS_ONBEHALF_TOKEN_SUPPORTED === 'true';

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Serve static files
app.use(express.static('public'));

// Build Zoom authorize URL
function getZoomAuthorizeUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI
  });
  return `https://zoom.us/oauth/authorize?${params.toString()}`;
}

// Routes

// Home page - Sign in screen
app.get('/', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

// Initiate Zoom OAuth flow
app.get('/zoom_oauth', (req, res) => {
  const authorizeUrl = getZoomAuthorizeUrl();
  res.redirect(authorizeUrl);
});

// Zoom OAuth callback
app.get('/zoom_oauth_callback', async (req, res) => {
  try {
    // Check for errors from Zoom
    if (req.query.error) {
      return res.status(400).send(`Zoom returned an error: ${req.query.error}`);
    }

    const code = req.query.code;
    if (!code) {
      return res.status(400).send('Missing authorization code parameter');
    }

    console.log('Received authorization code, calling Attendee API...');

    // Call Attendee API to create Zoom OAuth connection
    const response = await axios.post(
      `${ATTENDEE_API_URL}/api/v1/zoom_oauth_connections`,
      {
        authorization_code: code,
        redirect_uri: REDIRECT_URI,
        is_local_recording_token_supported: IS_LOCAL_RECORDING_TOKEN_SUPPORTED,
        is_onbehalf_token_supported: IS_ONBEHALF_TOKEN_SUPPORTED
      },
      {
        headers: {
          'Authorization': `Token ${ATTENDEE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Attendee API response:', response.data);

    if (response.status !== 201) {
      return res.status(400).send(`Error creating zoom oauth connection: ${JSON.stringify(response.data)}`);
    }

    // Extract user_id from response
    const connectionData = response.data;
    const zoomUserId = connectionData.user_id;

    if (!zoomUserId) {
      return res.status(400).send('No user_id in Attendee API response');
    }

    // Save connection to local database
    db.saveUser(zoomUserId, connectionData);
    console.log(`Saved user ${zoomUserId} to database`);

    // Sign in the user by storing user_id in session
    req.session.userId = zoomUserId;

    // Redirect to dashboard
    res.redirect('/dashboard');

  } catch (error) {
    console.error('Error in OAuth callback:', error.response?.data || error.message);

    // Handle Attendee API errors
    if (error.response?.data) {
      const errorData = error.response.data;
      const errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
      return res.status(error.response.status || 400).send(`Error creating Zoom OAuth connection: ${errorMessage}`);
    }

    // Handle other errors
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Dashboard - Show user info
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }

  const user = db.getUser(req.session.userId);
  if (!user) {
    req.session.destroy();
    return res.redirect('/');
  }

  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// API endpoint to get current user data
app.get('/api/user', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = db.getUser(req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    userId: req.session.userId,
    connectionData: user
  });
});

// API endpoint to launch a bot
app.post('/api/launch-bot', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { meeting_url, bot_name } = req.body;

  if (!meeting_url || !bot_name) {
    return res.status(400).json({ error: 'meeting_url and bot_name are required' });
  }

  try {
    console.log(`Launching bot "${bot_name}" for meeting: ${meeting_url}`);

    // Call Attendee API to create bot
    const response = await axios.post(
      `${ATTENDEE_API_URL}/api/v1/bots`,
      {
        meeting_url: meeting_url,
        bot_name: bot_name,
        zoom_settings: {
          sdk: 'web',
          onbehalf_token: {
            zoom_oauth_connection_user_id: req.session.userId
          }
        }
      },
      {
        headers: {
          'Authorization': `Token ${ATTENDEE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Bot created:', response.data);
    res.status(201).json(response.data);

  } catch (error) {
    console.error('Error launching bot:', error.response?.data || error.message);

    // Handle Attendee API errors
    if (error.response?.data) {
      const errorData = error.response.data;
      const errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
      return res.status(error.response.status || 400).json({ error: errorMessage });
    }

    // Handle other errors
    res.status(500).json({ error: error.message });
  }
});

// Attendee webhook endpoint for connection state changes
app.post('/attendee-webhook', async (req, res) => {
  try {
    const webhookData = req.body;

    console.log('Received webhook:', JSON.stringify(webhookData, null, 2));

    // Verify this is a zoom_oauth_connection state change event
    if (webhookData.trigger !== 'zoom_oauth_connection.state_change') {
      console.log(`Ignoring webhook with trigger: ${webhookData.trigger}`);
      return res.status(200).json({ message: 'Webhook received but not processed' });
    }

    const userId = webhookData.user_id;
    const connectionId = webhookData.zoom_oauth_connection_id;
    const stateData = webhookData.data;

    if (!userId) {
      console.error('No user_id in webhook data');
      return res.status(400).json({ error: 'Missing user_id' });
    }

    // Get existing user data
    const existingUser = db.getUser(userId);

    if (!existingUser) {
      console.log(`User ${userId} not found in database, skipping update`);
      // Still return 200 to acknowledge receipt
      return res.status(200).json({ message: 'User not found, webhook acknowledged' });
    }

    // Update user's connection data with the new state
    const updatedConnectionData = {
      ...existingUser,
      state: stateData.state,
      last_attempted_sync_at: stateData.last_attempted_sync_at,
      last_successful_sync_at: stateData.last_successful_sync_at,
      connection_failure_data: stateData.connection_failure_data
    };

    db.saveUser(userId, updatedConnectionData);

    console.log(`Updated connection state for user ${userId} to: ${stateData.state}`);

    if (stateData.state === 'disconnected' && stateData.connection_failure_data) {
      console.error(`Connection failed for user ${userId}:`, stateData.connection_failure_data);
    }

    // Return 200 to acknowledge successful processing
    res.status(200).json({ message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to prevent webhook retries for processing errors
    res.status(200).json({ message: 'Webhook received but error occurred during processing' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
  console.log('\nMake sure to:');
  console.log('1. Copy .env.example to .env');
  console.log('2. Fill in your credentials in .env');
  console.log('3. Run: npm install');
});
