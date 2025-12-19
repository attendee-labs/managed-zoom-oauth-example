# Attendee Managed Zoom OAuth Example

A simple Node.js web application demonstrating how to use Attendee's managed Zoom OAuth feature.

This feature handles the process of managing Zoom OAuth connections and tokens for you. Currently it supports two capabilities:
1. Local recording token - This token allows the bot to bypass the waiting room and record the meeting without asking permission. The meeting host must have authorized the app.
2. Onbehalf token - This token associates the bot with a user in the meeting. The bot will not be able to join the meeting until this user joins. It will soon be required for any external meeting. See [here](https://developers.zoom.us/blog/transition-to-obf-token-meetingsdk-apps/) for details. 

## Setup

See [here](https://www.youtube.com/watch?v=nfR-oSxDsPY) for a video showing these steps.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a Zoom OAuth App:**
   1. Go to the [Zoom Developer Portal](https://marketplace.zoom.us/user/build) and create a new General app.
   2. On the sidebar select 'Basic Information'.
   3. For the OAuth redirect URL, enter `http://localhost:5005/zoom_oauth_callback`.
   4. On the sidebar select 'Features -> Embed'.
   5. Toggle 'Meeting SDK' to on.
   6. On the sidebar select 'Scopes'.
   7. Add the following scopes if you want to use the local recording token:
      - `user:read:user`
      - `meeting:read:list_meetings`
      - `meeting:read:local_recording_token`
      - `user:read:zak`
   8. Add the following scopes if you want to use the onbehalf token:
      - `user:read:token`
      - `user:read:zak`

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in as follows:
   - `ZOOM_CLIENT_ID` and `ZOOM_CLIENT_SECRET` from your Zoom OAuth App
   - `IS_LOCAL_RECORDING_TOKEN_SUPPORTED` and `IS_ONBEHALF_TOKEN_SUPPORTED` set based on your Zoom OAuth App's scopes. At least one must be true.
   - `ATTENDEE_API_KEY` from your Attendee account
   - `ATTENDEE_API_URL` for the Attendee instance you are using (defaults to https://app.attendee.com for the hosted instance)

4. **Set up ngrok for webhook development:**
   
   Ngrok creates a secure tunnel to your localhost so Attendee can send webhooks to your local application.
   
   **Install ngrok:**
   
   For macOS with Homebrew:
   ```bash
   brew install ngrok
   ```
   
   For Ubuntu/Debian:
   ```bash
   snap install ngrok
   ```
   
   Or download directly from [ngrok.com](https://ngrok.com/download)
   
   **Start the ngrok tunnel:**
   ```bash
   ngrok http 5005
   ```
   
   Copy the generated HTTPS URL (e.g., `https://abc123.ngrok-free.app`) - you'll need this for webhook configuration.

5. **Add Zoom credentials to Attendee:**
   
   In your Attendee dashboard:
   
   1. Go to **Settings → Credentials**
   2. Under Zoom OAuth App Credentials, click **"Add OAuth App"**
   3. Enter your Zoom Client ID, Client Secret and Webhook Secret *(Note: Webhook secret is only needed if you are using the local recording token)*
   4. Click **"Save"**

6. **Add Webhook to Zoom App:**
   
   *Note: These steps are only needed if you are using the local recording token.*
   
   1. In the Attendee dashboard, click the **Webhook url** button on your newly created Zoom OAuth App credentials.
   2. Go back to the Zoom Developer Portal and go to **Features -> Access** in the sidebar.
   3. Toggle **Event subscription** and click **Add new Event Subscription**.
   4. For the **Event notification endpoint URL**, enter the webhook url you copied earlier from the Attendee dashboard.
   5. Select these event types:
      - `Meeting has been created`
      - `User's profile info has been updated`
   6. Click **"Save"**
   7. If you are creating a production app, validate the webhook by clicking the **Validate** button.

7. **Configure Attendee webhooks:**
   
   In your Attendee dashboard:
   
   1. Go to **Settings → Webhooks**
   2. Click **"Create Webhook"**
   3. Enter your ngrok URL + `/attendee-webhook` (e.g., `https://abc123.ngrok-free.app/attendee-webhook`)
   4. Select these triggers:
      - `zoom_oauth_connection.state_change`
   5. Click **"Create"** to save the webhook

8. **Run the application:**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

9. **Use the application:**
   1. Open http://localhost:5005 in your browser
   2. Connect your Zoom account
   3. Launch a bot
   4. If you enabled local recording token, the bot will be able to join the meeting and record the meeting without asking permission.
   5. If you enabled the onbehalf token, the bot will be associated your user in the Zoom client. It will not be able to join the meeting until you join. The onbehalf token will be required after February 23, 2026, see [here for details](https://developers.zoom.us/blog/transition-to-obf-token-meetingsdk-apps/).

10. **Test disconnecting the Zoom App:**
    1. Goto https://marketplace.zoom.us/user/installed and find your app.
    2. Remove it from your account.
    3. Launch another bot.
    4. Refresh the dashboard after 30 seconds and you should see that the Zoom OAuth connection state is disconnected. The bot will still be able to join the meeting, but it will not be able to generate any tokens.
