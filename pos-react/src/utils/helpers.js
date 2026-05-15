export const fmt = {
  currency(amount, symbol = '$') {
    return `${symbol}${Number(amount || 0).toFixed(2)}`;
  },
  date(ts) {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  time(ts) {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  },
  datetime(ts) {
    return `${this.date(ts)} ${this.time(ts)}`;
  },
  orderId(id) {
    return '#' + (id || '').slice(-6).toUpperCase();
  },
};

export function generateOrderId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

export const TAX_RATE = 0.08;

export function calcBillAmounts(subtotal) {
  const tax   = subtotal * TAX_RATE;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export const STATUS_CHIP_CLASS = {
  Available:    'chip-success',
  Occupied:     'chip-danger',
  Reserved:     'chip-warning',
  Pending:      'chip-warning',
  Cooking:      'chip-info',
  Ready:        'chip-purple',
  Served:       'chip-success',
  Paid:         'chip-success',
  Unpaid:       'chip-danger',
  Cancelled:    'chip-muted',
  Takeaway:     'chip-info',
  'Pre-order':  'chip-purple',
  'Table Order':'chip-success',
};

export function getCatEmoji(catName = '') {
  const map = {
    Burgers: '🍔', Drinks: '🥤', Desserts: '🍰', Starters: '🥗',
    Mains: '🍽️', Sides: '🍟', Pizza: '🍕', Sushi: '🍣',
    Pasta: '🍝', Salads: '🥗', Soups: '🍲',
  };
  for (const [k, v] of Object.entries(map)) {
    if (catName.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '🍽️';
}
