# Netlify Deployment Guide

This project is configured for deployment on Netlify using Next.js 15.

## Configuration Files

- `netlify.toml` - Netlify build configuration
- `next.config.ts` - Next.js configuration
- `package.json` - Build scripts

## Deployment Steps

### 1. Connect to Netlify

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository (GitHub, GitLab, or Bitbucket)
4. Select your repository

### 2. Configure Build Settings

Netlify will auto-detect the settings from `netlify.toml`, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 20

### 3. Set Environment Variables

Go to **Site settings** → **Environment variables** and add the following:

#### Required Environment Variables:

```
TURSO_CONNECTION_URL=<your-turso-database-url>
TURSO_AUTH_TOKEN=<your-turso-auth-token>
BETTER_AUTH_SECRET=<your-auth-secret>
```

#### Optional (for PayPal integration):

```
PAYPAL_CLIENT_ID=<your-paypal-client-id>
PAYPAL_SECRET=<your-paypal-secret>
PAYPAL_CLIENT_SECRET=<your-paypal-client-secret>
NEXT_PUBLIC_PAYPAL_CLIENT_ID=<your-paypal-client-id>
```

### 4. Deploy

Click **Deploy site** and Netlify will:
1. Install dependencies
2. Run the build command
3. Deploy to a global CDN

## Features Enabled

✅ Next.js 15 App Router  
✅ Server-Side Rendering (SSR)  
✅ API Routes  
✅ Image Optimization (Netlify Image CDN)  
✅ Automatic HTTPS  
✅ Global CDN  
✅ Deploy Previews for Pull Requests

## Build Configuration

The `netlify.toml` file configures:
- **@netlify/plugin-nextjs**: Automatically applies OpenNext adapter
- **Node 20**: Ensures compatibility
- **Context-specific environments**: Different settings for production vs preview

## Database

This app uses Turso (LibSQL) as the database. Make sure to:
1. Set up your Turso database
2. Add the connection credentials to Netlify environment variables
3. Database migrations are already applied

## Troubleshooting

### Build fails
- Check that all environment variables are set in Netlify
- Verify Node version is 20
- Check build logs in Netlify dashboard

### Functions timeout
- Netlify functions have a 10-second timeout on free tier
- Upgrade to Pro for 26-second timeout

### Database connection issues
- Verify `TURSO_CONNECTION_URL` and `TURSO_AUTH_TOKEN` are correct
- Check Turso dashboard for connection limits

## Additional Resources

- [Netlify Docs - Next.js](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
- [Deploy Next.js 15 on Netlify](https://www.netlify.com/blog/deploy-nextjs-15/)
