import { ServerResponse } from 'node:http';
import { ApiRequest, handleScores } from './_lib/rebecaCore.js';

export default async function handler(req: ApiRequest, res: ServerResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  await handleScores(req, res);
}
