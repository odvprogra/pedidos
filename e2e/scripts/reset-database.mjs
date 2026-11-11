import { execFileSync, spawnSync } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const database = 'pedidos_e2e';
const container = 'pedidos-db';
const compose = fileURLToPath(new URL('../../docker-compose.yml', import.meta.url));
const startupAttempts = 30;

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

function acceptsConnections() {
  const check = spawnSync('docker', [
    'exec',
    container,
    'pg_isready',
    '--quiet',
    '-h',
    '127.0.0.1',
    '-U',
    'pedidos',
  ]);
  return check.status === 0;
}

async function waitForPostgres() {
  for (let attempt = 0; attempt < startupAttempts; attempt++) {
    if (acceptsConnections()) {
      return;
    }
    await wait(1000);
  }
  throw new Error(`PostgreSQL no aceptó conexiones después de ${startupAttempts} segundos.`);
}

run('docker', ['compose', '-f', compose, 'up', '-d', '--wait']);
await waitForPostgres();
run('docker', [
  'exec',
  container,
  'psql',
  '--quiet',
  '-U',
  'pedidos',
  '-d',
  'postgres',
  '-v',
  'ON_ERROR_STOP=1',
  '-c',
  `drop database if exists ${database} with (force)`,
  '-c',
  `create database ${database} owner pedidos`,
]);
console.log(`Base ${database} lista y vacía.`);
