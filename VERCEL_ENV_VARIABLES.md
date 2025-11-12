# Vercel Environment Variables - Copy & Paste Guide

## Go to: https://vercel.com/dannyntale10s-projects/~/settings/environment-variables

## Required Variables (Add These First)

### 1. DATABASE_URL
**Name:** `DATABASE_URL`  
**Value:** 
```
postgresql://neondb_owner:npg_HC7I8tAJZYVT@ep-shiny-waterfall-afqei48z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
**Environment:** Production, Preview, Development (select all)

---

### 2. NEXTAUTH_SECRET
**Name:** `NEXTAUTH_SECRET`  
**Value:**
```
SHeBSeohMTS2PlA8Pe40ibslgVhSEdYHrY5Bc7zHQf4=
```
**Environment:** Production, Preview, Development (select all)

---

### 3. NEXTAUTH_URL
**Name:** `NEXTAUTH_URL`  
**Value:**
```
https://saas-internet-billing.vercel.app
```
**Environment:** Production, Preview, Development (select all)

---

## Optional Variables (For Mobile Money - Can Add Later)

### 4. MTN_API_KEY
**Name:** `MTN_API_KEY`  
**Value:** (Leave empty for now, or add your MTN API key)  
**Environment:** Production, Preview, Development

---

### 5. MTN_API_SECRET
**Name:** `MTN_API_SECRET`  
**Value:** (Leave empty for now, or add your MTN API secret)  
**Environment:** Production, Preview, Development

---

### 6. MTN_ENVIRONMENT
**Name:** `MTN_ENVIRONMENT`  
**Value:**
```
sandbox
```
**Environment:** Production, Preview, Development

---

### 7. AIRTEL_API_KEY
**Name:** `AIRTEL_API_KEY`  
**Value:** (Leave empty for now, or add your Airtel API key)  
**Environment:** Production, Preview, Development

---

### 8. AIRTEL_API_SECRET
**Name:** `AIRTEL_API_SECRET`  
**Value:** (Leave empty for now, or add your Airtel API secret)  
**Environment:** Production, Preview, Development

---

### 9. AIRTEL_ENVIRONMENT
**Name:** `AIRTEL_ENVIRONMENT`  
**Value:**
```
sandbox
```
**Environment:** Production, Preview, Development

---

### 10. APP_NAME
**Name:** `APP_NAME`  
**Value:**
```
Internet Billing System
```
**Environment:** Production, Preview, Development

---

### 11. APP_URL
**Name:** `APP_URL`  
**Value:**
```
https://saas-internet-billing.vercel.app
```
**Environment:** Production, Preview, Development

---

## Step-by-Step Instructions

1. **Go to:** https://vercel.com/dannyntale10s-projects/~/settings/environment-variables

2. **For each variable above:**
   - Click **"Add New"** button
   - Enter the **Name** (e.g., `DATABASE_URL`)
   - Paste the **Value**
   - Select **Environment(s)**: Check all three (Production, Preview, Development)
   - Click **"Save"**

3. **After adding all variables:**
   - Go to **Deployments** tab
   - Click **"..."** on the latest deployment
   - Click **"Redeploy"**

4. **Wait for deployment to complete** (usually 1-2 minutes)

5. **Create admin user:**
   ```powershell
   $env:DATABASE_URL="postgresql://neondb_owner:npg_HC7I8tAJZYVT@ep-shiny-waterfall-afqei48z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"; node scripts/create-admin-quick.js admin@example.com "Admin User" yourpassword123
   ```

6. **Visit your app:** https://saas-internet-billing.vercel.app

7. **Login** with your admin credentials!

---

## Quick Copy-Paste (Minimum Required)

If you only want to add the essential ones first:

```
DATABASE_URL=postgresql://neondb_owner:npg_HC7I8tAJZYVT@ep-shiny-waterfall-afqei48z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

NEXTAUTH_SECRET=SHeBSeohMTS2PlA8Pe40ibslgVhSEdYHrY5Bc7zHQf4=

NEXTAUTH_URL=https://saas-internet-billing.vercel.app
```

Add these 3 first, then you can add the optional ones later!

