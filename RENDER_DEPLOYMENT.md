# Deploying MTG Data App to Render

This guide explains how to deploy the MTG Data application to Render.com with proper secret management for production.

## Prerequisites

1. A [Render.com](https://render.com) account
2. Your backend API deployed and accessible (or the API URL you'll be using)
3. This repository pushed to GitHub, GitLab, or Bitbucket

## Deployment Options

### Option 1: Using render.yaml (Recommended)

This is the easiest method as Render will automatically configure your service from the `render.yaml` file.

1. **Connect Your Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your Git repository
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment Variables**
   - After connecting, Render will show you the services to be created
   - Click on the service to configure environment variables
   - Set the following required environment variables:
     
     | Variable | Description | Example |
     |----------|-------------|---------|
     | `API_URL` | Your backend API endpoint | `https://your-api.onrender.com` |
     | `ENABLE_ANALYTICS` | Enable/disable analytics | `true` or `false` |
     | `TOKEN_KEY` | Key for storing auth token | `mtg_auth_token` |
     | `USER_KEY` | Key for storing user data | `mtg_auth_user` |

3. **Deploy**
   - Click "Apply" to create the service
   - Render will automatically build and deploy your application
   - The build will run: `npm ci && npm run build:prod`

### Option 2: Manual Static Site Creation

1. **Create New Static Site**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Static Site"
   - Connect your Git repository

2. **Configure Build Settings**
   - **Name**: `mtg-data-frontend` (or your preferred name)
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `npm ci && npm run build:prod`
   - **Publish Directory**: `dist/mtg-data/browser`

3. **Set Environment Variables**
   - In the "Environment" section, add the following variables:
     ```
     NODE_VERSION=20
     API_URL=https://your-api-url.onrender.com
     ENABLE_ANALYTICS=true
     TOKEN_KEY=mtg_auth_token
     USER_KEY=mtg_auth_user
     ```

4. **Configure Routing (Important for SPAs)**
   - Under "Redirects/Rewrites" section
   - Add a rewrite rule:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Type**: Rewrite

5. **Deploy**
   - Click "Create Static Site"
   - Render will build and deploy your application

## Environment Variables Explained

### Required Variables

- **API_URL**: The full URL of your backend API
  - This is the most critical variable
  - Example: `https://mtg-api.onrender.com`
  - Make sure this matches your actual backend deployment

### Optional Variables

- **ENABLE_ANALYTICS**: 
  - Set to `true` to enable analytics tracking
  - Set to `false` to disable
  - Default: `false`

- **TOKEN_KEY**: 
  - The localStorage key used for storing authentication tokens
  - Default: `mtg_auth_token`
  - Only change if you have a specific reason

- **USER_KEY**: 
  - The localStorage key used for storing user data
  - Default: `mtg_auth_user`
  - Only change if you have a specific reason

## How It Works

### Build Process

1. When you deploy to Render, the `build:prod` script runs:
   ```bash
   node scripts/set-env.js && ng build --configuration production
   ```

2. The `set-env.js` script:
   - Reads environment variables from the Render environment
   - Generates a new `environment.prod.ts` file with actual values
   - Ensures no secrets are committed to the repository

3. Angular builds with the injected environment variables

### Security Considerations

- ✅ Environment variables are never committed to the repository
- ✅ Secrets are managed through Render's secure environment variable system
- ✅ The `environment.prod.ts` file is regenerated on each build
- ✅ Different environments (staging, production) can have different secrets

## Updating Environment Variables

To update environment variables after deployment:

1. Go to your Render Dashboard
2. Select your static site
3. Click "Environment" in the left sidebar
4. Add or update variables
5. Click "Save Changes"
6. Render will automatically redeploy with the new values

## Using Environment Groups (Optional)

For managing multiple services with shared configuration:

1. In Render Dashboard, go to "Environment Groups"
2. Create a new group (e.g., "mtg-data-prod")
3. Add your environment variables to the group
4. Link the group to your service
5. All services in the group will share these variables

## Troubleshooting

### Build Fails

- Check that `scripts/set-env.js` is present in your repository
- Verify the `NODE_VERSION` environment variable is set to 20
- Check build logs for specific error messages

### API Connection Issues

- Verify the `API_URL` is correct and accessible
- Check that your backend API allows CORS from your Render domain
- Test the API URL in your browser or with curl

### Environment Variables Not Applied

- Make sure you clicked "Save Changes" after updating variables
- Trigger a manual deploy: Dashboard → Manual Deploy → Deploy latest commit
- Check that `build:prod` script is used in the build command

## Continuous Deployment

Render automatically deploys when you push to your connected branch:

1. Push changes to your repository
2. Render detects the push
3. Runs the build command
4. Deploys the new version

To disable auto-deploy:
- Go to Settings → Auto-Deploy
- Toggle off

## Custom Domains

To use a custom domain:

1. Go to Settings → Custom Domains
2. Add your domain
3. Configure DNS records as shown
4. Render provides free SSL certificates

## Monitoring

Render provides:
- Build logs
- Deploy history
- Bandwidth usage
- Service health checks

Access these from your service dashboard.

## Cost

Static sites on Render:
- Free tier: Available with limitations
- Paid tier: Starting at $7/month for more bandwidth and features

## Support

For issues specific to this deployment:
- Check the Render [documentation](https://render.com/docs)
- Review build logs in the Render dashboard
- Check environment variable configuration

## Local Testing of Production Build

To test the production build locally:

1. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your local values

3. Build and serve:
   ```bash
   # For Windows PowerShell
   $env:API_URL="http://localhost:7194"; npm run build:prod
   
   # Then serve the built files
   npx http-server dist/mtg-data/browser
   ```

4. Open http://localhost:8080 to test

## Next Steps

After successful deployment:

1. Test all functionality with the production API
2. Set up monitoring and alerts
3. Configure a custom domain
4. Set up staging environment (optional)
5. Document your production URL for team members
