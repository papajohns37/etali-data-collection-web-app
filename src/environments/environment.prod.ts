/**
 * Production environment configuration
 */
export const environment = {
  production: true,
  apiUrl: 'https://localhost:7194', // TODO: Update with actual production API URL when deploying
  enableSSLBypass: false,
  enableAnalytics: true,
  tokenKey: 'mtg_auth_token',
  userKey: 'mtg_auth_user',
};
