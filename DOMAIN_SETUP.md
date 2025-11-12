# Domain Configuration: jendamobility.gt.tc

## Option 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dannyntale10s-projects/saas-internet-billing/settings/domains

2. **Add Domain:**
   - Click "Add Domain"
   - Enter: `jendamobility.gt.tc`
   - Click "Add"

3. **Configure DNS:**
   - Vercel will show you DNS records to add
   - You'll need to add these records in your domain registrar (where you bought jendamobility.gt.tc)

## Option 2: Via Vercel CLI

If you have domain verification set up:

```bash
vercel domains add jendamobility.gt.tc
```

## DNS Configuration

After adding the domain in Vercel, you'll need to configure DNS records:

### Typical DNS Records Needed:

1. **A Record** (or CNAME):
   - **Type:** CNAME
   - **Name:** @ (or jendamobility)
   - **Value:** `cname.vercel-dns.com` (Vercel will provide exact value)
   - **TTL:** 3600

2. **WWW Subdomain** (optional):
   - **Type:** CNAME
   - **Name:** www
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** 3600

### Where to Add DNS Records:

1. Log in to your domain registrar (where you bought jendamobility.gt.tc)
2. Find DNS Management / DNS Settings
3. Add the records Vercel provides
4. Wait for DNS propagation (can take up to 48 hours, usually 5-30 minutes)

## Verification

After adding DNS records:

1. Check in Vercel dashboard - domain should show as "Valid Configuration"
2. Wait for SSL certificate (automatic, usually within minutes)
3. Test: Visit `https://jendamobility.gt.tc`

## Current Status

- **Vercel Project:** saas-internet-billing
- **Current URL:** https://saas-internet-billing.vercel.app
- **Target Domain:** jendamobility.gt.tc

## Troubleshooting

If domain doesn't work:
1. Verify DNS records are correct
2. Check DNS propagation: https://dnschecker.org
3. Ensure domain is verified in Vercel
4. Wait for SSL certificate (can take a few minutes)

