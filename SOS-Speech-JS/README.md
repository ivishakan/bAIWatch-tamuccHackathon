# SOS Voice Outbound Call Alert System

An emergency alert system that records 10 seconds of speech, transcribes it, fetches user data, and makes an automated outbound call to deliver the emergency message.

## Features

- 🚨 Simple SOS button interface
- 🎤 Real-time speech-to-text transcription (10 seconds)
- 📊 Fetches user data from database (name, age, sex, emergency contact, location)
- 📞 Automated outbound call with structured message delivery
- 💰 **100% Free** - Uses free services

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Web Speech API for speech-to-text)
- **Backend**: Node.js, Express
- **Voice Calls**: Twilio
- **Database**: SQLite3 (users.db)
- **AI Analysis**: Emergency type detection (fire, medical, police, accident)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TARGET_PHONE_NUMBER=+13614259843
```

**Note**: For Twilio trial accounts, verify the target phone number in the Twilio console before making calls.

### 3. Start the Server

```bash
npm start
```

Or for development:

```bash
npm run dev
```

### 4. Open in Browser

Navigate to: `http://localhost:3000`

**Database**: The SQLite database (`users.db`) is automatically created on first run with default users (`user1`, `user2`).

## How It Works

1. **User presses SOS button**
2. **Recording starts** - System listens for 10 seconds
3. **Speech-to-text** - Real-time transcription using Web Speech API
4. **AI Analysis** - Determines emergency type (fire, medical, police, accident)
5. **Fetch user data** - Retrieves user info from SQLite database
6. **Make outbound call** - Twilio calls the emergency number with structured message

## Important Notes

- **Browser Compatibility**: Works best in Chrome/Edge (Web Speech API support)
- **Twilio Trial**: Can only call verified numbers during trial. Verify numbers in Twilio console.
- **HTTPS**: Required for production (Web Speech API), not needed for localhost

## API Documentation

### For External Integration

You can integrate the SOS button in your own frontend by calling the API endpoint directly.

#### Endpoint: `POST /api/make-call`

**Base URL**: `http://your-server-url:3000` (or your deployed URL)

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "user1",
  "transcribedMessage": "I need help, there is a fire in my building",
  "phoneNumber": "+13614259843"
}
```

**Parameters**:
- `userId` (required): The user ID from your database (must exist in users.db)
- `transcribedMessage` (required): The emergency message/transcription text
- `phoneNumber` (optional): Target phone number in E.164 format (e.g., +13614259843). If not provided, uses default from `.env` file.

**Response (Success)**:
```json
{
  "success": true,
  "callSid": "CA59e7bf428ffb3b39f701a0c0a69fab5a",
  "message": "Call initiated successfully",
  "targetNumber": "+13614259843",
  "emergencyType": "fire"
}
```

**Response (Error)**:
```json
{
  "error": "Failed to make call",
  "details": "User not found",
  "code": "404"
}
```

**Example Integration (JavaScript)**:
```javascript
async function triggerSOS(userId, emergencyMessage, targetPhoneNumber) {
  try {
    const response = await fetch('http://your-server-url:3000/api/make-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        transcribedMessage: emergencyMessage,
        phoneNumber: targetPhoneNumber || '+13614259843'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('Emergency call initiated:', data.callSid);
      return data;
    } else {
      console.error('Failed to make call:', data.error);
      throw new Error(data.details || data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Usage:
triggerSOS('user1', 'I need help, there is a fire', '+13614259843')
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

**Example Integration (cURL)**:
```bash
curl -X POST http://your-server-url:3000/api/make-call \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "transcribedMessage": "I need help, there is a fire in my building",
    "phoneNumber": "+13614259843"
  }'
```

**Emergency Types Detected**:
The API automatically analyzes the message and determines emergency type:
- `fire`: Detects words like "fire", "smoke", "burning"
- `medical`: Detects words like "medical", "heart attack", "breathing", "injury", "sick"
- `police`: Detects words like "police", "robbery", "assault", "theft", "intruder"
- `accident`: Detects words like "accident", "crash", "collision"
- Default: `medical` if no specific type detected

**Note for External Integration**:
- Ensure your server is accessible (deploy to a public URL for production)
- The user must exist in the database before making a call
- For production, use HTTPS
- Phone numbers must be verified in Twilio console (for trial accounts)

#### Endpoint: `GET /api/user/:userId`

Get user details by ID.

**Request**: `GET /api/user/user1`

**Response**:
```json
{
  "user_id": "user1",
  "name": "John Peter",
  "age": "35",
  "sex": "Male",
  "emergencyContact": "361 555 1110",
  "location": "1702 Ennis Joslin Rd, Corpus Christi, TX 72412",
  "medicalInfo": "Specially Abled"
}
```

## Customization

- Change target phone number in `public/app.js` or via API `phoneNumber` parameter
- Modify message format in `server.js`
- Add more user fields in `db.js` and update database schema
- Customize UI in `public/styles.css`

## Troubleshooting

- **Speech recognition not working**: Use Chrome or Edge browser
- **Call fails**: Check Twilio credentials in `.env`
- **Can't make calls**: Verify your Twilio number and that target number is verified (for trial accounts)

## License

MIT

