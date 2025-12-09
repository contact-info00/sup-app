# Quick Start Guide

## 1. Install Dependencies
```bash
npm install
```

## 2. Set Up Environment Variables
Create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/supplier_db?schema=public"
JWT_SECRET="your-secret-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 3. Set Up Database
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

## 4. Run Development Server
```bash
npm run dev
```

## 5. Login
- Open http://localhost:3000/login
- Admin PIN: `1234`
- Employee PIN: `5678`

## Default Users (from seed)
- **Admin**: PIN `1234`
- **Employee**: PIN `5678`

## Next Steps
- See `README.md` for full documentation
- Deploy to Vercel + Supabase/Neon/Railway
- Customize categories and items via admin dashboard




