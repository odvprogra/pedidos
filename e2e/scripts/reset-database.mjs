import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const database = 'pedidos_e2e';
const compose = fileURLToPath(new URL('../../docker-compose.yml', import.meta.url));

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

run('docker', ['compose', '-f', compose, 'up', '-d', '--wait']);
run('docker', [
  'exec',
  'pedidos-db',
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
