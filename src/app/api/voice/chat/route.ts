import { WebSocket } from 'ws';
import { useServer } from 'next-ws';

export function SOCKET(req, socket, head) {
  const ws = useServer(req, socket);

  ws.on('open', function open() {
    console.log('Client connected');
  });

  ws.on('message', function message(data) {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'audio') {
        // Handle audio chunk
        console.log('Received audio chunk:', parsed.data.length);
        // For now, echo back
        ws.send(JSON.stringify({ type: 'transcript', text: 'Echo transcript' }));
      } else if (parsed.type === 'end-audio') {
        ws.send(JSON.stringify({ type: 'response', text: 'Processing complete' }));
      }
    } catch (err) {
      // Handle binary audio
      ws.send(data);
    }
  });

  ws.on('close', function close() {
    console.log('Client disconnected');
  });

  ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
  });
}