// ============================================================
// FIREBASE CONFIGURATION
// Replace with your actual Firebase project credentials
// ============================================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCWqfHat9qDHC8WeshSrmmm-lQd-VF1u3U",
  authDomain: "pos-system-cc66f.firebaseapp.com",
  projectId: "pos-system-cc66f",
  storageBucket: "pos-system-cc66f.firebasestorage.app",
  messagingSenderId: "520705889122",
  appId: "1:520705889122:web:c011aef615dd2db878123b",
  measurementId: "G-MR9SQCKKP8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true })
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open. Persistence enabled in first tab only.');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support persistence.');
    }
  });

// ============================================================
// FIRESTORE COLLECTION REFERENCES
// ============================================================
const Collections = {
  USERS:      'users',
  TABLES:     'tables',
  MENU_ITEMS: 'menu_items',
  CATEGORIES: 'categories',
  ORDERS:     'orders',
  BILLS:      'bills',
  LAYOUTS:    'layouts',
  ACTIVITY:   'activity_log',
};

// ============================================================
// SAMPLE / DEMO DATA SEEDER
// Run seedDemoData() from browser console to populate Firestore
// ============================================================
async function seedDemoData() {
  const batch = db.batch();

  // Categories
  const cats = ['Burgers', 'Drinks', 'Desserts', 'Starters', 'Mains', 'Sides'];
  for (const name of cats) {
    const ref = db.collection(Collections.CATEGORIES).doc();
    batch.set(ref, { name, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  }

  // Tables
  const areas = ['Dining', 'Pool Area', 'VIP', 'Takeaway'];
  for (let i = 1; i <= 12; i++) {
    const ref = db.collection(Collections.TABLES).doc(`table_${i}`);
    batch.set(ref, {
      number: i,
      area: areas[Math.floor(Math.random() * areas.length)],
      status: 'Available',
      capacity: [2, 4, 6][Math.floor(Math.random() * 3)],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  await batch.commit();
  console.log('✅ Demo data seeded successfully!');
}

window.seedDemoData = seedDemoData;
