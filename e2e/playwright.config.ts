import { defineConfig, devices } from '@playwright/test';
import {
  ADMIN,
  BACKEND_PORT,
  BACKEND_URL,
  DATABASE,
  FRONTEND_PORT,
  FRONTEND_URL,
} from './support/environment';

const maven = process.platform === 'win32' ? '.\\mvnw.cmd' : './mvnw';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    baseURL: FRONTEND_URL,
    locale: 'es-BO',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      name: 'Backend',
      command: `${maven} -q spring-boot:run`,
      cwd: '../backend',
      url: `${BACKEND_URL}/api/health`,
      env: {
        DB_URL: `jdbc:postgresql://localhost:5432/${DATABASE}`,
        PORT: String(BACKEND_PORT),
        ADMIN_EMAIL: ADMIN.email,
        ADMIN_PASSWORD: ADMIN.password,
      },
      timeout: 240_000,
      reuseExistingServer: false,
    },
    {
      name: 'Frontend',
      command: `npx ng serve --port ${FRONTEND_PORT} --proxy-config ../e2e/proxy.json`,
      cwd: '../frontend',
      url: FRONTEND_URL,
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
});
