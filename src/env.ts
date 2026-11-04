import { loadEnvFile } from 'node:process';

try {
  loadEnvFile();
} catch (error) {
  // Deployed environments can supply variables without a local .env file.
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
    throw error;
  }
}
