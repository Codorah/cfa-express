import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT || 3000);
const MAX_BODY_BYTES = 1_000_000;
const FALLBACK_INSIGHT = 'Consultez les dernieres actualites pour des informations sur les taux.';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

const exists = async (filePath) => {
  try {
    const fileStat = await stat(filePath);
    return fileStat.isFile();
  } catch {
    return false;
  }
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const readJsonBody = async (req) => {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error('Payload too large');
    }
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf-8');
  if (!rawBody.trim()) return {};
  return JSON.parse(rawBody);
};

const getInsightFromGemini = async (from, to, amount) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `En tant qu'expert financier specialise dans les economies africaines, donne une analyse tres breve (max 2 phrases) pour la conversion de ${amount} ${from} vers ${to}. Mentionne les tendances utiles et la stabilite du Franc CFA si pertinent.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.7,
    },
  });

  return response.text?.trim() || FALLBACK_INSIGHT;
};

const handleInsightRequest = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const payload = await readJsonBody(req);
    const from = String(payload.from || '').toUpperCase().trim().slice(0, 6);
    const to = String(payload.to || '').toUpperCase().trim().slice(0, 6);
    const amount = Number(payload.amount);

    if (!from || !to || !Number.isFinite(amount) || amount <= 0) {
      return sendJson(res, 400, { error: 'Invalid payload' });
    }

    const insight = await getInsightFromGemini(from, to, amount);
    return sendJson(res, 200, { insight });
  } catch (error) {
    console.error('Insight API error:', error);
    return sendJson(res, 200, { insight: FALLBACK_INSIGHT });
  }
};

const serveStatic = async (req, res) => {
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const rawPath = decodeURIComponent(requestUrl.pathname);
  const requestedPath = rawPath === '/' ? '/index.html' : rawPath;
  const filePath = path.normalize(path.join(DIST_DIR, requestedPath));

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  const fileExists = await exists(filePath);
  if (fileExists) {
    const ext = path.extname(filePath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    const file = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(file);
    return;
  }

  if (path.extname(requestedPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const indexPath = path.join(DIST_DIR, 'index.html');
  if (await exists(indexPath)) {
    const indexFile = await readFile(indexPath);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(indexFile);
    return;
  }

  res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Build not found. Run "npm run build" before "npm start".');
};

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url || '/', 'http://localhost');

  if (requestUrl.pathname === '/api/insight') {
    await handleInsightRequest(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  await serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`CFA Express server running on http://localhost:${PORT}`);
});
