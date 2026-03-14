import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../database/sites.json");
const PORT = Number(process.env.PORT ?? 3001);

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const users = [
  {
    id: "user-1",
    name: "Admin",
    username: "admin",
    password: "admin123",
  },
];

async function readSites() {
  const raw = await readFile(dbPath, "utf8");
  const sites = JSON.parse(raw);
  return sites.map(normalizeSite);
}

async function writeSites(sites) {
  await writeFile(dbPath, `${JSON.stringify(sites, null, 2)}\n`, "utf8");
}

function calculateGrowth(existingPricePerYear, newPricePerYear) {
  if (existingPricePerYear === 0) {
    return 0;
  }

  const value =
    ((newPricePerYear - existingPricePerYear) / existingPricePerYear) * 100;
  return Number(value.toFixed(2));
}

function normalizeSite(site) {
  if (Array.isArray(site.negotiationComments)) {
    return {
      ...site,
      negotiationComments: site.negotiationComments,
    };
  }

  const fallbackGrowth = calculateGrowth(
    site.existingPricePerYear,
    site.newPricePerYear,
  );
  const legacyNotes =
    typeof site.negotiationHistory === "string" ? site.negotiationHistory : "";
  const negotiationComments = legacyNotes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((note, index) => ({
      id: `legacy-${site.id}-${index + 1}`,
      newPricePerYear: site.newPricePerYear,
      growth: fallbackGrowth,
      note,
      editedAt: new Date(0).toISOString(),
      editedBy: "Legacy Data",
    }));

  return {
    ...site,
    negotiationComments,
  };
}

function send(res, status, payload) {
  res.writeHead(status, jsonHeaders);
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
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
    req.on("error", reject);
  });
}

function getTokenForUser(user) {
  return `llms:${user.username}`;
}

function getUserFromToken(token) {
  if (!token || !token.startsWith("llms:")) {
    return null;
  }
  const username = token.slice(5);
  return users.find((item) => item.username === username) ?? null;
}

function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  return getUserFromToken(token);
}

function requireAuth(req, res) {
  const user = getAuthUser(req);
  if (!user) {
    send(res, 401, { message: "Unauthorized" });
    return null;
  }
  return user;
}

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    send(res, 400, { message: "Invalid request" });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, jsonHeaders);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname === "/api/login") {
    try {
      const { username, password } = await parseBody(req);
      if (typeof username !== "string" || typeof password !== "string") {
        send(res, 400, { message: "Username and password are required." });
        return;
      }

      const user = users.find((item) => item.username === username);
      if (!user || user.password !== password) {
        send(res, 401, { message: "Invalid username or password." });
        return;
      }

      send(res, 200, {
        token: getTokenForUser(user),
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
        },
      });
    } catch {
      send(res, 400, { message: "Invalid JSON body" });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/me") {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }
    send(res, 200, {
      id: user.id,
      name: user.name,
      username: user.username,
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/sites") {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }
    const sites = await readSites();
    send(res, 200, sites);
    return;
  }

  const siteMatch = url.pathname.match(/^\/api\/sites\/([^/]+)$/);
  if (req.method === "GET" && siteMatch) {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }
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
  if (req.method === "PUT" && leaseMatch) {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }
    try {
      const siteId = leaseMatch[1];
      const {
        existingPricePerYear,
        newPricePerYear,
        negotiationHistory,
        negotiationNote,
      } = await parseBody(req);
      const note =
        typeof negotiationNote === "string"
          ? negotiationNote
          : negotiationHistory;

      if (
        typeof existingPricePerYear !== "number" ||
        typeof newPricePerYear !== "number" ||
        typeof note !== "string"
      ) {
        send(res, 400, {
          message:
            "Request body must include numeric existingPricePerYear/newPricePerYear and string negotiationNote",
        });
        return;
      }

      const sites = await readSites();
      const siteIndex = sites.findIndex((item) => item.id === siteId);
      if (siteIndex === -1) {
        send(res, 404, { message: `Site ${siteId} not found` });
        return;
      }

      const growth = calculateGrowth(existingPricePerYear, newPricePerYear);
      const newComment = {
        id: `comment-${Date.now()}`,
        newPricePerYear,
        growth,
        note,
        editedAt: new Date().toISOString(),
        editedBy: user.name,
      };

      const updatedSite = {
        ...sites[siteIndex],
        existingPricePerYear,
        newPricePerYear,
        negotiationComments: [
          newComment,
          ...(sites[siteIndex].negotiationComments ?? []),
        ],
      };

      sites[siteIndex] = updatedSite;
      await writeSites(sites);

      send(res, 200, updatedSite);
    } catch {
      send(res, 400, { message: "Invalid JSON body" });
    }
    return;
  }

  send(res, 404, { message: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
