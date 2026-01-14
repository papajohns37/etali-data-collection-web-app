/**
 * Production environment configuration
 * This file will be auto-generated at build time by scripts/set-env.js
 * when deploying to production environments like Render.
 * 
 * The values here are placeholders for local production builds.
 * Set environment variables in your hosting platform to override these values.
 */
export const environment = {
  production: true,
  apiUrl: 'https://your-api-url.onrender.com', // Will be replaced by API_URL env var
  enableSSLBypass: false,
  enableAnalytics: false, // Will be replaced by ENABLE_ANALYTICS env var
  tokenKey: 'mtg_auth_token', // Will be replaced by TOKEN_KEY env var
  userKey: 'mtg_auth_user', // Will be replaced by USER_KEY env var
};
