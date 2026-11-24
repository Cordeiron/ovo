import { ServerResponse } from 'node:http';
import { ApiRequest, handleScores } from '../lib/rebecaCore';

export default async function handler(req: ApiRequest, res: ServerResponse): Promise<void> {
  await handleScores(req, res);
}
