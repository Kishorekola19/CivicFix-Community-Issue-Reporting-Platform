import net from 'net';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..');
const dbPath = path.join(serverRoot, 'mongodb-data');

export function isMongoRunning(port = 27017, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export function findMongodBinary() {
  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  const cacheDir = path.join(userProfile, '.cache', 'mongodb-binaries');
  if (fs.existsSync(cacheDir)) {
    const files = fs.readdirSync(cacheDir);
    const mongodFile = files.find(f => f.startsWith('mongod') && f.endsWith('.exe')) || files.find(f => f.startsWith('mongod'));
    if (mongodFile) {
      return path.join(cacheDir, mongodFile);
    }
  }
  return null;
}

export async function ensureMongoRunning(port = 27017, host = '127.0.0.1') {
  const alreadyRunning = await isMongoRunning(port, host);
  if (alreadyRunning) {
    return;
  }

  const mongodPath = findMongodBinary();
  if (!mongodPath) {
    console.warn('[MongoDB] mongod binary not found in cache. Ensure MongoDB is running on port ' + port);
    return;
  }

  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  console.log(`[MongoDB] Launching background mongod on ${host}:${port}...`);
  const child = spawn(mongodPath, [
    '--dbpath', dbPath,
    '--port', String(port),
    '--bind_ip', host
  ], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  const start = Date.now();
  while (Date.now() - start < 15000) {
    await new Promise(r => setTimeout(r, 400));
    if (await isMongoRunning(port, host)) {
      console.log(`[MongoDB] Connected to database on ${host}:${port}`);
      return;
    }
  }

  throw new Error(`[MongoDB] Timed out waiting for mongod to start on port ${port}`);
}

async function runAsService() {
  const port = 27017;
  const host = '127.0.0.1';
  const running = await isMongoRunning(port, host);

  if (running) {
    console.log(`[MongoDB] Detected active MongoDB instance on ${host}:${port}`);
    // Keep process alive for concurrently
    setInterval(() => {}, 60000);
    return;
  }

  const mongodPath = findMongodBinary();
  if (!mongodPath) {
    console.error('[MongoDB] Binary not found. Please install MongoDB or run tests once to download it.');
    process.exit(1);
  }

  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  console.log(`[MongoDB] Starting MongoDB on ${host}:${port} [${dbPath}]`);
  const child = spawn(mongodPath, [
    '--dbpath', dbPath,
    '--port', String(port),
    '--bind_ip', host
  ], {
    stdio: 'inherit'
  });

  const cleanExit = () => {
    console.log('\n[MongoDB] Stopping MongoDB process...');
    child.kill('SIGINT');
  };

  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);

  child.on('exit', (code) => {
    console.log(`[MongoDB] Process exited with code ${code}`);
    process.exit(code || 0);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runAsService();
}
