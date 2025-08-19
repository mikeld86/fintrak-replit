# Overview

This is a Financial Position Calculator application built as a full-stack web application. The app allows users to calculate their current financial position through cash counting (Australian currency denominations), weekly income and expense tracking, and automated balance calculations. It features user authentication through Replit Auth, theme customization, and persistent data storage.

## Recent Changes (August 2025)
- ✓ Complete application implementation with PostgreSQL database
- ✓ Australian cash denomination calculator with automatic subtotals
- ✓ Cascading calculations from cash counter through Week 1 to Week 2
- ✓ Customizable income and expense rows with editable labels
- ✓ Permanent dark theme implementation without light/dark toggle functionality
- ✓ Real-time auto-save functionality with 1-second debounce
- ✓ Clear all data functionality with confirmation dialog
- ✓ Cross-device synchronization through user authentication
- ✓ Responsive design optimized for desktop and mobile devices
- ✓ Mobile-specific UI: Theme controls hidden, auto-detects device dark/light mode
- ✓ iOS optimizations: Blue theme default, system preference detection, touch targets
- ✓ Comprehensive dark theme styling fixes - all input fields, headers, and text colors
- ✓ Consistent dark input backgrounds (bg-input) and proper text contrast throughout
- ✓ Fixed sticky header transparency with opaque dark background
- ✓ FINTRAK logo integration replacing text heading with proper responsive sizing
- ✓ Collapsible quick-add shortcuts with smaller buttons for better mobile space
- ✓ Optimized bank accounts layout with reduced padding and mobile-responsive spacing
- ✓ Removed containers around sections for improved mobile screen utilization
- ✓ Private access restriction - only User ID 46429020 can access application
- ✓ Professional access denied screen for unauthorized users
- ✓ Complete PWA implementation with FINTRAK icon and service worker
- ✓ Multiple icon sizes for favicon, Apple touch icon, and Android chrome
- ✓ Web app manifest for mobile installation and offline functionality
- ✓ Landing page removed - direct access to financial calculator
- ✓ Blue border theme implementation - all input fields and containers use #3B82F6 blue borders
- ✓ Font transparency reduced to 85% for improved readability
- ✓ Bank account section styling updated to match consistent page theme

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern React application using functional components and hooks
- **Vite Build System**: Fast development server and optimized production builds
- **shadcn/ui Component Library**: Pre-built UI components with Radix UI primitives and Tailwind CSS styling
- **TanStack React Query**: Server state management for API calls and caching
- **Wouter**: Lightweight client-side routing
- **Theme System**: Custom theme context supporting multiple color themes (blue, green, purple) and dark/light modes

## Backend Architecture
- **Express.js Server**: REST API backend with middleware for logging and error handling
- **TypeScript**: Full type safety across the application
- **Session-based Authentication**: Express sessions with PostgreSQL session store
- **RESTful API Design**: CRUD operations for financial data and user preferences
- **Modular Storage Layer**: Interface-based storage abstraction for database operations

## Database Design
- **PostgreSQL with Drizzle ORM**: Type-safe database operations and schema management
- **Neon Database**: Serverless PostgreSQL hosting
- **Schema Structure**:
  - Users table with theme preferences and profile data
  - Financial data table with cash denominations and weekly calculations
  - Sessions table for authentication state
  - Foreign key relationships with cascade deletion

## Authentication System
- **Replit Auth Integration**: OpenID Connect authentication flow
- **Passport.js Strategy**: Streamlined auth middleware
- **Session Management**: Secure session storage with configurable TTL
- **User Preference Sync**: Automatic user creation and preference persistence

## State Management
- **Client State**: React hooks and context for UI state
- **Server State**: TanStack Query for API data caching and synchronization
- **Theme State**: Persistent theme preferences with localStorage fallback
- **Financial Data**: Real-time calculations with optimistic updates

## External Dependencies

- **Neon Database**: Serverless PostgreSQL database hosting
- **Replit Auth**: Authentication service integration
- **shadcn/ui**: Component library built on Radix UI and Tailwind CSS
- **Google Fonts**: Typography (DM Sans, Geist Mono, Fira Code, Architects Daughter)
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Drizzle ORM**: TypeScript ORM for PostgreSQL