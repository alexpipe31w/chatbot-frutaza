require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado correctamente');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Verificación fallida');
    res.sendStatus(403);
  }
});

// Webhook para recibir mensajes (POST)
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      // ✅ USAR FOR...OF EN LUGAR DE FOREACH
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const value = change.value;
            
            if (value.messages && value.messages.length > 0) {
              const message = value.messages[0];
              const from = message.from;
              const messageText = message.text?.body || 'Sin texto';

              console.log(`📩 Mensaje recibido de ${from}: ${messageText}`);

              // Responder al mensaje
              await sendWhatsAppMessage(from, `¡Hola! Soy el chatbot de Frutaza 🍎🍊\n\nRecibí tu mensaje: "${messageText}"\n\n¿En qué puedo ayudarte hoy?`);
            }
          }
        }
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.sendStatus(500);
  }
});

// Función para enviar mensajes de WhatsApp
async function sendWhatsAppMessage(to, message) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Mensaje enviado correctamente a:', to);
    return response.data;
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error.response?.data || error.message);
    throw error;
  }
}

// Ruta de inicio
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: '🤖 Chatbot Frutaza - WhatsApp API',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Webhook URL: /webhook`);
});
