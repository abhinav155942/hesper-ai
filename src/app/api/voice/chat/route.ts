import { WebSocket } from 'ws';
import { useServer } from 'next-ws';

const API_KEY = process.env.GOOGLE_API_KEY!;
const MODEL = 'gemini-1.5-flash';
const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/v1beta/models/${MODEL}:bidiGenerateContent?key=${API_KEY}`;

export function SOCKET(req, socket, head) {
  const clientWS = useServer(req, socket);
  let geminiWS: WebSocket | null = null;
  let audioBuffer = Buffer.alloc(0);

  clientWS.on('open', function open() {
    console.log('Client connected to voice chat');
    
    // Correct Gemini Live API WebSocket URL
    const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-exp:bidiGenerateContent?key=${process.env.GOOGLE_API_KEY}`;
    geminiWS = new WebSocket(GEMINI_WS_URL);
    
    geminiWS.onopen = () => {
      console.log('Connected to Gemini Live API');
      
      // Correct initial setup message
      const setupMessage = {
        bidiGenerateContentSetup: {
          model: 'gemini-1.5-flash-exp',
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
            responseModality: 'AUDIO',  // Changed to enable audio output
            responseModalities: ['AUDIO'],  // Or use array for multimodal
          },
          systemInstruction: {
            parts: [{ text: 'You are Hesper, a conversational AI assistant for business development. Respond naturally and help with lead generation queries.' }]
          },
          tools: []
        }
      };
      geminiWS.send(JSON.stringify(setupMessage));
      
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
          
          // Handle text responses from candidates
          if (message.candidates && message.candidates[0]?.content?.parts[0]?.text) {
            const text = message.candidates[0].content.parts[0].text;
            clientWS.send(JSON.stringify({ 
              type: 'response', 
              text: text 
            }));
          }
          
          // Handle server response messages (text/audio)
          if (message.response) {
            if (message.response.text) {
              clientWS.send(JSON.stringify({ type: 'response', text: message.response.text }));
            }
            if (message.response.audio && message.response.audio.data) {
              // Assuming base64 audio data from Gemini
              const audioBuffer = Buffer.from(message.response.audio.data, 'base64');
              clientWS.send(audioBuffer, { binary: true });
            }
          }
          
          // Handle end of response
          if (message.endOfTurn) {
            clientWS.send(JSON.stringify({ type: 'response-end' }));
          }
        } catch (e) {
          console.error('Gemini message parse error:', e, event.data);
        }
      } else {
        // Binary audio chunk from Gemini (likely MP3 or WAV)
        console.log('Received binary audio from Gemini, length:', event.data.length);
        clientWS.send(event.data, { binary: true });
      }
    };
  });

  clientWS.on('message', function message(data) {
    // Flush buffer if Gemini is ready
    if (!geminiWS || geminiWS.readyState !== WebSocket.OPEN) {
      console.log('Gemini not ready, buffering message');
      if (Buffer.isBuffer(data)) {
        audioBuffer = Buffer.concat([audioBuffer, data]);
      }
      return;
    }

    // Flush buffered audio
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
          geminiWS.send(JSON.stringify(endTurn));
        }
        // Handle other text commands if needed
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    } else if (Buffer.isBuffer(data)) {
      // Handle PCM audio binary data
      forwardAudio(data);
    }
  });

  function forwardAudio(audioData: Buffer) {
    if (!geminiWS || geminiWS.readyState !== WebSocket.OPEN) {
      return;
    }

    // Convert PCM to base64 for Gemini Live API
    const base64Audio = audioData.toString('base64');
    
    const realtimeInput = {
      bidiGenerateContentRealtimeInput: {
        audio: {
          data: base64Audio,
          mimeType: 'audio/pcm;rate=16000;bytes=2'  // 16-bit PCM
        }
      }
    };
    
    console.log('Sending audio to Gemini, length:', audioData.length);
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