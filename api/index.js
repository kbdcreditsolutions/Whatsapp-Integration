require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

const { createClient } = require('@supabase/supabase-js');

// Supabase Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Middleware
app.use(cors());
app.use(express.json());

// --- Configuration ---

// Interakt Configuration
const INTERAKT_BASE_URL = 'https://api.interakt.ai/v1/public';
const getInteraktHeaders = () => {
  if (!process.env.INTERAKT_API_KEY) {
    throw new Error('INTERAKT_API_KEY is not set in environment variables');
  }
  return {
    'Authorization': `Basic ${process.env.INTERAKT_API_KEY}`,
    'Content-Type': 'application/json'
  };
};

// Meta WhatsApp Cloud API Configuration
const getMetaHeaders = () => {
  if (!process.env.META_ACCESS_TOKEN) {
    throw new Error('META_ACCESS_TOKEN is not set in environment variables');
  }
  return {
    'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  };
};


// --- OUTBOUND API ENDPOINTS ---

/**
 * Sync User with Interakt (Only relevant for Interakt users)
 */
app.post('/api/interakt/track/users', async (req, res) => {
  try {
    const { userId, phoneNumber, countryCode, traits } = req.body;
    if (!phoneNumber || !countryCode) return res.status(400).json({ error: 'phoneNumber and countryCode are required' });

    const payload = {
      userId: userId || undefined,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      traits: traits || {}
    };

    const response = await axios.post(`${INTERAKT_BASE_URL}/track/users/`, payload, { headers: getInteraktHeaders() });
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error tracking user in Interakt:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ success: false, error: error.response?.data || 'Internal Server Error' });
  }
});

/**
 * Unified Message Sending Wrapper
 * Accepts `provider`: "interakt" or "meta"
 */
app.post('/api/whatsapp/message', async (req, res) => {
  try {
    const { provider, countryCode, phoneNumber, templateName, languageCode, bodyValues, buttonValues } = req.body;

    if (!countryCode || !phoneNumber || !templateName) {
      return res.status(400).json({ error: 'countryCode, phoneNumber, and templateName are required' });
    }

    const targetProvider = provider || 'interakt'; // Default to interakt for backwards compatibility

    if (targetProvider === 'interakt') {
      // -------------------------------------
      // Interakt Payload Construction
      // -------------------------------------
      const payload = {
        countryCode: countryCode,
        phoneNumber: phoneNumber,
        type: 'Template',
        template: {
          name: templateName,
          languageCode: languageCode || 'en',
          headerValues: [], 
          bodyValues: bodyValues || [],
          buttonValues: buttonValues || {}
        }
      };

      const response = await axios.post(`${INTERAKT_BASE_URL}/message/`, payload, { headers: getInteraktHeaders() });
      return res.status(200).json({ success: true, data: response.data, provider: 'interakt' });

    } else if (targetProvider === 'meta') {
      // -------------------------------------
      // Meta Cloud API Payload Construction
      // -------------------------------------
      const isSandbox = req.body.isSandbox === true;
      const accessToken = isSandbox ? process.env.TEST_META_ACCESS_TOKEN : process.env.META_ACCESS_TOKEN;
      const phoneNumberId = isSandbox ? process.env.TEST_META_PHONE_NUMBER_ID : process.env.META_PHONE_NUMBER_ID;

      if (!phoneNumberId || !accessToken) {
        if (isSandbox) {
          console.log(`[SANDBOX MOCK] Missing Meta keys, but sandbox mode is ON. Simulating successful send to ${countryCode}${phoneNumber}...`);
          return res.status(200).json({ 
            success: true, 
            data: {
              messaging_product: "whatsapp",
              contacts: [{ input: `${countryCode.replace('+', '')}${phoneNumber}`, wa_id: `${countryCode.replace('+', '')}${phoneNumber}` }],
              messages: [{ id: `wamid.MOCK_${Date.now()}` }]
            },
            provider: 'meta',
            mocked: true
          });
        } else {
          throw new Error('Meta credentials missing. Please configure META_ACCESS_TOKEN and META_PHONE_NUMBER_ID.');
        }
      }

      const metaHeaders = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // Convert bodyValues ["John", "Order #123"] to Meta format [{type: "text", text: "John"}, ...]
      const parameters = (bodyValues || []).map(val => ({
        type: 'text',
        text: val
      }));

      const fullPhoneNumber = `${countryCode.replace('+', '')}${phoneNumber}`;
      
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: fullPhoneNumber,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode || 'en' },
          components: parameters.length > 0 ? [
            {
              type: "body",
              parameters: parameters
            }
          ] : []
        }
      };

      const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
      const response = await axios.post(url, payload, { headers: metaHeaders });
      
      // Save outbound message to Supabase
      if (supabase && response.data.messages && response.data.messages.length > 0) {
        const messageId = response.data.messages[0].id;
        await supabase.from('messages').insert([{
          phone_number: fullPhoneNumber,
          message_id: messageId,
          direction: 'outbound',
          type: 'template',
          content: `Template: ${templateName}`,
          status: 'sent'
        }]);
      }

      return res.status(200).json({ success: true, data: response.data, provider: 'meta' });
      
    } else {
      return res.status(400).json({ error: { message: 'Invalid provider specified. Use "interakt" or "meta".' } });
    }

  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    
    let errorObj = error.response?.data?.error || { message: error.message || 'Internal Server Error' };
    
    // Intercept specific Meta sandbox error
    if (errorObj.code === 131030) {
      errorObj.message = "Because you are using Meta Test Keys, you can only send messages to numbers verified in your Meta Dashboard 'Manage phone number list'. Please verify the recipient number there first, or switch to production keys.";
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorObj
    });
  }
});


// --- INBOUND WEBHOOKS ---

/**
 * Meta Webhook Verification (GET)
 * Meta requires you to return the hub.challenge value if the hub.verify_token matches.
 */
app.get('/api/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

/**
 * Unified Webhook Receiver (POST)
 * Receives delivery statuses and inbound messages from both Interakt and Meta.
 */
app.post('/api/webhooks/whatsapp', async (req, res) => {
  try {
    const payload = req.body;

    // Detect Meta Payload Format (Usually wrapped in `object: "whatsapp_business_account"`)
    if (payload.object) {
      if (payload.entry && payload.entry[0].changes && payload.entry[0].changes[0].value) {
        const value = payload.entry[0].changes[0].value;
        
        // Meta Status Update
        if (value.statuses) {
          const status = value.statuses[0];
          console.log(`[META STATUS] Message ${status.id} to ${status.recipient_id} is now ${status.status}`);
          if (supabase) {
            await supabase.from('messages')
              .update({ status: status.status })
              .eq('message_id', status.id);
          }
        }
        
        // Meta Inbound Message
        if (value.messages) {
          const message = value.messages[0];
          const contacts = value.contacts;
          let profileName = null;
          if (contacts && contacts.length > 0 && contacts[0].profile) {
            profileName = contacts[0].profile.name;
          }

          console.log(`[META INBOUND] Received message from ${message.from}`);
          if (supabase) {
            let content = '';
            if (message.type === 'text') content = message.text.body;
            else if (message.type === 'button') content = message.button.text;
            else content = `[${message.type}]`;

            const insertData = {
              phone_number: message.from,
              message_id: message.id,
              direction: 'inbound',
              type: message.type,
              content: content,
              status: 'received'
            };

            if (profileName) insertData.profile_name = profileName;

            const { error } = await supabase.from('messages').insert([insertData]);
            
            // If insertion fails due to missing profile_name column (e.g. user hasn't run the SQL yet), retry without it.
            if (error && profileName) {
              console.warn("Insert failed, retrying without profile_name:", error.message);
              delete insertData.profile_name;
              await supabase.from('messages').insert([insertData]);
            }
          }
        }
      }
    } 
    // Detect Interakt Payload Format
    else if (payload.type) {
      if (payload.type === 'message_status_update') {
        const { message_id, status, phone_number } = payload.data;
        console.log(`[INTERAKT STATUS] Message ${message_id} to ${phone_number} is now ${status}`);
        // TODO: Update SaaS DB
      } else if (payload.type === 'new_message') {
        const { message_id, text, phone_number } = payload.data;
        console.log(`[INTERAKT INBOUND] Received message from ${phone_number}: ${text}`);
        // TODO: Update SaaS DB
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});


// --- ENDPOINTS FOR INBOX UI ---

/**
 * Get Conversations
 */
app.get('/api/whatsapp/conversations', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'WhatsApp multi-provider proxy is running' });
});

/**
 * Send Free-form text Reply (Outbound)
 */
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    if (!phoneNumber || !message) return res.status(400).json({ error: 'phoneNumber and message are required' });

    const accessToken = process.env.META_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

    if (!phoneNumberId || !accessToken) {
      return res.status(500).json({ error: 'Meta credentials missing' });
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    };

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const response = await axios.post(url, payload, { headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }});

    if (supabase && response.data.messages && response.data.messages.length > 0) {
      const messageId = response.data.messages[0].id;
      const insertData = {
        phone_number: phoneNumber,
        message_id: messageId,
        direction: 'outbound',
        type: 'text',
        content: message,
        status: 'sent'
      };
      
      const { error } = await supabase.from('messages').insert([insertData]);
      if (error) {
         delete insertData.profile_name;
         await supabase.from('messages').insert([insertData]); // fallback
      }
    }

    return res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error sending reply:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || 'Internal Server Error' });
  }
});

// Start Server (Only if not in Vercel environment)
if (process.env.VERCEL_ENV !== 'production' && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
