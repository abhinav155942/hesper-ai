# Next.js Application with 3D Game Development

## Overview
This is a comprehensive Next.js application featuring:
- 3D game development with React Three Fiber (@react-three/fiber and @react-three/drei)
- User authentication using Better Auth
- Payment integration with PayPal
- Voice chat integration with Gemini API
- Email functionality
- Subscription management
- Turso (LibSQL) database with Drizzle ORM

## Current State
- **Frontend**: Next.js 15.3.5 running on port 5000
- **Database**: Turso (LibSQL) with Drizzle ORM
- **Authentication**: Better Auth with email/password
- **Payments**: PayPal integration
- **3D Graphics**: React Three Fiber for game development

## Project Architecture

### Tech Stack
- **Framework**: Next.js 15.3.5 (App Router)
- **Language**: TypeScript
- **3D Graphics**: React Three Fiber, Three.js, Drei
- **Database**: Turso (LibSQL) via Drizzle ORM
- **Authentication**: Better Auth
- **Payments**: PayPal
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI, Framer Motion
- **Forms**: React Hook Form with Zod validation

### Project Structure
```
├── src/
│   ├── app/              # Next.js app router pages and API routes
│   ├── components/       # React components
│   ├── db/              # Database schema and seeds
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configurations
│   └── visual-edits/    # Visual editing tools
├── public/              # Static assets
└── drizzle/            # Database migrations
```

### Key Features
1. **3D Game Development**: Uses React Three Fiber for building interactive 3D games
2. **User Management**: Sign up, sign in, email verification (disabled by default)
3. **Subscriptions**: Basic and Pro tier subscription management
4. **Payment Processing**: PayPal order creation and capture
5. **Voice Chat**: Gemini API integration for voice interactions
6. **Email System**: SMTP settings and email sending capabilities
7. **Settings Management**: Business intro, differences, pros, email format customization

## Environment Variables
Required environment variables (already configured in .env):
- `TURSO_CONNECTION_URL`: Turso database connection URL
- `TURSO_AUTH_TOKEN`: Turso database authentication token
- `BETTER_AUTH_SECRET`: Secret for Better Auth sessions
- `PAYPAL_CLIENT_ID`: PayPal client ID
- `PAYPAL_SECRET`: PayPal secret key
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`: PayPal client ID (public)
- `GEMINI_API_KEY`: Gemini API key for voice chat (in server.js)

## Development

### Running Locally
The application is configured to run on port 5000 with host 0.0.0.0 for Replit compatibility.

```bash
npm run dev
```

Access at: http://localhost:5000

### Database
- Uses Turso (LibSQL) as the database
- Drizzle ORM for database operations
- Migration files in `/drizzle` directory
- Schema defined in `src/db/schema.ts`
- Seed data in `src/db/seeds/`

### Build & Deploy
```bash
npm run build  # Build for production
npm start      # Run production server
```

## Recent Changes
- **2025-10-04**: Initial setup in Replit environment
  - Configured Next.js dev server to run on port 5000 with 0.0.0.0 host
  - Installed all dependencies (npm install completed successfully)
  - Set up "Start Game" workflow for automatic server startup
  - Verified environment variables are properly configured (Turso, Better Auth, PayPal, Gemini)
  - Fixed viewport configuration by moving from metadata to separate viewport export (Next.js 15 compliance)
  - Configured deployment settings for autoscale with npm build and start commands
  - Application running successfully and accessible via webview

## User Preferences
- None documented yet

## Important Notes
- The dev server is configured with `-H 0.0.0.0 -p 5000` to work with Replit's proxy environment
- Turbopack is enabled with custom loaders for visual editing
- Email verification is disabled by default in Better Auth configuration
- The application uses Next.js 15 App Router (not Pages Router)
