import { ServerResponse } from 'node:http';
import { ApiRequest, handleGetBundle } from '../../lib/rebecaCore';

export default async function handler(req: ApiRequest, res: ServerResponse): Promise<void> {
  await handleGetBundle(req, res);
}
