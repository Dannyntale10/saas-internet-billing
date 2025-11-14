# 🚀 Quick Start Guide - New Enhancements

## ✅ What's Been Implemented

### 1. **FreeRADIUS Integration** (Complete)
Replace MikroTik with CoovaChilli + FreeRADIUS for captive portal authentication.

**API Endpoints:**
- `POST /api/radius/authenticate` - User authentication
- `POST /api/radius/accounting` - Session tracking
- `POST /api/radius/authorize` - Pre-auth check

**Setup:** See `FREERADIUS_SETUP.md`

---

### 2. **Loading Skeletons** (Complete)
Better loading states throughout the app.

**Usage:**
```tsx
import { SkeletonCard, SkeletonTable, SkeletonText } from '@/components/ui/Skeleton'

// In your component
{isLoading ? <SkeletonTable rows={5} cols={4} /> : <DataTable data={data} />}
```

---

### 3. **Keyboard Shortcuts** (Complete)
Power user features for faster navigation.

**Available Shortcuts:**
- `Ctrl/Cmd + K` - Open global search
- `Ctrl/Cmd + N` - Create new item
- `/` - Focus search input
- `Esc` - Close modals/dialogs

**Usage:**
```tsx
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

useKeyboardShortcuts([
  {
    key: 's',
    ctrl: true,
    action: () => handleSave()
  }
])
```

---

### 4. **Global Search** (Complete)
Search across users, vouchers, and payments instantly.

**Usage:**
```tsx
import { GlobalSearch } from '@/components/GlobalSearch'

// Add to your layout/header
<GlobalSearch />
```

**Features:**
- Press `Cmd/Ctrl + K` to open
- Real-time search results
- Keyboard navigation (↑↓ arrows)
- Enter to select result

---

### 5. **Bulk Operations** (Complete)
Import/export data via CSV for bulk operations.

**Usage:**
```tsx
import { BulkOperations } from '@/components/BulkOperations'

<BulkOperations
  onBulkCreate={async (data) => {
    // Process bulk data
    for (const item of data) {
      await createVoucher(item)
    }
  }}
  template={[
    { code: 'EXAMPLE', name: 'Example Voucher', price: 10000 }
  ]}
  entityName="vouchers"
/>
```

---

### 6. **Export Functionality** (Complete)
Export data to PDF, Excel, or CSV.

**Usage:**
```tsx
import { exportToPDF, exportToExcel, exportToCSV, generateInvoicePDF } from '@/lib/export'

// Export to PDF
exportToPDF(data, 'Report', ['name', 'email', 'amount'])

// Export to Excel
exportToExcel(data, 'Report', 'Sheet1')

// Export to CSV
exportToCSV(data, 'Report')

// Generate invoice PDF
generateInvoicePDF(invoice)
```

---

### 7. **2FA Foundation** (Partial - Needs UI)
Two-factor authentication utilities ready.

**Usage:**
```tsx
import { generate2FASecret, verify2FAToken } from '@/lib/2fa'

// Generate secret
const { secret, qrCode, backupCodes } = await generate2FASecret(userId)

// Verify token
const isValid = verify2FAToken(secret, userToken)
```

**Next:** Create 2FA setup UI component

---

### 8. **Socket.io Client** (Partial - Needs Server)
Real-time updates infrastructure.

**Usage:**
```tsx
import { subscribeToEvent } from '@/lib/socket'

useEffect(() => {
  const unsubscribe = subscribeToEvent('payment:new', (data) => {
    // Handle new payment
    toast.success(`New payment: ${data.amount}`)
  })
  return unsubscribe
}, [])
```

**Next:** Set up Socket.io server in API routes

---

## 🎨 **How to Use in Your Pages**

### Example: Dashboard with Real-time Updates

```tsx
'use client'

import { useState, useEffect } from 'react'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { subscribeToEvent } from '@/lib/socket'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToEvent('stats:update', (data) => {
      setStats(data)
    })
    return unsubscribe
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'r',
      ctrl: true,
      action: () => refreshStats()
    }
  ])

  if (isLoading) {
    return <SkeletonCard />
  }

  return <div>Dashboard content</div>
}
```

### Example: Vouchers Page with Bulk Operations

```tsx
'use client'

import { BulkOperations } from '@/components/BulkOperations'
import { exportToCSV } from '@/lib/export'

export default function VouchersPage() {
  const handleBulkCreate = async (data: any[]) => {
    for (const voucher of data) {
      await createVoucher(voucher)
    }
  }

  return (
    <div>
      <BulkOperations
        onBulkCreate={handleBulkCreate}
        template={voucherTemplate}
        entityName="vouchers"
      />
      {/* Voucher list */}
    </div>
  )
}
```

---

## 🔧 **Next Steps to Complete**

### 1. Socket.io Server Setup
Create `/app/api/socket/route.ts` or use Next.js API route with Socket.io

### 2. 2FA UI Components
- Setup page with QR code
- Verification modal
- Backup codes display

### 3. Enhanced Notifications
- Notification center component
- Push notification setup
- Email/SMS integration

### 4. Real-time Dashboard
- Update dashboard components
- Add Socket.io event emitters
- Live statistics updates

---

## 📦 **Package Dependencies**

All required packages are installed:
- ✅ `jspdf` - PDF generation
- ✅ `xlsx` - Excel export
- ✅ `papaparse` - CSV parsing
- ✅ `speakeasy` - 2FA TOTP
- ✅ `qrcode` - QR code generation
- ✅ `socket.io-client` - Real-time client

---

## 🎯 **Integration Checklist**

- [x] FreeRADIUS API endpoints
- [x] Loading skeletons
- [x] Keyboard shortcuts
- [x] Global search
- [x] Bulk operations
- [x] Export utilities
- [x] 2FA foundation
- [x] Socket.io client
- [ ] Socket.io server
- [ ] 2FA UI components
- [ ] Enhanced notifications
- [ ] Real-time dashboard updates

---

## 💡 **Tips**

1. **Start with Quick Wins:** Use skeletons and keyboard shortcuts immediately
2. **Add Global Search:** Drop it in your header/layout
3. **Enable Bulk Operations:** Add to voucher/user management pages
4. **Export Features:** Add export buttons to all data tables
5. **Real-time Updates:** Connect Socket.io when ready for live features

---

## 📚 **Documentation**

- **FreeRADIUS Setup:** `FREERADIUS_SETUP.md`
- **Implementation Status:** `IMPLEMENTATION_STATUS.md`
- **Enhancement Suggestions:** `ENHANCEMENT_SUGGESTIONS.md`

---

**All core infrastructure is ready! Start using these features in your pages.** 🚀

