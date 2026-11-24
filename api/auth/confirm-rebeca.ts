import { ServerResponse } from 'node:http';
import { ApiRequest, handleConfirmRebeca } from '../../lib/rebecaCore';

export default async function handler(req: ApiRequest, res: ServerResponse): Promise<void> {
  await handleConfirmRebeca(req, res);
}
