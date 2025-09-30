import { WebSocket } from 'ws';
import { useServer } from 'next-ws';
import textToSpeech from '@google-cloud/text-to-speech';

const API_KEY = process.env.GOOGLE_API_KEY!;
const MODEL = 'gemini-1.5-flash-exp';
const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/v1beta/models/${MODEL}:bidiGenerateContent?key=${API_KEY}`;

export function SOCKET(req, socket, head) {
  const clientWS = useServer(req, socket);
  let geminiWS: WebSocket | null = null;
  let audioBuffer = Buffer.alloc(0);
  let sessionConfigured = false;

  clientWS.on('open', function open() {
    console.log('Client connected to voice chat');
    
    geminiWS = new WebSocket(GEMINI_WS_URL);
    
    geminiWS.onopen = () => {
      console.log('Connected to Gemini Live API');
      
      // Send setup message first
      const setupMessage = {
        bidiGenerateContentSetup: {
          model: MODEL,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
            responseModality: 'AUDIO',
          },
          systemInstruction: {
            parts: [{ text: 'You are Hesper, a conversational AI assistant for business development. Respond naturally and help with lead generation queries.' }]
          },
          tools: []
        }
      };
      geminiWS.send(JSON.stringify(setupMessage));
      sessionConfigured = true;
      
      clientWS.send(JSON.stringify({ type: 'connected', message: 'Voice chat ready' }));
    };

    geminiWS.onerror = (err) => {
      console.error('Gemini WS error:', err);
      clientWS.send(JSON.stringify({ type: 'error', message: 'AI connection failed' }));
    };

    geminiWS.onclose = (event) => {
      console.log('Gemini connection closed:', event.code, event.reason);
      clientWS.send(JSON.stringify({ type: 'disconnected', message: 'AI disconnected' }));
    };

    geminiWS.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data);
          console.log('Received from Gemini:', message);
          
          if (message.endOfTurn) {
            clientWS.send(JSON.stringify({ type: 'response-end' }));
            return;
          }
          
          if (message.serverResponse) {
            if (message.serverResponse.text) {
              clientWS.send(JSON.stringify({ type: 'response', text: message.serverResponse.text }));
            }
            return;
          }
          
          if (message.candidates && message.candidates.length > 0) {
            const candidate = message.candidates[0];
            const parts = candidate.content?.parts || [];
            let text = '';
            let hasAudio = false;
            
            for (const part of parts) {
              if (part.text) {
                text += part.text;
              }
              if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/')) {
                const base64Audio = part.inlineData.data;
                const audioData = Buffer.from(base64Audio, 'base64');
                console.log(`Audio chunk: ${audioData.length} bytes`);
                clientWS.send(audioData, { binary: true });
                hasAudio = true;
              }
            }
            
            if (text.trim() && !hasAudio) {
              // Fallback to TTS if no audio from Gemini
              generateTTSAudio(text).then(audioBuffer => {
                if (audioBuffer) {
                  clientWS.send(audioBuffer, { binary: true });
                }
                clientWS.send(JSON.stringify({ type: 'response', text: text.trim() }));
              });
            } else if (text.trim()) {
              clientWS.send(JSON.stringify({ type: 'response', text: text.trim() }));
            }
          }
        } catch (e) {
          console.error('Parse error:', e);
          // Fallback TTS on error
          if (typeof event.data === 'string') {
            const match = event.data.match(/"text":"([^"]+)"/);
            if (match) {
              const text = match[1];
              generateTTSAudio(text).then(audioBuffer => {
                if (audioBuffer) clientWS.send(audioBuffer, { binary: true });
                clientWS.send(JSON.stringify({ type: 'response', text }));
              });
            }
          }
        }
      } else {
        clientWS.send(event.data, { binary: true });
      }
    };
  });

  clientWS.on('message', function message(data) {
    if (!sessionConfigured) {
      console.log('Session not configured, buffering');
      if (Buffer.isBuffer(data)) {
        audioBuffer = Buffer.concat([audioBuffer, data]);
      }
      return;
    }

    // Flush buffered audio if any
    if (audioBuffer.length > 0) {
      forwardAudio(audioBuffer);
      audioBuffer = Buffer.alloc(0);
    }

    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'end-turn') {
          const endTurn = {
            bidiGenerateContentRealtimeInput: { 
              endOfTurn: true 
            }
          };
          if (geminiWS && geminiWS.readyState === WebSocket.OPEN) {
            geminiWS.send(JSON.stringify(endTurn));
          }
        }
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    } else if (Buffer.isBuffer(data)) {
      // Handle incoming PCM audio from client
      forwardAudio(data);
    }
  });

  async function generateTTSAudio(text: string): Promise<Buffer | null> {
    try {
      const client = new textToSpeech.TextToSpeechClient();
      const request = {
        input: { text: text },
        voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
        audioConfig: { 
          audioEncoding: 'LINEAR16',
          sampleRateHertz: 16000,
          speakingRate: 1.0
        },
      };
      const [response] = await client.synthesizeSpeech(request);
      return Buffer.from(response.audioContent as string, 'base64');
    } catch (err) {
      console.error('TTS fallback error:', err);
      return null;
    }
  }

  function forwardAudio(audioData: Buffer) {
    if (!geminiWS || geminiWS.readyState !== WebSocket.OPEN) {
      return;
    }

    // Convert PCM buffer to base64
    const base64Audio = audioData.toString('base64');
    
    const realtimeInput = {
      bidiGenerateContentRealtimeInput: {
        audio: {
          data: base64Audio,
          mimeType: 'audio/pcm;rate=16000'
        }
      }
    };
    
    console.log('Forwarding audio to Gemini, length:', audioData.length);
    geminiWS.send(JSON.stringify(realtimeInput));
  }

  clientWS.on('close', function close() {
    console.log('Client disconnected');
    if (geminiWS) {
      geminiWS.close();
    }
  });

  clientWS.on('error', function error(err) {
    console.error('Client WS error:', err);
    if (geminiWS) {
      geminiWS.close();
    }
  });
}