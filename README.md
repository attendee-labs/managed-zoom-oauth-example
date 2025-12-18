# Attendee Managed Zoom OAuth Example

A simple Node.js web application demonstrating how to use Attendee's managed zoom oauth feature.

## Setup

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
8. Add the following scope if you want to use the onbehalf token:
    - `user:read:token`

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

5. **Configure Attendee webhooks:**
   
   In your Attendee dashboard:
   
   1. Go to **Settings → Webhooks**
   2. Click **"Create Webhook"**
   3. Enter your ngrok URL + `/attendee-webhook` (e.g., `https://abc123.ngrok-free.app/attendee-webhook`)
   4. Select these triggers:
      - `zoom_oauth_connection.state_change`
   5. Click **"Create"** to save the webhook

6. **Run the application:**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

7. **Use the application:**
   1. Open http://localhost:5005 in your browser
   2. Connect your Zoom account
   3. Launch a bot
   4. If you enabled local recording token, the bot will be able to join the meeting and record the meeting without asking permission.
   5. If you enabled the onbehalf token, the bot will be associated your user in the Zoom client. It will not be able to join the meeting until you join. The onbehalf token will be required after February 23, 2026, see [here for details](https://developers.zoom.us/blog/transition-to-obf-token-meetingsdk-apps/).

8. **Test disconnecting the Zoom App:**
  1. Goto https://marketplace.zoom.us/user/installed and find your app.
  2. Remove it from your account.
  3. Launch another bot.
  4. Refresh the dashboard after 30 seconds and you should see that the Zoom OAuth connection state is disconnected. The bot will still be able to join the meeting, but it will not be able to generate any tokens.