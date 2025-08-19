# FINTRAK Financial Position Calculator

A comprehensive financial management application optimized for mobile and cross-device experiences, providing personal finance tracking with intuitive interfaces and professional reporting capabilities.

## Features

- **Australian Cash Calculator** - Count physical cash with denominations ($100, $50, $20, $10, $5, $2, $1, $0.50, $0.20, $0.10, $0.05)
- **Two-Week Financial Projection** - Track current and next week's financial position
- **Bank Account Integration** - Add and manage multiple bank accounts
- **Quick-Add Shortcuts** - Pre-configured income and expense buttons
- **Export Capabilities** - Generate Excel and PDF reports
- **Cross-Device Sync** - Access your data from any device
- **PWA Support** - Install as a mobile app
- **Dark Theme** - Professional dark interface with blue accent colors
- **Private Access** - Restricted to authorized user only

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build system and development
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack React Query** for server state
- **Wouter** for routing

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database with Drizzle ORM
- **Replit Auth** for authentication
- **Zod** for validation

### Database
- **Neon PostgreSQL** serverless hosting
- **Session-based authentication**
- **Cascade deletion** for data integrity

## Project Structure

```
├── client/src/          # Frontend React application
│   ├── components/      # Reusable UI components
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   └── assets/         # Static assets (logos, images)
├── server/             # Express.js backend
├── shared/             # Shared types and schemas
├── attached_assets/    # User-uploaded assets and branding
└── package.json        # Dependencies and scripts
```

## Key Components

### Cash Calculator (`client/src/components/cash-calculator.tsx`)
- Australian currency denomination counting
- Real-time subtotal calculations
- Automatic total calculation

### Week Calculator (`client/src/components/week-calculator.tsx`)
- Week 1: Cash + Bank Accounts + Income - Expenses
- Week 2: Week 1 Balance + Income - Expenses
- Dynamic row management for income/expenses

### Bank Accounts (`client/src/components/bank-accounts.tsx`)
- Add/remove bank accounts dynamically
- Real-time balance calculations

### Quick Add Shortcuts (`client/src/components/quick-add-shortcuts.tsx`)
- Pre-configured income values: Centrelink ($963.53), Sales ($100/$200/$450), D5 ($500)
- Pre-configured expenses: Restock ($2000), Rent ($1300), Electricity ($50), Phone ($225), Internet ($85)

### Export System (`client/src/lib/exportUtils.ts`)
- Excel export with multiple worksheets
- PDF export with professional formatting
- Summary reports with calculations

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Replit account (for authentication)

### Environment Variables
```bash
DATABASE_URL=postgresql://username:password@host/database
PGHOST=your-postgres-host
PGPORT=5432
PGDATABASE=your-database-name
PGUSER=your-username
PGPASSWORD=your-password
```

### Installation Steps

1. Install dependencies:
```bash
npm install
```

2. Set up database schema:
```bash
npm run db:push
```

3. Start development server:
```bash
npm run dev
```

4. Access application:
```
http://localhost:5000
```

## Database Schema

### Users Table
- User authentication data
- Theme preferences
- Profile information

### Financial Data Table
- Cash denominations (decimal precision)
- Bank account rows (JSONB)
- Week 1/2 income/expense rows (JSONB)
- User association with cascade delete

### Sessions Table
- Replit Auth session storage
- Automatic cleanup on expiry

## Security Features

- **Private Access Control** - Only User ID 46429020 can access
- **Session-based Authentication** - Secure login with Replit Auth
- **Input Validation** - Zod schemas on all API endpoints
- **CORS Protection** - Proper origin handling
- **SQL Injection Protection** - Parameterized queries with Drizzle ORM

## Mobile Optimization

- **iOS Compatibility** - Optimized for iPhone 15 Pro
- **Touch Targets** - 44px minimum button sizes
- **No Zoom** - Prevents keyboard zoom on iOS
- **PWA Support** - Installable mobile app experience
- **Responsive Design** - Works on all screen sizes

## Deployment

The application is designed for Replit deployment with:
- Automatic workflow management
- Built-in database hosting
- Authentication integration
- SSL/TLS certificates
- Custom domain support

## Architecture Decisions

### State Management
- **Client State**: React hooks and context
- **Server State**: TanStack Query for API caching
- **Theme State**: Persistent with localStorage fallback
- **Financial Data**: Real-time with optimistic updates

### Performance
- **Auto-save**: 1-second debounce for data persistence
- **Optimistic Updates**: Immediate UI feedback
- **Caching**: Intelligent query invalidation
- **Code Splitting**: Component-level imports

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML and ARIA labels
- **High Contrast**: Dark theme with proper color ratios
- **Touch Accessibility**: Large touch targets

## Development Guidelines

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Custom hooks for reusable logic
- Consistent naming conventions

### File Organization
- Components in dedicated files
- Shared types in `shared/schema.ts`
- Utilities in `lib/` directory
- Assets in `attached_assets/`

### Testing Approach
- Manual QA testing
- LSP diagnostics for code quality
- Runtime error monitoring
- Performance optimization

## Support & Maintenance

### Monitoring
- Express logging middleware
- Error boundary components
- Console error tracking
- Performance metrics

### Updates
- Automatic dependency updates
- Database migrations with Drizzle
- Version control with Git
- Deployment via Replit

---

**Built with ❤️ for efficient personal financial management**

*Last Updated: August 18, 2025*