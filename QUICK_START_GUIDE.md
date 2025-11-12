# 🚀 Quick Start Guide

## ✅ Setup Complete!

Your app is ready! The setup check confirms all environment variables are configured.

## 🔐 Login to Your App

**URL:** https://saas-internet-billing.vercel.app

**Admin Credentials:**
- **Email:** `dannyntale16@gmail.com`
- **Password:** `Hubolt@83`

## 📋 First Steps After Login

### 1. Explore Admin Dashboard
- View system overview
- Check statistics
- Navigate through menus

### 2. Create Your First Client
1. Go to **"Clients"** in the sidebar
2. Click **"Add Client"** or **"Create Client"**
3. Fill in client details:
   - Name
   - Email
   - Phone (optional)
   - Password
4. Click **"Create"**

### 3. Configure Router (Optional)
If you have a MikroTik router:
1. Go to **"Router Settings"** (as admin, you can configure for clients)
2. Enter router details:
   - Host/IP address
   - Port (default: 8728)
   - Username
   - Password
3. Click **"Test Connection"** to verify
4. Save configuration

### 4. Create Vouchers (As Client)
1. **Switch to Client Account:**
   - Logout as admin
   - Login with client credentials you just created
   
2. **Create Voucher:**
   - Go to **"Vouchers"** → **"Create Voucher"**
   - Fill in details:
     - Name/Description
     - Data Limit (GB) - leave empty for unlimited
     - Time Limit (hours) - leave empty for unlimited
     - Speed Limit (Mbps) - leave empty for unlimited
     - Price (UGX)
     - Validity period
   - Click **"Create"**

### 5. Test Payment Flow
1. **As End-User:**
   - Create an end-user account or use existing
   - Go to **"Buy Voucher"**
   - Select a voucher
   - Choose payment method (MTN or Airtel)
   - Enter phone number
   - Initiate payment

2. **Note:** Payment APIs are in sandbox mode - use test credentials

## 🎯 Key Features Available

### Admin Features:
- ✅ Dashboard with statistics
- ✅ Client management
- ✅ System monitoring
- ✅ User management

### Client Features:
- ✅ Voucher creation and management
- ✅ Router configuration
- ✅ Payment processing setup
- ✅ End-user management

### End-User Features:
- ✅ Browse available vouchers
- ✅ Purchase vouchers
- ✅ Mobile money payments (MTN/Airtel)
- ✅ View purchase history

## 🔧 Configuration Tips

### Mobile Money Setup:
- MTN Mobile Money: Configure API credentials in environment variables
- Airtel Money: Configure API credentials in environment variables
- Currently using sandbox/test mode

### Router Integration:
- Supports MikroTik RouterOS
- Requires API access enabled on router
- Default port: 8728
- Test connection before saving

## 📱 Custom Domain

To use `jendamobility.gt.tc`:

1. **Add in Vercel Dashboard:**
   - https://vercel.com/dannyntale10s-projects/saas-internet-billing/settings/domains
   - Add domain: `jendamobility.gt.tc`

2. **Configure DNS:**
   - Add CNAME record pointing to Vercel
   - Wait for DNS propagation (5-30 minutes)

3. **SSL Certificate:**
   - Automatically issued by Vercel
   - Usually ready within minutes

## 🆘 Troubleshooting

### Can't Login?
- Verify credentials are correct
- Check browser console for errors
- Ensure cookies are enabled

### Vouchers Not Showing?
- Make sure you're logged in as a client
- Check that vouchers were created successfully
- Verify database connection

### Payment Not Working?
- Check mobile money API credentials
- Verify sandbox/test mode is configured
- Check payment status endpoint

### Router Connection Failed?
- Verify router IP and port
- Check API is enabled on router
- Ensure firewall allows connections
- Test with RouterOS Winbox first

## 📞 Support

- **Documentation:** Check `PRODUCTION_SETUP_COMPLETE.md`
- **Domain Setup:** See `DOMAIN_SETUP.md`
- **Deployment:** See `AUTOMATIC_DEPLOYMENT.md`

## 🎉 You're All Set!

Your SaaS Internet Billing System is fully operational. Start by creating your first client and vouchers!

**Happy billing!** 💰

