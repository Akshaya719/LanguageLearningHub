# TaskMaster Deployment Guide

## Environment Variables Required

```bash
DATABASE_URL=postgresql://username:password@host:port/database
GEMINI_API_KEY=your_google_gemini_api_key
SESSION_SECRET=your_random_session_secret
REPLIT_DOMAINS=your-domain.replit.app
ISSUER_URL=https://replit.com/oidc
```

## Database Setup

1. Create PostgreSQL database
2. Run migrations:
```bash
npm run db:push
```

## Installation Commands

```bash
npm install
npm run build
npm start
```

## Project Structure Overview

- `/client` - React frontend with TypeScript
- `/server` - Express.js backend with TypeScript  
- `/shared` - Shared types and database schemas
- Key files: package.json, vite.config.ts, drizzle.config.ts

## Features Implemented

- AI task generation using Google Gemini API
- Complete CRUD operations for tasks
- User authentication with Replit Auth
- Progress tracking and analytics
- Task categorization and priority management
- Real-time suggestions based on user activity

## GitHub Repository Setup

1. Upload all source files to GitHub
2. Add environment variables to deployment platform
3. Ensure PostgreSQL database is accessible
4. Deploy using npm run build && npm start