import { WebSocket } from 'ws';
import { useServer } from 'next-ws';
import { NextRequest } from 'next/server'; // If needed for Hesper integration

export function SOCKET(req, socket, head) {
  const clientWS = useServer(req, socket);
  let hesperStream: any = null; // Placeholder for Hesper streaming response
  let buffer = ''; // For accumulating partial messages

  clientWS.on('open', function open() {
    console.log('Client connected to Hesper voice chat');
    clientWS.send(JSON.stringify({ type: 'connected', message: 'Hesper voice chat ready' }));
  });

  clientWS.on('message', function message(data) {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'transcript') {
          // Handle incoming transcribed text from client STT
          const userMessage = parsed.text;
          console.log('User message:', userMessage);
          
          // Call Hesper API for response
          handleHesperRequest(userMessage, clientWS);
        } else if (parsed.type === 'end-turn') {
          // End streaming if active
          if (hesperStream) {
            hesperStream.destroy();
            hesperStream = null;
          }
          clientWS.send(JSON.stringify({ type: 'response-end' }));
        }
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }
  });

  async function handleHesperRequest(message: string, ws: any) {
    try {
      // POST to Hesper chat API for streaming response
      const response = await fetch('http://localhost:3000/api/hesper/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bearer_token') || ''}`, // If auth required
        },
        body: JSON.stringify({
          message,
          model: 'hesper-1.0v', // Or selected model
          stream: true // Enable streaming
        })
      });

      if (!response.body) {
        ws.send(JSON.stringify({ type: 'error', message: 'No response body' }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      // Stream Hesper response chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        buffer += chunk;

        // Parse SSE-like chunks from Hesper (assuming delta format)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6));
              if (jsonData.choices && jsonData.choices[0].delta?.content) {
                const delta = jsonData.choices[0].delta.content;
                fullResponse += delta;
                ws.send(JSON.stringify({ type: 'response', text: delta })); // Send partial text for real-time display
              }
            } catch (e) {
              console.error('Chunk parse error:', e);
            }
          }
        }
      }

      // Final full response for TTS trigger on client
      ws.send(JSON.stringify({ type: 'response', text: fullResponse, final: true }));
    } catch (err) {
      console.error('Hesper request error:', err);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to get Hesper response' }));
    }
  }

  clientWS.on('close', function close() {
    console.log('Client disconnected');
    if (hesperStream) hesperStream.destroy();
  });

  clientWS.on('error', function error(err) {
    console.error('Client WS error:', err);
  });
}