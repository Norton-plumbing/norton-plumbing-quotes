# Norton Plumbing & Gas - Professional Quoting Platform

A high-end, production-grade web and mobile quoting application for Norton Plumbing & Gas. Built with Next.js, React, TypeScript, and PostgreSQL.

## Features

### Core Quoting Engine
- ✅ Professional quote generation with live calculations
- ✅ Multi-line quoting (labour, materials, equipment, subcontractors)
- ✅ Automatic GST calculations (10%)
- ✅ Customizable markup percentages per line type
- ✅ Gross profit and margin tracking with health status
- ✅ Optional line items (can be excluded from totals)
- ✅ Quote templates and duplications

### Materials Management
- ✅ 85+ pre-loaded materials catalogue
- ✅ 14 material categories
- ✅ Fast search by product code or description
- ✅ Price history and audit trail
- ✅ Supplier references (Reece integration ready)
- ✅ Cost and markup flexibility per material
- ✅ Bulk CSV import/export ready

### Pricing & Configuration
- ✅ Plumber labour costs and sell rates (configurable)
- ✅ Apprentice labour rates (expandable)
- ✅ Material markup: 35% default
- ✅ Subcontractor markup: 20% default
- ✅ Equipment markup: 25% default
- ✅ All rates editable by owner
- ✅ Complete audit history of changes

### Professional Quotations
- ✅ Clean, branded customer-facing PDF quotes
- ✅ Quote expiry dates (30 days default)
- ✅ Included works and exclusions
- ✅ Terms and conditions
- ✅ Signature/acceptance areas
- ✅ No cost/markup/profit exposed to customers
- ✅ Email-ready format

### User Management & Security
- ✅ 4 role-based permission levels:
  - **Owner**: Full system access, settings, user management
  - **Office Staff**: Client and quote management
  - **Estimators**: Build and modify quotes, adjust pricing
  - **Field Staff**: Create quotes from mobile, add photos/notes
- ✅ JWT authentication with secure tokens
- ✅ Password hashing with bcryptjs
- ✅ Role-based API access control
- ✅ Audit logging on all price changes

### Dashboard & Reporting
- ✅ Quote status overview (draft, sent, accepted, declined, expired)
- ✅ Recent quotes at a glance
- ✅ Quick stats on quote performance
- ✅ Status badges and filtering
- ✅ Export-ready data structure

### Technical Excellence
- ✅ Decimal.js for all financial calculations (no floating-point errors)
- ✅ PostgreSQL with proper indexes and constraints
- ✅ Comprehensive unit tests (calculations, auth)
- ✅ TypeScript for type safety
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Clean, modular architecture
- ✅ Ready for ServiceM8 integration

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd norton-plumbing-quotes
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL and JWT secret
   ```

3. **Set up the database:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Owner | josh@norton-plumbing.com.au | demo123 |
| Office Staff | office@norton-plumbing.com.au | demo123 |
| Estimator | estimator@norton-plumbing.com.au | demo123 |
| Field Staff | tim@subcontractor.com.au | demo123 |

## Using Docker (Recommended for Local Development)

### Start PostgreSQL with Docker

```bash
docker-compose up -d
```

This starts a PostgreSQL 15 container on `localhost:5432`.

### Run migrations and seed data

```bash
npm run db:migrate
npm run db:seed
```

### Stop Docker container

```bash
docker-compose down
```

## Core Workflows

### Creating a Quote

1. Click **New Quote** from dashboard
2. Select or create a customer
3. Enter job details (address, phone, type)
4. Click **Build Quote** to access the quote builder
5. Add line items:
   - Labour (plumber, apprentice)
   - Materials (from catalogue or custom)
   - Equipment or subcontractors
6. System calculates totals, GST, and margin live
7. Review margin health indicator (strong/watch/low)
8. Add scope, exclusions, and conditions
9. **Preview & Send** to generate PDF
10. Download PDF or email to customer

### Managing Pricing

**Owner only:**
1. Go to **Settings**
2. Update labour costs and sell rates
3. Adjust markup percentages
4. System logs all changes with timestamp and user

### Searching Materials

1. Go to **Materials Catalogue**
2. Search by code (e.g., "TAP-001") or description
3. Filter by category
4. View cost, markup, and selling price
5. Products auto-load when adding to quote

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Clients
- `GET /api/clients` - List clients (paginated)
- `POST /api/clients` - Create new client

### Quotes
- `GET /api/quotes` - List quotes (with filtering)
- `POST /api/quotes` - Create new quote
- `GET /api/quotes/:id/pdf` - Download quote as PDF

### Quote Lines
- `POST /api/quote-lines` - Add line to quote
- `PUT /api/quote-lines/:id` - Update line
- `DELETE /api/quote-lines/:id` - Remove line

### Materials
- `GET /api/materials` - Search and filter materials
- `POST /api/materials/create` - Create/update material

### Pricing
- `GET /api/pricing-defaults` - Get current pricing
- `POST /api/pricing-defaults` - Update pricing (owner only)

## Database Schema

### Key Tables
- `users` - System users with roles
- `clients` - Customer records
- `jobs` - Job/project records
- `quotes` - Quote headers with totals
- `quote_lines` - Individual quote line items
- `quote_audit` - Audit trail for all changes
- `materials` - Product catalogue
- `material_price_history` - Price change history
- `pricing_defaults` - System-wide pricing settings

## Quote Calculations

### Line Level
```
Line Total Cost = Quantity × Unit Cost
Selling Price Ex GST = Line Total Cost × (1 + Markup%)
GST = Selling Price Ex GST × 10%
Selling Price Inc GST = Selling Price Ex GST + GST
```

### Quote Level
```
Direct Job Cost = Sum of all line costs (excl. optional)
Quote Ex GST = Sum of all selling prices (excl. optional)
GST Total = Quote Ex GST × 10%
Client Total = Quote Ex GST + GST Total
Gross Profit = Quote Ex GST - Direct Job Cost
Gross Margin = Gross Profit ÷ Quote Ex GST
```

### Margin Health
- **Strong**: 40% or higher ✅
- **Watch**: 25% to 39.9% ⚠️
- **Low**: Below 25% ❌

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

Tests cover:
- ✅ Line amount calculations (quantity, cost, markup, GST)
- ✅ Quote total aggregations
- ✅ Margin health status determination
- ✅ Password hashing and verification
- ✅ JWT token creation and validation

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables (Production)

Set these in your production environment:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/norton_quotes
JWT_SECRET=your-secure-random-key-here
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_COMPANY_NAME=Norton Plumbing & Gas
NEXT_PUBLIC_COMPANY_ABN=42 873 255 204
NEXT_PUBLIC_COMPANY_LICENCE=PGE358691
NEXT_PUBLIC_COMPANY_LOCATION=Adelaide, South Australia
NEXT_PUBLIC_GST_RATE=0.10
NEXT_PUBLIC_QUOTE_VALIDITY_DAYS=30
```

### Recommended Hosting
- **Application**: Vercel, Render, Railway, or DigitalOcean App Platform
- **Database**: PostgreSQL managed service (AWS RDS, Render, Supabase, etc.)
- **File Storage**: Local storage for PDFs initially, S3 for production scale

## Future Enhancements

### Phase 2 (Planned)
- ☐ ServiceM8 integration (clients, jobs, quotes sync)
- ☐ Email delivery via SendGrid
- ☐ Digital signatures
- ☐ Mobile app (React Native)
- ☐ Photo uploads and site documentation
- ☐ Quote approval workflow
- ☐ Job-to-invoice conversion
- ☐ Advanced reporting and analytics
- ☐ Multi-user offline sync

## Support & Maintenance

### Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run lint         # Run linter
npm run build        # Build for production

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed demo data

# Testing
npm test             # Run tests once
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

## Security Notes

1. **Never commit `.env.local`** - Use `.env.example` as template
2. **Change JWT_SECRET in production** - Use a strong random key
3. **Use HTTPS in production** - Always encrypt in transit
4. **Secure your database** - Use firewalls and VPCs
5. **Regular backups** - PostgreSQL backups essential
6. **Monitor access logs** - Track who accesses what

## Architecture & Design Decisions

### Why Decimal.js?
Financial calculations must never use floating-point arithmetic. Decimal.js ensures precise handling of currency values.

### Why Role-Based Access?
Different users need different capabilities. Field staff shouldn't modify company-wide pricing; owners need full control.

### Why PostgreSQL?
- ACID compliance for data integrity
- Excellent for financial applications
- Full-text search capability (for materials)
- Generated columns for denormalization
- Audit trail support

### Why Next.js?
- Full-stack JavaScript (frontend + API routes)
- Built-in optimization and performance
- Easy deployment to serverless platforms
- TypeScript first-class support
- Responsive by default

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Ensure PostgreSQL is running. If using Docker: `docker-compose up -d`

### JWT Token Expired
```
Unauthorized: Token expired
```
**Solution:** User needs to log in again. Token expires after 7 days.

### PDF Download Returns Empty
```
Error generating PDF
```
**Solution:** Ensure all quote lines have been saved and totals calculated. Check browser console.

## Contributing

This is a private project for Norton Plumbing & Gas. Contact Josh Norton for access.

## License

Private. All rights reserved to Norton Plumbing & Gas Pty Ltd (ABN 42 873 255 204).

---

**Built with ❤️ for Norton Plumbing & Gas**

Last updated: August 29, 2026
