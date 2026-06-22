# Google Calendar Integration Setup

This guide walks you through setting up Google Calendar integration for Life OS, enabling the Doctor Appointments agent to fetch your medical appointments automatically.

## Prerequisites

- Google Account
- Access to Google Cloud Console
- Node.js 20+

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Name it: `Life OS` (or your preference)
5. Click "CREATE"
6. Wait for the project to be created, then select it

## Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and press **ENABLE**
4. Wait a moment for it to be enabled

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top
3. Select **OAuth client ID**
4. If prompted, click **CONFIGURE CONSENT SCREEN** first:
   - Choose "External" for User Type
   - Fill in required fields:
     - App name: `Life OS`
     - User support email: your email
     - Developer contact: your email
   - Click "SAVE AND CONTINUE"
   - Add scope: `https://www.googleapis.com/auth/calendar`
   - Click "SAVE AND CONTINUE"
   - Click "BACK TO DASHBOARD"
5. Now create credentials:
   - Click **+ CREATE CREDENTIALS** again
   - Select **OAuth client ID**
   - Choose **Desktop Application** as Application type
   - Name it: `Life OS Desktop`
   - Click **CREATE**

## Step 4: Download Credentials

1. A dialog will appear with your credentials
2. Click the download icon (📥) to download the JSON file
3. Rename it to `credentials.json` and place it **in the root of the Life OS project directory**

Your project structure should look like:
```
life-os/
├── credentials.json
├── src/
├── index.js
└── ...
```

## Step 5: Authenticate with Google

Run the setup script:

```bash
node setup-google-calendar.js
```

The script will:
1. Generate an authentication URL
2. Open your browser (or provide a link to visit)
3. Ask you to authorize Life OS to access your Google Calendar
4. Provide an authorization code to paste back
5. Save the authentication token locally

## Step 6: Configure .env

Add to your `.env` file:

```env
# Google Calendar
GOOGLE_CALENDAR_CREDENTIALS_PATH=./credentials.json
GOOGLE_CALENDAR_ID=primary
```

- **GOOGLE_CALENDAR_CREDENTIALS_PATH**: Path to your credentials.json (default: `./credentials.json`)
- **GOOGLE_CALENDAR_ID**: Which calendar to use. Options:
  - `primary` - Your main/default calendar
  - Your specific calendar ID (get it from Google Calendar settings)

## Step 7: Test the Integration

1. Create a test appointment in Google Calendar with "Doctor" or "Medical" in the title
2. Run Life OS:
   ```bash
   npm start
   ```
3. Check if the Doctor Appointments agent picks it up in the 8:30 AM run

## How It Works

- The Doctor Appointments agent runs daily at **8:30 AM**
- It fetches events from your Google Calendar for the **next 14 days**
- It filters for medical-related appointments (keywords: doctor, appointment, physical, checkup, medical, sports medicine)
- It generates reminders and sends them via Telegram

## Event Filtering

The agent automatically filters events by these keywords:
- **Summary**: doctor, appointment, physical, checkup, medical, sports medicine
- **Description**: medical, doctor

To ensure events are picked up, include these keywords in either:
- Event title (Summary)
- Event description

Examples:
- ✅ "Doctor Checkup - Sports Medicine"
- ✅ "Annual Physical with Dr. Smith"
- ✅ "Appointment: Blood work"
- ✅ "Biometric Testing (Medical)"

## Troubleshooting

### "Google Calendar token not found. Run setup first."

Run the authentication script again:
```bash
node setup-google-calendar.js
```

### "credentials.json not found"

Make sure you:
1. Downloaded credentials.json from Google Cloud Console
2. Placed it in the project root directory
3. Named it exactly `credentials.json` (lowercase, no spaces)

### "Failed to fetch calendar events"

Check:
1. Your Google Calendar is not empty
2. You have medical appointments in the next 14 days
3. Appointments contain the filtering keywords (see above)
4. Your internet connection is working

### Token Expired (after ~7 days)

The token automatically refreshes when needed. If you see authentication errors:
1. Delete `.google-calendar-token.json` from project root
2. Run `node setup-google-calendar.js` again

## Security Notes

- **credentials.json**: Contains your Google API credentials. **NEVER commit to git.**
  - Add to `.gitignore`:
    ```
    credentials.json
    .google-calendar-token.json
    ```

- **.google-calendar-token.json**: Contains your access token. **NEVER commit to git.**
  - Already in `.gitignore` (if configured)

- The token is stored locally and is used only to authenticate with Google Calendar
- Life OS has read-only access to your calendar (unless configured otherwise)

## Advanced: Multiple Calendars

To track appointments across multiple calendars, you can modify the Doctor Appointments agent to fetch from several calendar IDs:

```javascript
const calendarIds = ['primary', 'family@group.calendar.google.com', 'work@company.com'];
const allEvents = [];

for (const calId of calendarIds) {
  const events = await googleCalendarService.getUpcomingEvents(calId, 14);
  allEvents.push(...events);
}
```

## Advanced: Custom Event Matching

Modify the `fetchAppointments()` method in `src/agents/doctor-appointments/index.js` to customize event filtering:

```javascript
const medicalEvents = events
  .filter((event) => {
    const title = event.summary?.toLowerCase() || '';
    // Add custom logic here
    return title.includes('custom-keyword');
  })
```

## Support

If you encounter issues:
1. Check error logs: `tail -f logs/doctor-appointments.log`
2. Verify Google Cloud Console shows the Calendar API is enabled
3. Ensure token hasn't expired (delete `.google-calendar-token.json` and re-authenticate)
4. Check your calendar has events matching the filter keywords

---

**Next Steps**: Once configured, the Doctor Appointments agent will automatically:
- ✅ Check your calendar daily at 8:30 AM
- ✅ Extract medical appointments
- ✅ Generate personalized reminders
- ✅ Send them via Telegram
- ✅ Suggest preparation items and questions
