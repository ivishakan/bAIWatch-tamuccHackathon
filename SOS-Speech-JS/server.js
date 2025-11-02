require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const path = require('path');
const urlencoded = bodyParser.urlencoded({ extended: false });

// Database handlers
const db = require('./db');
const { analyzeEmergency } = require('./conversation');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(urlencoded);
app.use(express.static('public'));

// In-memory store for active calls (in production, use Redis or proper cache)
const activeCalls = new Map();

// Initialize Twilio client (uses environment variables)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const defaultTargetNumber = process.env.TARGET_PHONE_NUMBER || '+13614259843';

let twilioClient = null;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
  console.log('Twilio client initialized');
} else {
  console.log('Twilio credentials not found. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
}

// Initialize database on startup
let dbInitialized = false;
db.initDatabase()
  .then((database) => {
    dbInitialized = true;
    console.log('Database initialized successfully');
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    console.log('Server will continue, but database features will be unavailable');
  });

// API endpoint to get user details
app.get('/api/user/:userId', async (req, res) => {
  try {
    if (dbInitialized) {
      const user = await db.getUserById(req.params.userId);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } else {
      res.status(503).json({ error: 'Database not initialized' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// API endpoint to create or update user
app.post('/api/user', async (req, res) => {
  try {
    if (!dbInitialized) {
      return res.status(503).json({ error: 'Database not initialized' });
    }

    const { user_id, name, age, sex, emergencyContact, location, medicalInfo } = req.body;

    // Validate required fields
    if (!user_id || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'user_id and name are required'
      });
    }

    const userData = {
      user_id,
      name,
      age: age || 'Unknown',
      sex: sex || 'Not specified',
      emergencyContact: emergencyContact || 'Not provided',
      location: location || 'Location unknown',
      medicalInfo: medicalInfo || 'None provided'
    };

    await db.upsertUser(userData);
    
    res.json({ 
      success: true, 
      message: 'User created/updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: 'Failed to create/update user' });
  }
});

// API endpoint to make outbound call
app.post('/api/make-call', async (req, res) => {
  const { userId, transcribedMessage, phoneNumber } = req.body;

  try {
    // Validate required parameters
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required parameter',
        details: 'userId is required'
      });
    }

    if (!transcribedMessage) {
      return res.status(400).json({ 
        error: 'Missing required parameter',
        details: 'transcribedMessage is required'
      });
    }

    // Load user data from database
    if (!dbInitialized) {
      return res.status(503).json({ error: 'Database not initialized' });
    }

    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found', details: `User with ID '${userId}' does not exist in the database` });
    }

    // Make the call using Twilio
    if (!twilioClient) {
      return res.status(500).json({ 
        error: 'Twilio not configured. Please set up Twilio credentials.' 
      });
    }

    const targetNumber = phoneNumber || defaultTargetNumber;

    // Analyze emergency type from transcribed message
    const emergencyType = analyzeEmergency(transcribedMessage || '');

    // Store call context for conversation handling
    const callContext = {
      userId,
      userData: user,
      emergencyType,
      transcribedMessage: transcribedMessage || '',
      step: 'initial'
    };

    // Always use inline TwiML - no webhooks needed
    console.log('Creating emergency call with inline TwiML...');
    console.log('User data from DB:', JSON.stringify(user, null, 2));
    
    // Helper function to convert phone numbers to digit-by-digit format
    const formatPhoneNumberDigits = (phone) => {
      if (!phone || phone === 'not provided' || phone === 'Not provided') {
        return 'not provided';
      }
      // Extract only digits from the phone number
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 0) {
        return phone; // Return original if no digits found
      }
      // Convert each digit to word and space them
      const digitWords = digits.split('').map(digit => {
        const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        return words[parseInt(digit)] || digit;
      }).join(' ');
      return digitWords;
    };
    
    // Build the message safely
    const name = (user.name || 'a person in need').toString().substring(0, 100);
    const age = (user.age || 'unknown').toString().substring(0, 20);
    const sex = (user.sex || 'unknown').toString().substring(0, 20);
    const location = (user.location || 'location unknown').toString().substring(0, 200);
    const contactRaw = (user.emergencyContact || 'not provided').toString().substring(0, 50);
    const contact = formatPhoneNumberDigits(contactRaw);
    const medical = user.medicalInfo && user.medicalInfo !== 'None provided' 
      ? (user.medicalInfo.toString().substring(0, 200)) 
      : '';
    const msg = transcribedMessage ? transcribedMessage.toString().substring(0, 500) : 'Emergency assistance is needed';
    
    // Build message parts
    const messageParts = [
      `Hello, this is an automated emergency alert system calling on behalf of ${name}.`,
      `Age: ${age}, Sex: ${sex}.`,
      `Location: ${location}.`,
      `Emergency contact: ${contact}.`
    ];
    
    if (medical) {
      messageParts.push(`Medical information: ${medical}.`);
    }
    
    messageParts.push(`Message from the person: ${msg}.`);
    
    // Determine service needed
    let serviceType = '';
    switch (emergencyType) {
      case 'fire':
        serviceType = 'Fire department services are needed.';
        break;
      case 'medical':
        serviceType = 'Ambulance and medical services are needed.';
        break;
      case 'police':
        serviceType = 'Police services are needed.';
        break;
      case 'accident':
        serviceType = 'Fire and medical services are needed for an accident.';
        break;
      default:
        serviceType = 'Emergency services are needed.';
    }
    
    // Helper function to escape XML special characters in text content
    const escapeXml = (text) => {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };
    
    // Build TwiML manually with SSML to avoid escaping issues
    let twimlXml = '<?xml version="1.0" encoding="UTF-8"?><Response>';
    
    // Add each message part with SSML prosody for slower speech
    messageParts.forEach(part => {
      const escapedText = escapeXml(part);
      twimlXml += `<Say voice="Polly.Joanna" language="en-US"><prosody rate="80%">${escapedText}</prosody></Say>`;
    });
    
    // Add service type
    const escapedServiceType = escapeXml(serviceType);
    twimlXml += `<Say voice="Polly.Joanna" language="en-US"><prosody rate="80%">${escapedServiceType}</prosody></Say>`;
    
    // Add AI call message
    twimlXml += '<Say voice="Polly.Joanna" language="en-US"><prosody rate="80%">This is an AI call. Can you please send help as soon as possible?</prosody></Say>';
    
    // Wait 3 seconds before hanging up
    twimlXml += '<Pause length="3"/>';
    
    twimlXml += '<Hangup/></Response>';
    
    // Log the TwiML for debugging
    const twimlString = twimlXml;
    console.log('Generated TwiML length:', twimlString.length);
    console.log('Generated TwiML:', twimlString);
    
    try {
      const call = await twilioClient.calls.create({
        twiml: twimlString,
        to: targetNumber,
        from: twilioPhoneNumber
      });
      
      // Store call context
      activeCalls.set(call.sid, callContext);
      
      console.log('Call created successfully. Call SID:', call.sid);
      
      res.json({
        success: true,
        callSid: call.sid,
        message: 'Call initiated successfully',
        targetNumber: targetNumber,
        emergencyType: emergencyType
      });
    } catch (callError) {
      console.error('Detailed call error:', callError);
      console.error('Error code:', callError.code);
      console.error('Error message:', callError.message);
      throw callError;
    }

  } catch (error) {
    console.error('Error making call:', error);
    
    // Provide helpful error messages for common issues
    let errorMessage = 'Failed to make call';
    let userFriendlyMessage = error.message;
    
    if (error.code === 21219) {
      userFriendlyMessage = `The number ${phoneNumber || '+13614259843'} is not verified in your Twilio account. Trial accounts can only call verified numbers. Please verify the number in your Twilio console or upgrade your account.`;
    } else if (error.code === 21610) {
      userFriendlyMessage = 'The phone number format is invalid. Please use E.164 format (e.g., +13614259843)';
    } else if (error.status === 400) {
      userFriendlyMessage = error.message;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: userFriendlyMessage,
      code: error.code
    });
  }
});

// Removed webhook endpoints - using inline TwiML only

// Optional: Twilio status callback (not required for inline TwiML)
app.post('/api/call-status', (req, res) => {
  console.log('Call status update:', req.body);
  const callSid = req.body.CallSid;
  
  // Clean up stored call context when call ends
  if (req.body.CallStatus === 'completed' || req.body.CallStatus === 'failed' || req.body.CallStatus === 'busy' || req.body.CallStatus === 'no-answer') {
    if (callSid && activeCalls.has(callSid)) {
      activeCalls.delete(callSid);
      console.log(`Cleaned up call context for ${callSid}`);
    }
  }
  
  res.status(200).send('OK');
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`SOS Call System server running on http://localhost:${PORT}`);
  console.log('Make sure to set up Twilio credentials in .env file');
  console.log('Using inline TwiML mode - no webhooks or ngrok required!');
});

