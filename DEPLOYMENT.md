# Vercel Deployment Guide

## Prerequisites
- GitHub repository connected to Vercel
- Supabase database set up

## Step 1: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
DATABASE_URL=postgresql://postgres.acvthxporkcbvqeoceyc:Hiwa2025Hiwa@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&sslmode=require
JWT_SECRET=your-secret-key-here-change-this-to-random-string
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Important**: 
- Replace `DATABASE_URL` with your actual Supabase connection string
- Generate a random `JWT_SECRET` (you can use: `openssl rand -base64 32` or any random string generator)
- Replace `NEXT_PUBLIC_APP_URL` with your actual Vercel URL after first deployment

## Step 2: Push Prisma Schema to Database

Run this command locally (after setting up your .env with DATABASE_URL):

```bash
npx prisma db push
```

Or run it in Vercel's deployment logs/terminal if available.

## Step 3: Deploy to Vercel

1. Push your code to GitHub (already done ✅)
2. Vercel will automatically detect the push and start building
3. Check the deployment logs for any errors

## Step 4: Verify Deployment

After successful deployment:
1. Visit your Vercel URL
2. Test the login functionality
3. Verify database connection works

## Common Issues

### Build Fails with Prisma Error
- Make sure `DATABASE_URL` is set correctly in Vercel
- Verify the connection string includes `?sslmode=require`

### Runtime Errors
- Check that all environment variables are set
- Verify database is accessible from Vercel's IP addresses
- Check Supabase settings for allowed IPs

### Database Connection Issues
- For Supabase, you may need to use the pooled connection string
- Ensure SSL mode is enabled in connection string

