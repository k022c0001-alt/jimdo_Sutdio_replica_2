import http from 'http';
import { WebSocketServer } from 'ws';
import app from './app';

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Set<any>();

wss.on('connection', (ws: any) => {
  clients.add(ws);

  ws.on('message', (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());
      // Broadcast to all other clients
      clients.forEach(client => {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify(msg));
        }
      });
    } catch (err) {
      console.warn('WebSocket: malformed message ignored', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
});
