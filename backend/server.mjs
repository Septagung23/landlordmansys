import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../database/sites.json');
const PORT = Number(process.env.PORT ?? 3001);

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

async function readSites() {
  const raw = await readFile(dbPath, 'utf8');
  return JSON.parse(raw);
}

async function writeSites(sites) {
  await writeFile(dbPath, `${JSON.stringify(sites, null, 2)}\n`, 'utf8');
}

function send(res, status, payload) {
  res.writeHead(status, jsonHeaders);
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    send(res, 400, { message: 'Invalid request' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, jsonHeaders);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/sites') {
    const sites = await readSites();
    send(res, 200, sites);
    return;
  }

  const siteMatch = url.pathname.match(/^\/api\/sites\/([^/]+)$/);
  if (req.method === 'GET' && siteMatch) {
    const siteId = siteMatch[1];
    const sites = await readSites();
    const site = sites.find((item) => item.id === siteId);

    if (!site) {
      send(res, 404, { message: `Site ${siteId} not found` });
      return;
    }

    send(res, 200, site);
    return;
  }

  const leaseMatch = url.pathname.match(/^\/api\/sites\/([^/]+)\/lease$/);
  if (req.method === 'PUT' && leaseMatch) {
    try {
      const siteId = leaseMatch[1];
      const { existingPricePerYear, newPricePerYear, negotiationHistory } = await parseBody(req);

      if (
        typeof existingPricePerYear !== 'number' ||
        typeof newPricePerYear !== 'number' ||
        typeof negotiationHistory !== 'string'
      ) {
        send(res, 400, {
          message: 'Request body must include numeric existingPricePerYear/newPricePerYear and string negotiationHistory'
        });
        return;
      }

      const sites = await readSites();
      const siteIndex = sites.findIndex((item) => item.id === siteId);
      if (siteIndex === -1) {
        send(res, 404, { message: `Site ${siteId} not found` });
        return;
      }

      const updatedSite = {
        ...sites[siteIndex],
        existingPricePerYear,
        newPricePerYear,
        negotiationHistory
      };

      sites[siteIndex] = updatedSite;
      await writeSites(sites);

      send(res, 200, updatedSite);
    } catch {
      send(res, 400, { message: 'Invalid JSON body' });
    }
    return;
  }

  send(res, 404, { message: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
