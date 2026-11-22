/**
 * Vercel Serverless API Catch-All Entry Point (/api/* -> /api/index?route=...)
 */
import { getDbAdapter } from '../server/db-adapter.js';
import { handleApiRequest } from '../server/router.js';

export default async function handler(req, res) {
  return handleApiRequest(req, res, {
    getAdapter: getDbAdapter,
    allowDiskUpload: false
  });
}
