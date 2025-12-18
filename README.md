# Managed Zoom OAuth Example

A simple Node.js Express application that demonstrates Attendee's managed Zoom OAuth feature. This app allows users to sign in with their Zoom account and stores the OAuth connection in a local JSON file database.

## Features

- Sign-in screen with Zoom OAuth integration
- Attendee API integration for managed OAuth
- Simple JSON file-based database
- Session management for authenticated users
- Dashboard displaying Zoom user ID and connection details
- Clean, modern UI

## Prerequisites

- Node.js (v14 or higher)
- npm
- Zoom OAuth app credentials
- Attendee API key

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Zoom OAuth App Credentials
ZOOM_CLIENT_ID=your_zoom_client_id_here
ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
ZOOM_OAUTH_APP_ID=your_zoom_oauth_app_id_here

# Attendee API Credentials
ATTENDEE_API_KEY=your_attendee_api_key_here

# App Configuration
PORT=3000
REDIRECT_URI=http://localhost:3000/zoom_oauth_callback
SESSION_SECRET=your_random_session_secret_here

# Attendee API URL
ATTENDEE_API_URL=https://staging.attendee.dev/api/v1
```

### 3. Configure Zoom OAuth App

Make sure your Zoom OAuth app is configured with the correct redirect URI:

- Redirect URI: `http://localhost:3000/zoom_oauth_callback`

### 4. Run the Application

```bash
npm start
```

The server will start on `http://localhost:3000`

## Usage

1. Navigate to `http://localhost:3000` in your browser
2. Click the "Sign in with Zoom" button
3. You'll be redirected to Zoom's OAuth authorization page
4. Grant the requested permissions
5. After successful authorization, you'll be redirected back to the app
6. The app will:
   - Exchange the authorization code for tokens via Attendee API
   - Save the connection data to the local JSON database
   - Sign you in and redirect to the dashboard
7. The dashboard displays your Zoom user ID and connection details

## Project Structure

```
managed-zoom-oauth-example/
├── server.js              # Main Express server
├── db.js                  # Simple JSON file database module
├── package.json           # Node.js dependencies
├── .env.example           # Environment variable template
├── .env                   # Your actual environment variables (not in git)
├── data/                  # Database directory (auto-created)
│   └── users.json         # User data storage (auto-created)
└── public/                # Static files
    ├── signin.html        # Sign-in page
    └── dashboard.html     # Dashboard page
```

## API Endpoints

### Public Endpoints

- `GET /` - Sign-in page
- `GET /zoom_oauth` - Initiates Zoom OAuth flow
- `GET /zoom_oauth_callback` - OAuth callback handler

### Protected Endpoints

- `GET /dashboard` - User dashboard (requires authentication)
- `GET /api/user` - Get current user data (requires authentication)
- `GET /logout` - Logout user

## How It Works

1. **OAuth Initiation**: When a user clicks "Sign in with Zoom", they're redirected to Zoom's OAuth authorization page

2. **OAuth Callback**: After the user grants permissions, Zoom redirects back to `/zoom_oauth_callback` with an authorization code

3. **Attendee API Call**: The app sends the authorization code to Attendee's managed OAuth API:
   ```javascript
   POST https://staging.attendee.dev/api/v1/zoom_oauth_connections
   Headers: Authorization: Token {ATTENDEE_API_KEY}
   Body: {
     authorization_code: code,
     redirect_uri: REDIRECT_URI,
     is_local_recording_token_supported: false,
     is_onbehalf_token_supported: true
   }
   ```

4. **Store Connection**: The response contains a `user_id` and connection details, which are saved to the local database

5. **User Session**: The user is signed in by storing their `user_id` in the session

6. **Dashboard**: The user is redirected to a dashboard showing their Zoom user ID and connection details

## Database

This app uses a simple JSON file-based database that stores user data in `data/users.json`. The database structure:

```json
{
  "zoom_user_id_1": {
    "id": "connection_id",
    "user_id": "zoom_user_id_1",
    "zoom_oauth_app_id": "app_id",
    "is_onbehalf_token_supported": true,
    "is_local_recording_token_supported": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

## Security Notes

- In production, use HTTPS and set `cookie.secure: true` in session configuration
- Use a strong, random `SESSION_SECRET`
- Never commit `.env` file to version control
- Store credentials securely
- Consider using a proper database for production use

## License

ISC
