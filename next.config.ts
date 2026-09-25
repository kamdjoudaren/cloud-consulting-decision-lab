import type { NextConfig } from 'next';
const config: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'playwright', 'playwright-core'],
  devIndicators: false,
};
export default config;
