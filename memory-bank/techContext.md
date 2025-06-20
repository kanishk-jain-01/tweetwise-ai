# Technical Context: TweetWiseAI

## Technology Stack

### Frontend Technologies

#### Core Framework

- **Next.js 15.3.4** with App Router
  - Server components by default for better performance
  - Built-in optimization and bundling
  - API routes for backend functionality
  - Turbopack for faster development builds

#### UI and Styling

- **React 19.0.0** with TypeScript
  - Latest React features and concurrent rendering
  - Strict TypeScript configuration for type safety
- **Tailwind CSS v4+** for styling
  - Utility-first CSS framework
  - Custom design system implementation
  - PostCSS integration for optimization
- **Geist fonts** (Sans and Mono) for typography
  - Modern, clean font family
  - Optimized web font loading

#### Form and Validation

- **React Hook Form 7.58.1** for form management
  - Efficient form handling with minimal re-renders
  - Built-in validation support
- **Zod 3.25.67** for schema validation
  - TypeScript-first schema validation
  - Runtime type checking
- **@hookform/resolvers 5.1.1** for Zod integration

#### Utility Libraries

- **clsx 2.1.1** for conditional class names
- **tailwind-merge 3.3.1** for Tailwind class merging
- Custom utility functions in `src/lib/utils/`

### Backend Technologies

#### Database

- **Neon PostgreSQL** (Serverless)
  - `@neondatabase/serverless 1.0.1`
  - Serverless PostgreSQL with automatic scaling
  - Built-in connection pooling
  - Branching for development/staging environments

#### Authentication

- **NextAuth.js 4.24.11**
  - Secure authentication with multiple providers
  - Session management with JWT or database sessions
  - Built-in security features (CSRF protection, etc.)

#### Password Security

- **bcryptjs 3.0.2**
  - Secure password hashing
  - Salt-based hashing for security

#### AI Integration

- **OpenAI API 5.5.1**
  - GPT-3.5-turbo for spell checking (cost-effective)
  - GPT-4 for grammar checking and critique (high accuracy)
  - Structured response handling

### Development Tools

#### Code Quality

- **ESLint 9** with Next.js config
  - Code linting and style enforcement
  - Prettier integration for formatting
  - Custom rules for project consistency

#### Testing Framework

- **Jest 30.0.2** with jsdom environment
  - Unit and integration testing
  - Coverage reporting
  - Custom test utilities
- **React Testing Library 16.3.0**
  - User-centric testing approach
  - Component testing best practices
- **@testing-library/jest-dom 6.6.3**
  - Additional Jest matchers for DOM testing

#### TypeScript Configuration

- **TypeScript 5** with strict configuration
  - Full type safety across the application
  - Custom type definitions in `src/types/`
  - Proper module resolution and path mapping

## Development Environment Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Git for version control

### Environment Configuration

#### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
```

#### Development Scripts

```json
{
  "dev": "next dev --turbopack", // Development with Turbopack
  "build": "next build", // Production build
  "start": "next start", // Production server
  "lint": "next lint", // ESLint checking
  "lint:fix": "next lint --fix", // Auto-fix linting issues
  "format": "prettier --write .", // Format all files
  "format:check": "prettier --check .", // Check formatting
  "type-check": "tsc --noEmit", // TypeScript checking
  "test": "jest --passWithNoTests", // Run tests
  "test:watch": "jest --watch", // Watch mode testing
  "test:coverage": "jest --coverage", // Coverage report
  "check-all": "npm run type-check && npm run lint && npm run format:check && npm run test"
}
```

## Project Structure

### File Organization

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── tweets/        # Tweet CRUD operations
│   │   └── ai/            # AI service endpoints
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application dashboard
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── features/         # Feature-specific components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── auth/             # Authentication utilities
│   ├── database/         # Database utilities
│   ├── ai/               # AI service utilities
│   └── utils/            # General utilities
├── styles/               # Additional styles
└── types/                # TypeScript type definitions
```

### Configuration Files

- `next.config.ts` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.mjs` - PostCSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `jest.config.js` - Jest testing configuration
- `.prettierrc.json` - Prettier formatting configuration

## Database Configuration

### Neon PostgreSQL Setup

```typescript
// Database connection configuration
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Connection pooling and optimization
const db = {
  query: sql,
  // Additional configuration for connection pooling
};
```

### Schema Management

- Database migrations using SQL files
- Version-controlled schema changes
- Separate development and production databases

## AI Service Integration

### OpenAI Configuration

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Service-specific configurations
const AI_MODELS = {
  SPELL_CHECK: 'gpt-3.5-turbo',
  GRAMMAR_CHECK: 'gpt-4',
  CRITIQUE: 'gpt-4',
  CURATION: 'gpt-4',
};
```

### Rate Limiting and Caching

- Request debouncing for user input
- Response caching for repeated queries
- Error handling and retry logic

## Security Configuration

### Authentication Security

- Secure session management with NextAuth.js
- Password hashing with bcrypt
- CSRF protection enabled by default

### API Security

- Input validation with Zod schemas
- Rate limiting for AI endpoints
- Environment variable protection

### Data Security

- Encrypted database connections
- Secure API key management
- HTTPS enforcement in production

## Performance Optimization

### Build Optimization

- Turbopack for faster development builds
- Automatic code splitting
- Image optimization with Next.js Image component
- Font optimization with next/font

### Runtime Optimization

- Server components for reduced client-side JavaScript
- Lazy loading for AI features
- Memoization for expensive operations
- Efficient database queries with proper indexing

## Deployment Configuration

### Vercel Deployment

- Automatic deployments from Git
- Edge Functions for global performance
- Environment variable management
- Preview deployments for testing

### Environment Management

- Separate staging and production environments
- Environment-specific configurations
- Secure secret management

## Monitoring and Debugging

### Development Tools

- Next.js built-in error reporting
- TypeScript strict mode for type safety
- ESLint for code quality
- Prettier for consistent formatting

### Production Monitoring

- Error boundary components
- API response time tracking
- Database query performance monitoring
- User interaction analytics

## Dependencies Management

### Production Dependencies

All production dependencies are locked to specific versions for stability:

- React ecosystem: Latest stable versions
- Database: Neon serverless client
- Authentication: NextAuth.js
- AI: OpenAI official SDK
- Validation: Zod with React Hook Form

### Development Dependencies

- Testing: Jest with React Testing Library
- Code Quality: ESLint, Prettier, TypeScript
- Build Tools: Tailwind CSS, PostCSS

### Dependency Updates

- Regular security updates
- Careful version management
- Testing before updates
- Lock file maintenance

This technical context provides the foundation for all development work on TweetWiseAI, ensuring consistency and best practices across the entire application.
