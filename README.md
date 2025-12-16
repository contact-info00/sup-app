# Supplier Management Application

A complete, production-ready web application for supplier management with 4-digit PIN authentication, role-based access control (Employee/Admin), and comprehensive inventory and order management.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) with React and TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom 4-digit PIN with JWT tokens
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (Frontend) + Supabase/Neon/Railway (Database)

## Features

### Authentication
- 4-digit PIN-based login (no email/password)
- Secure PIN hashing with bcrypt
- JWT token-based session management
- Role-based access control (Employee/Admin)

### Employee Features
- Browse categories and items
- View prices in Iraqi Dinar (IQD)
- Add items to shopping basket
- View and edit basket
- Checkout to create orders

### Admin Features
- **Dashboard**: Overview metrics (sales, orders, top items)
- **Category Management**: Add, edit, delete categories with image uploads
- **Item Management**: Add, edit, delete items with image uploads, descriptions, and prices (in IQD)
- **User Management**: Add users with 4-digit PINs and roles, delete users
- **Reports**: 
  - Top selling items
  - Daily sales reports
  - Revenue analytics (in IQD)
  - Order details

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (local or hosted)
- Git

## Local Setup

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database URL (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/supplier_db?schema=public"

# JWT Secret (generate a random string)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important**: Replace `DATABASE_URL` with your actual PostgreSQL connection string. For hosted databases:
- **Supabase**: Get connection string from Project Settings > Database
- **Neon**: Get connection string from Dashboard > Connection Details
- **Railway**: Get connection string from Project > Database > Connect

### 3. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# (Optional) Run migrations instead
npx prisma migrate dev

# Seed database with sample data
npm run db:seed
```

The seed script creates:
- Admin user with PIN: `1234`
- Employee user with PIN: `5678`
- Sample categories and items

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Access the Application

- **Login Page**: http://localhost:3000/login
- **Admin Dashboard**: http://localhost:3000/admin (after logging in as admin)
- **Categories**: http://localhost:3000/categories (after logging in)

**Default Login Credentials**:
- Admin: PIN `1234`
- Employee: PIN `5678`

## Database Schema

The application uses the following tables:

- **users**: User accounts with hashed PINs and roles
- **categories**: Product categories
- **items**: Products with prices, descriptions, and images
- **orders**: Customer orders
- **order_items**: Individual items in each order

See `prisma/schema.prisma` for the complete schema definition.

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── categories/   # Category CRUD
│   │   ├── items/        # Item CRUD
│   │   ├── orders/       # Order creation
│   │   ├── users/        # User management (admin)
│   │   └── reports/      # Sales reports (admin)
│   ├── admin/            # Admin dashboard pages
│   ├── categories/       # Category browsing
│   ├── basket/           # Shopping basket
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── components/           # React components
├── lib/                  # Utility functions
│   ├── auth.ts          # Authentication helpers
│   └── prisma.ts        # Prisma client
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── seed.ts          # Seed script
│   └── migrations/      # Database migrations
└── public/              # Static assets
```

## Features Details

### Image Upload
- Images can be uploaded from PC or mobile device
- Supported formats: JPEG, PNG, WebP, GIF
- Maximum file size: 5MB
- Images are stored in `/public/uploads/` directory
- Upload endpoint: `POST /api/upload` (requires authentication)

### Currency
- All prices are displayed in **Iraqi Dinar (IQD)**
- Prices are formatted with thousand separators for readability
- Example: `1,500 IQD` instead of `$1,500.00`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with 4-digit PIN
- `DELETE /api/auth/login` - Logout
- `GET /api/auth/me` - Get current user

### File Upload
- `POST /api/upload` - Upload image file (returns imageUrl)

### Categories (Employee & Admin)
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/[id]` - Update category (Admin only)
- `DELETE /api/categories/[id]` - Delete category (Admin only)

### Items (Employee & Admin)
- `GET /api/items?category_id=...` - List items (optionally filtered)
- `POST /api/items` - Create item (Admin only)
- `PUT /api/items/[id]` - Update item (Admin only)
- `DELETE /api/items/[id]` - Delete item (Admin only)

### Orders (Employee)
- `POST /api/orders` - Create order (checkout)

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `DELETE /api/users/[id]` - Delete user

### Reports (Admin only)
- `GET /api/reports/overview` - Today's overview metrics
- `GET /api/reports/top-selling?date=...&limit=...` - Top selling items
- `GET /api/reports/sales?date=...` - Sales report for a date

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Set Up Database**
   - Create a PostgreSQL database on Supabase, Neon, or Railway
   - Copy the connection string

3. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `JWT_SECRET`: A random secret string (use `openssl rand -base64 32`)
     - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL

4. **Run Database Migrations**
   ```bash
   # In Vercel, add a build command or run manually:
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

   Alternatively, use Vercel's CLI:
   ```bash
   vercel env pull .env.local
   npx prisma db push
   npm run db:seed
   ```

5. **File Storage Note**
   - For production, uploaded images are stored in `/public/uploads/`
   - Vercel's file system is read-only except during build
   - For production, consider using cloud storage services:
     - AWS S3 with CloudFront
     - Cloudinary
     - Uploadcare
     - Or use Vercel Blob Storage

### Environment Variables for Production

In Vercel Dashboard > Settings > Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-production-secret-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Database Setup on Hosted Services

#### Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings > Database
4. Copy the connection string (use the "Connection pooling" string for `DATABASE_URL` and "Direct connection" for `DIRECT_URL`)
5. **Important**: Add `?sslmode=require` to your connection strings
   - For pooled connection (port 6543): `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true&sslmode=require`
   - For direct connection (port 5432): `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require`
6. If using connection pooling, you need both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in your `.env` file

#### Neon
1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. Format: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

#### Railway
1. Create account at [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL service
4. Copy the connection string from the service variables

## Security Considerations

1. **JWT Secret**: Use a strong, random secret in production
2. **Database**: Use connection pooling and SSL in production
3. **PIN Security**: PINs are hashed with bcrypt (10 rounds)
4. **CORS**: Configure CORS if using separate frontend/backend
5. **Rate Limiting**: Consider adding rate limiting for production
6. **HTTPS**: Always use HTTPS in production

## Development Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:push         # Push schema to database
npm run db:migrate      # Run migrations
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database

# Production
npm run build           # Build for production
npm start               # Start production server
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if database allows connections from your IP
- For hosted databases, ensure SSL is enabled if required

### Authentication Issues
- Clear browser cookies
- Verify `JWT_SECRET` is set
- Check that users exist in database (run seed script)

### Build Errors
- Run `npx prisma generate` before building
- Ensure all environment variables are set
- Check Node.js version (18+ required)

### Image Upload Issues
- Ensure `/public/uploads/` directory exists and is writable
- Check file size (max 5MB) and format (JPEG, PNG, WebP, GIF)
- For production, consider using cloud storage (AWS S3, Cloudinary) instead of local storage

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.


