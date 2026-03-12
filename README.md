# 🍽️ Restaurant Pro — Full-Stack Restaurant Management System

A production-ready restaurant management web application built with **Firebase + Bootstrap 5**.
Featuring real-time updates, customizable dashboards, full POS functionality, and thermal receipt printing.

---

## 📁 Project Structure

```
restaurant-app/
├── index.html              ← Login / Register page
├── dashboard.html          ← Customizable drag-and-drop dashboard
├── tables.html             ← Table management & floor map
├── menu.html               ← Menu & food item management
├── orders.html             ← Order creation & live tracking
├── kitchen.html            ← Kitchen Display System (KDS)
├── billing.html            ← Bill generation & payment processing
├── history.html            ← History, analytics & activity log
├── profile.html            ← User profile & preferences
│
├── css/
│   └── app.css             ← Main stylesheet (dark/light theme)
│
├── js/
│   ├── firebase-config.js  ← Firebase initialization & seed data
│   └── utils.js            ← Shared utilities, helpers, UI components
│
├── firebase.json           ← Firebase Hosting + Firestore + Storage config
├── firestore.rules         ← Firestore security rules
├── firestore.indexes.json  ← Composite indexes for queries
└── storage.rules           ← Firebase Storage security rules
```

---

## 🚀 Quick Start

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add Project** → name it (e.g. `restaurant-pro`)
3. Enable **Google Analytics** (optional)
4. Click **Create Project**

### 2. Enable Firebase Services

Inside your Firebase project:

**Authentication:**
- Go to **Authentication → Sign-in method**
- Enable **Email/Password**

**Firestore:**
- Go to **Firestore Database → Create database**
- Start in **Production mode**
- Choose your region (e.g. `us-central1`)

**Storage:**
- Go to **Storage → Get started**
- Start in **Production mode**

### 3. Get Your Firebase Config

1. Go to **Project Settings → General**
2. Under **Your apps**, click the `</>` Web icon
3. Register your app with a nickname
4. Copy the `firebaseConfig` object

### 4. Configure the App

Open `js/firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey:            "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain:        "your-project-id.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId:             "1:123456789012:web:abcdef1234567890"
};
```

### 5. Deploy Security Rules

Install the Firebase CLI if you haven't:

```bash
npm install -g firebase-tools
firebase login
firebase init
```

When prompted:
- Select **Hosting**, **Firestore**, **Storage**
- Choose your Firebase project
- Set public directory to `.` (current folder)
- Configure as single-page app: **No** (we have separate HTML files)

Deploy everything:

```bash
firebase deploy
```

Or deploy individually:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only hosting
```

### 6. Seed Demo Data

After logging in, open the browser console and run:

```javascript
seedDemoData()
```

This creates sample tables and categories.

---

## 🗃️ Firestore Data Structure

```
firestore/
│
├── users/{userId}
│   ├── displayName: string
│   ├── email: string
│   ├── phone: string
│   ├── role: "Admin" | "Manager" | "Staff" | "Kitchen"
│   ├── photoURL: string
│   ├── bio: string
│   ├── preferences: {
│   │     theme: "dark" | "light"
│   │     currency: "$" | "€" | "£" | "₹"
│   │     taxRate: number
│   │     sound: boolean
│   │     notifications: boolean
│   │     restaurantName: string
│   │   }
│   └── createdAt: timestamp
│
├── tables/{tableId}
│   ├── number: number
│   ├── area: "Dining" | "Pool Area" | "VIP" | "Takeaway"
│   ├── status: "Available" | "Occupied" | "Reserved"
│   ├── capacity: number
│   ├── notes: string
│   └── createdAt: timestamp
│
├── categories/{categoryId}
│   ├── name: string
│   └── createdAt: timestamp
│
├── menu_items/{itemId}
│   ├── name: string
│   ├── price: number
│   ├── categoryId: string (ref → categories)
│   ├── description: string
│   ├── imageURL: string (Firebase Storage URL)
│   ├── available: boolean
│   ├── prepTime: number (minutes)
│   ├── tags: string[]
│   └── createdAt: timestamp
│
├── orders/{orderId}
│   ├── type: "Table Order" | "Takeaway" | "Pre-order"
│   ├── status: "Pending" | "Cooking" | "Ready" | "Served" | "Paid" | "Cancelled"
│   ├── tableNumber: number | null
│   ├── customerName: string | null
│   ├── items: [{ id, name, price, qty }]
│   ├── subtotal: number
│   ├── tax: number
│   ├── total: number
│   ├── notes: string
│   ├── scheduledAt: timestamp | null
│   ├── createdBy: string (userId)
│   └── createdAt: timestamp
│
├── bills/{billId}
│   ├── orderId: string
│   ├── items: [{ id, name, price, qty }]
│   ├── subtotal: number
│   ├── tax: number
│   ├── discount: number
│   ├── discountPct: number
│   ├── total: number
│   ├── paymentMethod: "Cash" | "Card" | "UPI" | "Wallet"
│   ├── status: "Paid"
│   ├── tableNumber: number | null
│   ├── customerName: string | null
│   ├── createdBy: string
│   ├── createdAt: timestamp
│   └── paidAt: timestamp
│
├── layouts/{userId}
│   ├── widgets: [{ id, type, x, y, w, h }]
│   └── savedAt: timestamp
│
└── activity_log/{logId}
    ├── uid: string
    ├── action: string
    ├── details: object
    └── createdAt: timestamp
```

---

## ✨ Feature Summary

| Feature | Status |
|---|---|
| Email/Password Auth | ✅ |
| User Profile + Avatar Upload | ✅ |
| Dark / Light Mode | ✅ |
| Customizable Dashboard (drag & drop) | ✅ |
| Dashboard Layout saved per user | ✅ |
| Table Management (4 area types) | ✅ |
| Real-time Table Status | ✅ |
| Menu Management + Categories | ✅ |
| Food Image Upload (Firebase Storage) | ✅ |
| Order Creation (Table/Takeaway/Pre-order) | ✅ |
| Live Order Tracking (Firestore listeners) | ✅ |
| Kitchen Display System (KDS) | ✅ |
| Order Status Timer | ✅ |
| Bill Generation | ✅ |
| Discount Support | ✅ |
| Multiple Payment Methods | ✅ |
| Thermal Receipt (58mm/80mm) | ✅ |
| Browser Print | ✅ |
| Order History + Filters | ✅ |
| Payment History | ✅ |
| Activity Log | ✅ |
| Revenue Analytics | ✅ |
| Top Items Breakdown | ✅ |
| CSV Export | ✅ |
| Firestore Security Rules | ✅ |
| Storage Security Rules | ✅ |
| Composite Indexes | ✅ |
| Offline Persistence | ✅ |
| Responsive (Desktop + Tablet) | ✅ |

---

## 🧩 Widget Types (Dashboard)

| Widget | Description |
|---|---|
| 📈 Revenue Chart | 7-day daily revenue bar chart |
| 🛒 Live Orders | Real-time active orders feed |
| 👨‍🍳 Kitchen Status | Current kitchen queue |
| 🪑 Tables Overview | Mini floor map |
| 🍕 Menu Stats | Category breakdown |
| ⚡ Quick Actions | One-click navigation shortcuts |
| 💳 Recent Bills | Latest bill history |

---

## 🖨️ Receipt Printing

Receipts are compatible with:
- **58mm thermal printers** (set via browser print settings)
- **80mm thermal printers** (default layout)
- Standard browser print (Ctrl+P / Cmd+P)

To print:
1. Go to **Billing** page
2. Select a served order
3. Click **Preview Receipt**
4. Click **🖨️ Print Receipt**

---

## 👤 Default Demo Account

```
Email:    demo@restaurantpro.app
Password: demo123456
```

Click **"Try with Demo Account"** on the login page to auto-create this account.

---

## 🔧 Customization

| Setting | Location |
|---|---|
| Tax Rate | `js/utils.js` → `TAX_RATE` constant (also in Profile → Preferences) |
| Currency | Profile → Preferences |
| Restaurant Name | Profile → Preferences |
| Receipt Header | `billing.html` → `previewReceipt()` function |
| Default Widget Layout | `dashboard.html` → `DEFAULT_LAYOUT` array |

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Bootstrap 5.3, Vanilla JavaScript |
| Authentication | Firebase Auth (Email/Password) |
| Database | Firebase Firestore |
| File Storage | Firebase Storage |
| Dashboard Widgets | GridStack.js v10 |
| Hosting | Firebase Hosting |
| Fonts | Google Fonts (Playfair Display + DM Sans) |

---

## 📄 License

MIT — Free to use and modify for commercial projects.
