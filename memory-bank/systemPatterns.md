# System Patterns: TweetWiseAI

## Architecture Overview

### Application Structure

```
Next.js 14+ App Router Architecture
├── Frontend (React 18+ with TypeScript)
├── API Routes (Next.js API handlers)
├── Database (Neon PostgreSQL)
├── Authentication (NextAuth.js)
└── External Services (OpenAI API)
```

### Key Architectural Decisions

#### 1. Next.js App Router Pattern

- **Choice**: Next.js 14+ with App Router over Pages Router
- **Reasoning**: Better performance, improved developer experience, built-in optimization
- **Implementation**: Server components by default, client components only when needed

#### 2. Three-Panel Dashboard Layout

- **Pattern**: Fixed layout with collapsible sidebars
- **Structure**:
  ```
  ┌─────────────┬─────────────────┬─────────────┐
  │ History     │ Composition     │ AI          │
  │ & Drafts    │ Area            │ Suggestions │
  │ (Left)      │ (Center)        │ (Right)     │
  └─────────────┴─────────────────┴─────────────┘
  ```
- **Responsive**: Collapsible panels for mobile/tablet

#### 3. Component Architecture

```
src/components/
├── features/           # Feature-specific components
│   ├── auth/          # Authentication components
│   ├── tweet-composer/ # Main composition interface
│   ├── tweet-history/ # History and draft management
│   └── ai-suggestions/ # AI feedback and suggestions
├── ui/                # Reusable UI components
│   ├── button/        # Button variants
│   ├── input/         # Form inputs
│   ├── card/          # Content containers
│   └── loading/       # Loading states
└── layout/            # Layout components
```

## Data Flow Patterns

### 1. AI Request Pattern

```
User Input → Debounce (500ms) → API Request → Response Processing → UI Update
```

#### Implementation Details

- **Debouncing**: Prevent excessive API calls during active typing
- **Batching**: Combine multiple corrections into single requests
- **Caching**: Store responses to avoid duplicate requests
- **Error Handling**: Graceful degradation with retry logic

### 2. Draft Management Pattern

```
User Types → Auto-save (30s) → Local State → Database Sync → History Update
```

#### State Management

- **Local State**: React hooks for immediate UI updates
- **Optimistic Updates**: Show changes immediately, sync in background
- **Conflict Resolution**: Last-write-wins with user notification

### 3. Authentication Flow

```
Login → NextAuth Session → Protected Routes → User Context → Feature Access
```

## Database Schema Patterns

### Core Entities

```sql
-- Users table
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Tweets table
tweets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  status VARCHAR CHECK (status IN ('draft', 'completed')),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- AI responses cache
ai_responses (
  id UUID PRIMARY KEY,
  tweet_id UUID REFERENCES tweets(id),
  type VARCHAR CHECK (type IN ('spelling', 'grammar', 'critique')),
  request_hash VARCHAR UNIQUE, -- For caching
  response_data JSONB,
  created_at TIMESTAMP
)
```

### Indexing Strategy

- **User queries**: Index on user_id for tweet history
- **AI caching**: Index on request_hash for response lookup
- **Temporal queries**: Index on created_at for chronological sorting

## API Design Patterns

### 1. RESTful API Structure

```
/api/auth/          # Authentication endpoints
/api/tweets/        # Tweet CRUD operations
/api/ai/           # AI service endpoints
├── spell-check    # Spell checking service
├── grammar-check  # Grammar checking service
├── critique       # Tweet analysis service
└── curate         # Content curation service
```

### 2. AI Service Pattern

```typescript
interface AIServiceRequest {
  content: string;
  type: 'spelling' | 'grammar' | 'critique';
  options?: {
    debounce?: boolean;
    cache?: boolean;
  };
}

interface AIServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  cached?: boolean;
}
```

### 3. Error Handling Pattern

```typescript
// Consistent error response format
interface APIError {
  success: false;
  error: string;
  code: string;
  details?: any;
}
```

## Performance Optimization Patterns

### 1. AI Request Optimization

- **Debouncing**: 500ms delay for user input
- **Request Batching**: Combine multiple corrections
- **Response Caching**: Redis/memory cache for repeated requests
- **Fallback Handling**: Graceful degradation when AI services fail

### 2. Frontend Optimization

- **Code Splitting**: Lazy load AI features
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large tweet history lists
- **Optimistic Updates**: Immediate UI feedback

### 3. Database Optimization

- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Proper indexing and query structure
- **Pagination**: Limit data transfer for history views

## Security Patterns

### 1. Authentication Security

- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure HTTP-only cookies
- **CSRF Protection**: Built-in Next.js protection
- **Input Validation**: Zod schemas for all inputs

### 2. API Security

- **Rate Limiting**: Prevent abuse of AI endpoints
- **Input Sanitization**: Clean user content before processing
- **Environment Variables**: Secure API key management
- **HTTPS Enforcement**: All communications encrypted

## Testing Patterns

### 1. Component Testing

- **React Testing Library**: User-centric testing approach
- **Jest**: Test runner with coverage reporting
- **Mock Services**: Mock AI API responses for testing

### 2. Integration Testing

- **API Testing**: Test all endpoints with various inputs
- **Database Testing**: Test data persistence and retrieval
- **Authentication Testing**: Test protected routes and sessions

## Deployment Patterns

### 1. Vercel Deployment

- **Edge Functions**: Optimal global performance
- **Environment Management**: Separate staging/production
- **Automatic Deployments**: Git-based deployment pipeline

### 2. Database Management

- **Neon PostgreSQL**: Serverless database with branching
- **Migration Strategy**: Version-controlled schema changes
- **Backup Strategy**: Automated backups and point-in-time recovery

## Monitoring and Observability

### 1. Error Tracking

- **Frontend Errors**: Client-side error boundary handling
- **API Errors**: Structured logging for debugging
- **AI Service Errors**: Track API failures and response times

### 2. Performance Monitoring

- **Response Times**: Track AI service performance
- **User Interactions**: Monitor feature usage patterns
- **System Health**: Database and API health checks

## Scalability Considerations

### 1. Horizontal Scaling

- **Stateless Design**: No server-side state dependencies
- **Database Scaling**: Read replicas for query optimization
- **CDN Integration**: Static asset optimization

### 2. Cost Optimization

- **AI API Efficiency**: Minimize unnecessary requests
- **Caching Strategy**: Reduce repeated API calls
- **Resource Monitoring**: Track usage patterns for optimization

This system architecture provides a solid foundation for the TweetWiseAI platform while maintaining flexibility for future enhancements and scaling requirements.
