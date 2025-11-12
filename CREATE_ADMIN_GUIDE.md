# 🔐 Create Admin User Guide

## 📋 Available Scripts

You have 3 scripts to create admin users:

### 1. Quick Script (Command Line Arguments)
**File:** `scripts/create-admin-quick.js`

**Usage:**
```bash
node scripts/create-admin-quick.js <email> <name> <password>
```

**Example:**
```bash
node scripts/create-admin-quick.js admin@jendamobility.com "Admin User" MySecurePass123
```

**Best for:** Quick creation when you know all details

---

### 2. Interactive Script (Prompts for Input)
**File:** `scripts/create-admin.js`

**Usage:**
```bash
node scripts/create-admin.js
```

**What it does:**
- Prompts you to enter email, name, and password
- More secure (password not visible in command history)

**Best for:** When you want to enter password securely

---

### 3. Production Script (For Vercel/Production Database)
**File:** `scripts/create-admin-production.js`

**Usage (with arguments):**
```bash
node scripts/create-admin-production.js <email> <name> <password>
```

**Usage (interactive):**
```bash
node scripts/create-admin-production.js
```

**For Production Database:**
```powershell
# Set production database URL
$env:DATABASE_URL="postgresql://neondb_owner:npg_HC7I8tAJZYVT@ep-shiny-waterfall-afqei48z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Create admin
node scripts/create-admin-production.js admin@example.com "Admin User" password123
```

**Best for:** Creating admin in production database

---

## 🚀 Quick Start

### For Local Development:
```bash
node scripts/create-admin-quick.js dannyntale16@gmail.com "Admin User" Hubolt@83
```

### For Production (Vercel):
```powershell
# Set production database
$env:DATABASE_URL="postgresql://neondb_owner:npg_HC7I8tAJZYVT@ep-shiny-waterfall-afqei48z-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Create admin
node scripts/create-admin-production.js dannyntale16@gmail.com "Admin User" Hubolt@83
```

---

## ✅ What Happens

1. **Checks database connection**
2. **Validates email format**
3. **Checks if user already exists**
4. **Hashes password securely**
5. **Creates admin user**
6. **Shows success message with credentials**

---

## 🔒 Security Notes

- ✅ Passwords are hashed with bcrypt (10 rounds)
- ✅ Email must be unique
- ✅ Password must be at least 6 characters
- ✅ Admin role is automatically assigned

---

## 🐛 Troubleshooting

### "Database connection failed"
- Check DATABASE_URL is set correctly
- Verify database is accessible
- For production, use the Neon connection string

### "User already exists"
- The email is already in use
- Use a different email or login with existing user

### "Invalid email format"
- Use a valid email format (e.g., user@example.com)

---

## 📝 Example Output

```
🔐 Create Admin User for Production

==================================================
✅ Connected to database

Creating admin user...

Hashing password...
Creating user in database...

==================================================
✅ Admin user created successfully!

📋 User Details:
   ID: clx1234567890
   Email: admin@example.com
   Name: Admin User
   Role: ADMIN
   Created: 2025-11-11T14:00:00.000Z

==================================================

🔐 Login Credentials:
   Email: admin@example.com
   Password: password123

✅ You can now login to your app with these credentials!
```

---

**Ready to create your admin user?** Choose the script that works best for you! 🚀

