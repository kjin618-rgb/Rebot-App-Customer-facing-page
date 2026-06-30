import type { IncomingMessage, ServerResponse } from 'http';
import { handleApiRequest } from '../src/lib/stamp-handlers';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not_found' }));
    }
  } catch (err) {
    console.error('[API Error]', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'internal_server_error', detail: String(err) }));
    }
  }
}
