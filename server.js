import { WebSocketServer } from 'ws';
import http from 'http';
import { GoogleGenAI, LiveServerMessage, MediaResolution, Modality } from '@google/generative-ai';

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', async (ws) => {
  console.log('Client connected');
  let session = null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

    const model = 'models/gemini-2.5-flash-native-audio-preview-09-2025';

    const config = {
      responseModalities: [Modality.AUDIO],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Schedar',
          },
        },
      },
      contextWindowCompression: {
        triggerTokens: '25600',
        slidingWindow: { targetTokens: '12800' },
      },
    };

    session = await ai.live.connect({
      model,
      config,
      callbacks: {
        onopen: () => {
          console.log('Gemini session opened');
          ws.send(JSON.stringify({ type: 'open' }));
        },
        onmessage: (message) => {
          const parts = message.serverContent?.modelTurn?.parts || [];
          for (const part of parts) {
            if (part.text) {
              ws.send(JSON.stringify({ type: 'text', data: part.text }));
            }
            if (part.inlineData) {
              ws.send(JSON.stringify({ 
                type: 'audio', 
                mimeType: part.inlineData.mimeType, 
                data: part.inlineData.data 
              }));
            }
          }
          if (message.serverContent?.turnComplete) {
            ws.send(JSON.stringify({ type: 'turn-complete' }));
          }
        },
        onerror: (error) => {
          console.error('Gemini error:', error);
          ws.send(JSON.stringify({ type: 'error', data: error.message }));
        },
        onclose: () => {
          console.log('Gemini session closed');
        },
      },
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'audio' && session) {
          session.sendClientContent({
            parts: [{
              inlineData: {
                mimeType: 'audio/L16;rate=16000',
                data: msg.data,
              },
            }],
          });
        }
      } catch (err) {
        console.error('Message parse error:', err);
      }
    });

  } catch (err) {
    console.error('Session creation error:', err);
    ws.send(JSON.stringify({ type: 'error', data: err.message }));
  }

  ws.on('close', () => {
    console.log('Client disconnected');
    if (session) {
      session.close();
    }
  });
});

server.listen(3001, () => {
  console.log('WebSocket server listening on port 3001');
});