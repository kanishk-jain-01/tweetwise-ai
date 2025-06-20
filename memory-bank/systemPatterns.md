# System Patterns: TweetWiseAI

## Architecture Overview

### Application Structure

```
Next.js 15.3.4 App Router Architecture
├── Frontend (React 19 with TypeScript)
├── API Routes (Next.js API handlers)
├── Database (Neon PostgreSQL)
├── Authentication (NextAuth.js)
└── External Services (OpenAI API)
```

### Key Architectural Decisions

#### 1. Next.js App Router Pattern

- **Choice**: Next.js 15.3.4 with App Router over Pages Router
- **Reasoning**: Better performance, improved developer experience, built-in optimization
- **Implementation**: Server components by default, client components only when needed

#### 2. Three-Panel Dashboard Layout (IMPLEMENTED)

- **Pattern**: Fixed layout with responsive collapsible sidebars
- **Structure**:
  ```
  ┌─────────────┬─────────────────┬─────────────┐
  │ History     │ Composition     │ AI          │
  │ & Drafts    │ Area            │ Suggestions │
  │ (Left)      │ (Center)        │ (Right)     │
  └─────────────┴─────────────────┴─────────────┘
  ```
- **Responsive Behavior**:
  - Desktop (lg+): All three panels visible
  - Tablet (md+): History hidden, Composer + AI visible
  - Mobile: Only Composer visible, side panels via drawer navigation
- **Mobile Navigation**: Header buttons trigger sheet/drawer overlays

#### 3. Conditional Layout System (IMPLEMENTED)

- **Pattern**: Different layouts for landing pages vs. dashboard
- **Implementation**:
  ```typescript
  // Dashboard pages: No header/footer (app-like experience)
  // Landing pages: Full header + content + footer
  const isDashboard = pathname?.startsWith('/dashboard');
  ```
- **Benefits**: Clean app experience without landing page navigation

#### 4. Component Architecture (IMPLEMENTED)

```
src/components/
├── features/           # Feature-specific components
│   ├── auth/          # Authentication components
│   ├── tweet-composer/ # Main composition interface
│   ├── tweet-history/ # History and draft management
│   └── ai-suggestions/ # AI feedback and suggestions
├── ui/                # Reusable UI components (shadcn/ui)
│   ├── button/        # Button variants
│   ├── input/         # Form inputs
│   ├── card/          # Content containers
│   ├── loading/       # Loading states and skeletons
│   └── badge/         # Status indicators
└── layout/            # Layout-specific components
    ├── conditional-layout.tsx    # Route-based layout switching
    ├── dashboard-header.tsx      # Dashboard-specific header
    ├── user-profile-dropdown.tsx # User management
    └── mobile-nav-buttons.tsx    # Mobile navigation
```

## Data Flow Patterns

### 1. Tweet Composition Flow (IMPLEMENTED)

```
User Input → Character Count → Auto-save (30s) → Draft Storage → AI Triggers (500ms debounce)
```

#### Implementation Details

- **Real-time Character Counting**: Visual progress ring with color coding
- **Auto-save**: Every 30 seconds with visual feedback and error handling
- **Debounced AI Triggers**: 500ms delay to prevent excessive API calls
- **State Management**: Custom `useTweetComposer` hook

### 2. Responsive Layout Flow (IMPLEMENTED)

```
Screen Size Detection → Panel Visibility → Mobile Navigation → Drawer Management
```

#### Responsive Breakpoints

- **Mobile (< 768px)**: Composer only, drawer navigation for History/AI
- **Tablet (768px - 1024px)**: Composer + AI panels, History via drawer
- **Desktop (> 1024px)**: All three panels visible

### 3. User Profile Management (IMPLEMENTED)

```
NextAuth Session → User Data Extraction → Avatar Generation → Profile Dropdown
```

#### Profile Features

- **Avatar**: Initials extracted from email/name
- **User Name**: Intelligent extraction from email prefix
- **Dropdown Menu**: Account Settings, Sign Out options

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

### 1. Dashboard Performance (IMPLEMENTED)

- **Component Memoization**: React.memo for expensive components
- **Debounced Inputs**: 500ms delay for AI triggers and search
- **Optimistic Updates**: Immediate UI feedback with background sync
- **Skeleton Loading**: Smooth loading states for all panels

### 2. Mobile Performance (IMPLEMENTED)

- **Drawer Animations**: Smooth sheet transitions using shadcn/ui
- **Touch Interactions**: Optimized for mobile gestures
- **Responsive Images**: Proper sizing for different screen densities
- **Lazy Loading**: Panels load only when accessed on mobile

### 3. State Management Patterns (IMPLEMENTED)

```typescript
// Custom hooks pattern for feature-specific state
const useTweetComposer = () => {
  const [content, setContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState('saved');

  // Auto-save logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim()) {
        saveDraft(content);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [content]);

  return { content, setContent, charCount, saveStatus };
};
```

## UI/UX Design Patterns

### 1. Character Count Visualization (IMPLEMENTED)

```typescript
// Color-coded character count with visual progress
const getCharacterCountColor = (count: number) => {
  if (count <= 252) return 'text-green-600'; // Normal
  if (count <= 280) return 'text-yellow-600'; // Warning
  return 'text-red-600'; // Over-limit
};

// Progress ring visualization
const progressPercentage = Math.min((count / 280) * 100, 100);
```

### 2. Loading State Patterns (IMPLEMENTED)

- **Skeleton Components**: Consistent loading states across all panels
- **Loading Spinners**: For AI processing and API calls
- **Progressive Enhancement**: Content loads in stages for better perceived performance

### 3. Mobile-First Design (IMPLEMENTED)

- **Touch Targets**: Minimum 44px for all interactive elements
- **Drawer Navigation**: Smooth slide-in panels for mobile
- **Responsive Typography**: Scales appropriately across devices
- **Accessible Navigation**: Screen reader friendly mobile navigation

## Error Handling Patterns

### 1. Dashboard Error Boundaries (PREPARED)

```typescript
// Error boundary pattern for dashboard panels
const DashboardErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<DashboardErrorFallback />}
      onError={(error) => logError('Dashboard', error)}
    >
      {children}
    </ErrorBoundary>
  )
}
```

### 2. Graceful Degradation (IMPLEMENTED)

- **Auto-save Failures**: Visual feedback with retry options
- **Network Issues**: Offline-friendly state management
- **Component Failures**: Fallback UI components

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

## Form Validation Pattern

### shadcn/ui Form Components

- **Pattern**: Use `shadcn/ui` form components for consistent styling and behavior.
- **Structure**:

  ```tsx
  import { Form, Input, Button } from 'shadcn/ui';
  import { useForm } from 'react-hook-form';
  import { zodResolver } from '@hookform/resolvers/zod';
  import { z } from 'zod';

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  const MyForm = () => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm({
      resolver: zodResolver(schema),
    });

    const onSubmit = data => console.log(data);

    return (
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Input {...register('email')} placeholder="Email" />
        {errors.email && <span>{errors.email.message}</span>}

        <Input
          {...register('password')}
          type="password"
          placeholder="Password"
        />
        {errors.password && <span>{errors.password.message}</span>}

        <Button type="submit">Submit</Button>
      </Form>
    );
  };
  ```

### Notifications with sonner

- **Pattern**: Use `sonner` for toast notifications to provide feedback.
- **Implementation**:

  ```tsx
  import { Toaster, toast } from 'sonner';

  const notifySuccess = () => toast.success('Form submitted successfully!');
  const notifyError = () =>
    toast.error('There was an error submitting the form.');

  const MyComponent = () => (
    <>
      <Toaster />
      <button onClick={notifySuccess}>Show Success</button>
      <button onClick={notifyError}>Show Error</button>
    </>
  );
  ```

- **Reasoning**: Provides a consistent and accessible way to notify users of form submission results.

This system architecture provides a solid foundation for the TweetWiseAI platform while maintaining flexibility for future enhancements and scaling requirements.
