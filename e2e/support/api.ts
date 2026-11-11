import { APIRequestContext, APIResponse, expect, request } from '@playwright/test';
import { BACKEND_URL } from './environment';

export class Api {
  private constructor(private readonly context: APIRequestContext) {}

  static async start(): Promise<Api> {
    const context = await request.newContext({ baseURL: BACKEND_URL });
    await context.get('/api/health');
    return new Api(context);
  }

  async get<T>(path: string): Promise<T> {
    return this.read<T>(path, await this.context.get(path));
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    const response = await this.context.post(path, { data, headers: await this.csrfHeader() });
    return this.read<T>(path, response);
  }

  async put<T>(path: string, data: unknown): Promise<T> {
    const response = await this.context.put(path, { data, headers: await this.csrfHeader() });
    return this.read<T>(path, response);
  }

  async dispose(): Promise<void> {
    await this.context.dispose();
  }

  private async csrfHeader(): Promise<Record<string, string>> {
    const { cookies } = await this.context.storageState();
    const token = cookies.find((cookie) => cookie.name === 'XSRF-TOKEN')?.value ?? '';
    return { 'X-XSRF-TOKEN': token };
  }

  private async read<T>(path: string, response: APIResponse): Promise<T> {
    const body = await response.text();
    expect(response.ok(), `${path} respondió ${response.status()}: ${body}`).toBe(true);
    return (body ? JSON.parse(body) : undefined) as T;
  }
}
