# TaskMaster - AI-Powered Task Management Application

## Overview

TaskMaster is a full-stack web application that helps users manage tasks efficiently with AI-powered task generation. The application leverages Google Gemini API to create personalized learning tasks and provides comprehensive task management with progress tracking, categorization, and completion analytics. Built with modern tech stack focusing on TypeScript, React, and Node.js.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared components:

- **Frontend**: React-based SPA using Vite for build tooling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth integration
- **AI Integration**: Google Gemini API for task generation
- **UI Framework**: shadcn/ui components with Radix UI primitives

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (Neon serverless)
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Replit Auth with OpenID Connect
- **API Architecture**: RESTful endpoints with proper error handling
- **Validation**: Zod schemas for request/response validation

### Database Schema
The application uses three main tables:
- **Users**: Stores user authentication and profile information (required for Replit Auth)
- **Tasks**: Core task entities with categorization, priority, and completion tracking
- **Sessions**: Session storage for authentication (required for Replit Auth)

### Authentication System
- **Provider**: Replit Auth using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Security**: HTTP-only cookies with CSRF protection
- **User Management**: Automatic user creation/updates on authentication

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, creating or updating user records
2. **Task Generation**: Users input a topic, which triggers a Gemini API call to generate 5 personalized learning tasks
3. **Task Management**: Generated tasks can be saved, edited, deleted, and marked as complete
4. **Progress Tracking**: The system calculates completion rates and provides visual progress indicators
5. **Real-time Updates**: TanStack Query manages cache invalidation and real-time UI updates

## External Dependencies

### Core Dependencies
- **@google/genai**: Google Gemini API integration for AI task generation
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **passport**: Authentication middleware
- **express-session**: Session management

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety across the entire stack
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migration and introspection tools

### AI Integration
The application integrates with Google Gemini API to generate contextual language learning tasks. The AI system:
- Accepts topic and language parameters
- Generates 5 structured tasks with categories, priorities, and time estimates
- Returns JSON-formatted responses for consistent data handling
- Handles API errors gracefully with fallback mechanisms

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with ES modules
- **Database**: PostgreSQL 16 (auto-provisioned)
- **Build Process**: Vite for frontend, esbuild for backend
- **Hot Reloading**: Vite HMR for frontend, tsx for backend development

### Production Deployment
- **Platform**: Replit with autoscale deployment target
- **Build Command**: `npm run build` (builds both frontend and backend)
- **Start Command**: `npm run start` (serves production build)
- **Port Configuration**: External port 80 mapping to internal port 5000
- **Static Assets**: Frontend builds to `dist/public`, served by Express

### Environment Configuration
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY`: Google AI API credentials
- `SESSION_SECRET`: Session encryption key
- `REPLIT_DOMAINS`: Required for Replit Auth
- `ISSUER_URL`: OIDC issuer URL (defaults to Replit)

## Recent Changes
- June 25, 2025: Completed TaskMaster - AI-powered task management application
  - Implemented Google Gemini API integration for AI task generation
  - Created comprehensive task CRUD operations with PostgreSQL
  - Built React frontend with shadcn/ui components
  - Added progress tracking, categorization, and completion analytics
  - Integrated Replit Auth for user authentication
  - Added real-time task suggestions based on user activity

## User Preferences

Preferred communication style: Simple, everyday language.