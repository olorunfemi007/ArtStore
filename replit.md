# STUDIODROP

## Overview

STUDIODROP is a premium, minimalist art e-commerce platform inspired by Yeezy.com's clean "drop" aesthetic. It's a single-artist painting store featuring original artworks, limited edition prints, and open editions. The platform includes a full customer-facing storefront with cart functionality, checkout, and account management, plus a comprehensive admin panel for artwork, order, and drop management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React useState for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Fonts**: Space Grotesk (display) and Inter (body text)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Build System**: esbuild for server bundling, Vite for client

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Key Tables**: 
  - `users` - Admin authentication
  - `artworks` - Paintings with full metadata (dimensions, medium, pricing, editions)
  - `customers` - Customer accounts and profiles
  - `addresses` - Shipping addresses
  - `orders` - Order records with status tracking
  - `drops` - Scheduled collection releases with countdowns
  - `subscribers` - Newsletter/waitlist signups
  - `collections` - Curated groups of artworks (name, slug, description, heroImage, featured)
  - `collectionArtworks` - Many-to-many join table linking collections to artworks with ordering

### API Structure
All API routes are defined in `server/routes.ts`:
- `/api/artworks` - CRUD for artworks
- `/api/customers` - Customer management
- `/api/orders` - Order processing
- `/api/drops` - Drop/collection scheduling
- `/api/subscribers` - Newsletter subscriptions
- `/api/collections` - Collections CRUD (GET by id or slug, POST, PATCH, DELETE)
- `/api/collections/:idOrSlug/artworks` - Manage artworks in a collection

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route-level page components
    lib/          # Utilities, API helpers, hooks
    hooks/        # Custom React hooks
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  storage.ts      # Database operations
  db.ts           # Database connection
shared/           # Shared between client/server
  schema.ts       # Drizzle database schema
```

### Design Patterns
- **Storage Interface**: `IStorage` interface in `server/storage.ts` abstracts database operations
- **API Hooks**: Custom React Query hooks in `client/src/lib/hooks.ts` for data fetching
- **Type Safety**: Drizzle-zod generates Zod schemas from database tables for validation
- **Mock Data**: `client/src/lib/mockData.ts` provides fallback data during development

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations in `./migrations` directory

### Third-Party Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms)
- **TanStack Query**: Server state management and caching
- **Framer Motion**: Animation library
- **Zod**: Runtime type validation
- **date-fns**: Date formatting utilities

### Development Tools
- **Vite**: Development server with HMR
- **Replit Plugins**: Runtime error overlay, dev banner, cartographer for navigation
- **TypeScript**: Strict mode enabled with path aliases

### Payment Processing (Stripe)
- **Stripe Integration**: Fully implemented with secure server-side amount calculation
- **Security**: Backend calculates all amounts (artwork prices from DB, shipping via USPS API, tax) - frontend only sends identifiers
- **Frontend**: Uses Stripe Elements (`@stripe/react-stripe-js`, `@stripe/stripe-js`) for PCI-compliant card handling
- **Backend**: Payment intent created at `/api/stripe/create-payment-intent`
- **Flow**: Client sends item IDs, quantities, shipping mail class, destination ZIP → Server validates, calculates, creates payment intent → Client confirms with Stripe Elements
- **Secrets**: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` stored as Replit secrets

### Shipping (USPS)
- **USPS API Integration**: Real-time shipping rate calculation
- **Fallback Rates**: Calculates reasonable estimates if USPS API unavailable
- **Endpoint**: `/api/shipping/rates` accepts origin/destination ZIP and weight

### Authentication
- **Customer Auth**: Custom email/password with bcrypt hashing and express-session
- **Session Storage**: PostgreSQL-backed via connect-pg-simple

### Planned Integrations (Not Yet Implemented)
- Email notifications (nodemailer in dependencies)