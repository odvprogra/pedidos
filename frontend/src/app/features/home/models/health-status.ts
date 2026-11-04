export interface HealthStatus {
  status: string;
  javaVersion: string;
  springBootVersion: string;
  databaseConnected: boolean;
  databaseVersion: string | null;
}
