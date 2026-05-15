import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, serverTimestamp, where, limit } from 'firebase/firestore';
import { db, Collections } from '../firebase';
import { fmt, STATUS_CHIP_CLASS, getCatEmoji, calcBillAmounts, generateOrderId } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShoppingCart, Radio, Search, Trash2, CheckCircle2, ChevronRight, Clock, User, Hash, X } from 'lucide-react';

export default function Orders() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('new'); // new | live
  
  // Data State
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [liveOrders, setLiveOrders] = useState([]);
  
  // New Order State
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Table Order');
  const [selectedTable, setSelectedTable] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCat, setPickerCat] = useState('All');

  // Live Orders State
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const unsubCats   = onSnapshot(query(collection(db, Collections.CATEGORIES), orderBy('name')), snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMenu   = onSnapshot(query(collection(db, Collections.MENU_ITEMS), where('available', '==', true)), snap => setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTables = onSnapshot(query(collection(db, Collections.TABLES), orderBy('number')), snap => setTables(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubOrders = onSnapshot(query(collection(db, Collections.ORDERS), orderBy('createdAt', 'desc'), limit(50)), snap => setLiveOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubCats(); unsubMenu(); unsubTables(); unsubOrders(); };
  }, []);

  // Filtered Menu
  const filteredMenu = useMemo(() => {
    return menuItems.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(pickerSearch.toLowerCase());
      const matchesCat = pickerCat === 'All' || categories.find(c => c.id === i.categoryId)?.name === pickerCat;
      return matchesSearch && matchesCat;
    });
  }, [menuItems, pickerSearch, pickerCat, categories]);

  // Cart Functions
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const { tax, total } = calcBillAmounts(cartSubtotal);

  const placeOrder = async () => {
    if (cart.length === 0) return toast.error('Add items to order');
    if (orderType === 'Table Order' && !selectedTable) return toast.error('Select a table');

    try {
      const orderData = {
        type: orderType,
        status: 'Pending',
        items: cart,
        subtotal: cartSubtotal,
        tax,
        total,
        tableNumber: selectedTable ? parseInt(selectedTable) : null,
        customerName: customerName || null,
        scheduledAt: scheduleTime ? new Date(scheduleTime) : null,
        notes: orderNotes || null,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      };

      const ref = await addDoc(collection(db, Collections.ORDERS), orderData);

      // Update table status
      if (orderType === 'Table Order' && selectedTable) {
        const table = tables.find(t => t.number.toString() === selectedTable.toString());
        if (table) await updateDoc(doc(db, Collections.TABLES, table.id), { status: 'Occupied' });
      }

      toast.success(`Order placed: ${fmt.orderId(ref.id)}`);
      setCart([]);
      setOrderNotes('');
      setTab('live');
    } catch (err) {
      toast.error('Order failed: ' + err.message);
    }
  };

  // Live Order Details
  const selectedOrder = useMemo(() => liveOrders.find(o => o.id === selectedOrderId), [liveOrders, selectedOrderId]);

  const updateStatus = async (order, newStatus) => {
    try {
      await updateDoc(doc(db, Collections.ORDERS, order.id), { 
        status: newStatus,
        [`${newStatus.toLowerCase()}At`]: serverTimestamp()
      });

      if (newStatus === 'Served' && order.tableNumber) {
        const table = tables.find(t => t.number === order.tableNumber);
        if (table) await updateDoc(doc(db, Collections.TABLES, table.id), { status: 'Available' });
      }

      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error('Update failed');
    }
  };

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Tab Headers */}
      <div className="d-flex gap-2 mb-3">
        <button className={`order-type-btn ${tab === 'new' ? 'active' : ''}`} onClick={() => setTab('new')}><ShoppingCart size={16} /> New Order</button>
        <button className={`order-type-btn ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}><Radio size={16} /> Live Orders</button>
      </div>

      {tab === 'new' ? (
        <div className="d-flex gap-4 flex-1 overflow-hidden">
          
          {/* Menu Picker Column */}
          <div className="d-flex flex-column gap-3 flex-1 overflow-hidden">
            
            {/* Order Settings */}
            <div className="card-custom p-3">
              <div className="row g-3">
                <div className="col-auto">
                  <label className="form-label-custom">Order Type</label>
                  <div className="d-flex gap-2">
                    {['Table Order', 'Takeaway', 'Pre-order'].map(t => (
                      <button key={t} className={`order-type-btn ${orderType === t ? 'active' : ''}`} onClick={() => setOrderType(t)}>{t}</button>
                    ))}
                  </div>
                </div>
                {orderType === 'Table Order' && (
                  <div className="col-auto">
                    <label className="form-label-custom">Table #</label>
                    <select className="form-control-custom" value={selectedTable} onChange={e => setSelectedTable(e.target.value)}>
                      <option value="">Select...</option>
                      {tables.map(t => <option key={t.id} value={t.number}>Table {t.number} ({t.status})</option>)}
                    </select>
                  </div>
                )}
                {orderType !== 'Table Order' && (
                  <div className="col-auto">
                    <label className="form-label-custom">Customer Name</label>
                    <input className="form-control-custom" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Optional" />
                  </div>
                )}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="card-custom p-2">
              <div className="d-flex gap-2 align-items-center">
                <div className="topbar-search" style={{ flex: 1 }}>
                  <span className="search-icon"><Search size={14} /></span>
                  <input className="form-control-custom" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder="Search items..." />
                </div>
                <div className="cat-pills mb-0">
                  {['All', ...categories.map(c => c.name)].map(cat => (
                    <button key={cat} className={`cat-pill ${pickerCat === cat ? 'active' : ''}`} onClick={() => setPickerCat(cat)}>{cat}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Menu Grid */}
            <div className="flex-1 overflow-auto">
              <div className="menu-grid">
                {filteredMenu.map(item => {
                  const qty = cart.find(i => i.id === item.id)?.qty || 0;
                  return (
                    <div key={item.id} className="menu-item-card position-relative" onClick={() => addToCart(item)}>
                      <div className="menu-item-img">
                        {item.imageURL ? <img src={item.imageURL} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getCatEmoji(categories.find(c => c.id === item.categoryId)?.name)}
                        {qty > 0 && <div className="position-absolute top-0 end-0 m-2 badge bg-warning text-dark">{qty}</div>}
                      </div>
                      <div className="menu-item-body">
                        <div className="menu-item-name">{item.name}</div>
                        <div className="menu-item-price">{fmt.currency(item.price)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cart Column */}
          <div className="order-panel" style={{ width: 340 }}>
            <div className="order-panel-header">
              <div className="fw-bold">Current Selection</div>
              <div className="text-muted" style={{ fontSize: 11 }}>{orderType} {selectedTable && `· Table ${selectedTable}`}</div>
            </div>
            
            <div className="scroll-list flex-1">
              {cart.length === 0 ? (
                <div className="empty-state p-5">
                  <ShoppingCart size={32} className="mb-2 opacity-25" />
                  <div>No items yet</div>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="order-item">
                    <div style={{ flex: 1 }}>
                      <div className="order-item-name">{item.name}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{fmt.currency(item.price)}</div>
                    </div>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                      <div className="qty-display">{item.qty}</div>
                      <button className="qty-btn" onClick={() => changeQty(item.id, 1)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="order-totals">
              <div className="total-row"><span>Subtotal</span><span>{fmt.currency(cartSubtotal)}</span></div>
              <div className="total-row"><span>Tax (8%)</span><span>{fmt.currency(tax)}</span></div>
              <div className="total-row grand"><span>Total</span><span className="amount">{fmt.currency(total)}</span></div>
              
              <textarea className="form-control-custom mt-3" value={orderNotes} onChange={e => setOrderNotes(e.target.value)} placeholder="Notes for kitchen..." rows="2" style={{ resize: 'none' }}></textarea>
              
              <button className="btn-accent w-100 justify-content-center mt-3 p-2" onClick={placeOrder} disabled={cart.length === 0}>
                Place Order
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* LIVE ORDERS TAB */
        <div className="d-flex gap-4 flex-1 overflow-hidden">
          
          {/* Orders List Column */}
          <div className="d-flex flex-column gap-3 flex-1 overflow-hidden">
            <div className="cat-pills mb-0">
              {['All', 'Pending', 'Cooking', 'Ready', 'Served', 'Paid', 'Cancelled'].map(s => (
                <button key={s} className={`cat-pill ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>
              ))}
            </div>

            <div className="card-custom p-0 overflow-hidden d-flex flex-column flex-1">
              <div className="scroll-list">
                {liveOrders.filter(o => statusFilter === 'All' || o.status === statusFilter).map(order => (
                  <div key={order.id} className={`live-order-item ${selectedOrderId === order.id ? 'selected' : ''}`} onClick={() => setSelectedOrderId(order.id)}>
                    <div className="d-flex justify-content-between">
                      <div>
                        <div className="fw-bold">{fmt.orderId(order.id)}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{order.type} {order.tableNumber && `· Table ${order.tableNumber}`}</div>
                      </div>
                      <div className="text-end">
                        <span className={`chip ${STATUS_CHIP_CLASS[order.status] || 'chip-muted'}`}>{order.status}</span>
                        <div className="fw-bold text-accent mt-1">{fmt.currency(order.total)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="order-panel" style={{ width: 400 }}>
            <div className="order-panel-header">
              <div className="fw-bold">Order Details</div>
            </div>
            
            <div className="scroll-list flex-1">
              {!selectedOrder ? (
                <div className="empty-state p-5">Select an order to view details</div>
              ) : (
                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                      <h4 className="m-0 fw-bold">{fmt.orderId(selectedOrder.id)}</h4>
                      <div className="text-muted small">{fmt.datetime(selectedOrder.createdAt)}</div>
                    </div>
                    <span className={`chip ${STATUS_CHIP_CLASS[selectedOrder.status]}`}>{selectedOrder.status}</span>
                  </div>

                  <div className="mb-4">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between py-2 border-bottom border-secondary-subtle">
                        <span>{item.qty}× {item.name}</span>
                        <span className="mono">{fmt.currency(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  {selectedOrder.notes && (
                    <div className="alert alert-dark border-secondary p-2 small mb-4">
                      <strong>Notes:</strong> {selectedOrder.notes}
                    </div>
                  )}

                  <div className="d-flex flex-column gap-2">
                    {selectedOrder.status === 'Pending' && (
                      <button className="btn-accent w-100 justify-content-center" onClick={() => updateStatus(selectedOrder, 'Cooking')}>Mark as Cooking</button>
                    )}
                    {selectedOrder.status === 'Cooking' && (
                      <button className="btn-accent w-100 justify-content-center" onClick={() => updateStatus(selectedOrder, 'Ready')}>Mark as Ready</button>
                    )}
                    {selectedOrder.status === 'Ready' && (
                      <button className="btn-accent w-100 justify-content-center" onClick={() => updateStatus(selectedOrder, 'Served')}>Mark as Served</button>
                    )}
                    {selectedOrder.status === 'Served' && (
                      <button className="btn-success w-100 justify-content-center" onClick={() => updateStatus(selectedOrder, 'Paid')}>Mark as Paid</button>
                    )}
                    
                    {['Pending', 'Cooking'].includes(selectedOrder.status) && (
                      <button className="btn-ghost text-danger w-100 justify-content-center" onClick={() => updateStatus(selectedOrder, 'Cancelled')}>Cancel Order</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedOrder && (
              <div className="order-totals">
                <div className="total-row grand"><span>Total</span><span className="amount">{fmt.currency(selectedOrder.total)}</span></div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
