// WebSocket Server for Gemini Live API
// Installation: npm install ws @google/genai
// Usage: node server.js

const WebSocket = require('ws');
const { GoogleGenAI, Modality, MediaResolution } = require('@google/genai');

const PORT = 3001;
const GEMINI_API_KEY = 'AIzaSyDdyCv2M5LhH4-QKWK5BzWqEqD24M3vfuA';

// Create WebSocket server
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on('connection', async (clientWs) => {
  console.log('Client connected');
  
  let geminiSession = null;
  const responseQueue = [];
  
  try {
    // Initialize Gemini API
    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });

    const model = 'models/gemini-2.5-flash-native-audio-preview-09-2025';

    const config = {
      responseModalities: [Modality.AUDIO],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Zephyr',
          },
        },
      },
    };

    // Connect to Gemini Live API
    geminiSession = await ai.live.connect({
      model,
      callbacks: {
        onopen: () => {
          console.log('Connected to Gemini Live API');
          clientWs.send(JSON.stringify({
            type: 'connected',
            data: 'Ready'
          }));
        },
        onmessage: (message) => {
          // Forward Gemini messages to client
          clientWs.send(JSON.stringify({
            type: 'serverMessage',
            data: message
          }));
        },
        onerror: (e) => {
          console.error('Gemini error:', e.message);
          clientWs.send(JSON.stringify({
            type: 'error',
            data: e.message
          }));
        },
        onclose: (e) => {
          console.log('Gemini session closed:', e.reason);
        },
      },
      config,
    });

    // Handle messages from client
    clientWs.on('message', async (data) => {
      try {
        const message = JSON.parse(data);

        if (message.type === 'audio') {
          // Send audio to Gemini
          if (geminiSession) {
            geminiSession.sendClientContent({
              realtimeInput: {
                mediaChunks: [
                  {
                    mimeType: message.format || 'audio/L16;rate=16000',
                    data: message.base64Audio,
                  },
                ],
              },
            });
          }
        } else if (message.type === 'text') {
          // Send text to Gemini
          if (geminiSession) {
            geminiSession.sendClientContent({
              turns: [message.text],
            });
          }
        } else if (message.type === 'endTurn') {
          // Signal end of turn
          if (geminiSession) {
            geminiSession.sendClientContent({
              turnComplete: true,
            });
          }
        }
      } catch (err) {
        console.error('Error handling client message:', err);
        clientWs.send(JSON.stringify({
          type: 'error',
          data: err.message
        }));
      }
    });

    clientWs.on('close', () => {
      console.log('Client disconnected');
      if (geminiSession) {
        geminiSession.close();
      }
    });

  } catch (err) {
    console.error('Error setting up connection:', err);
    clientWs.send(JSON.stringify({
      type: 'error',
      data: err.message
    }));
    clientWs.close();
  }
});

wss.on('error', (err) => {
  console.error('WebSocket server error:', err);
});

console.log('Server ready. Set GEMINI_API_KEY and connect clients.');