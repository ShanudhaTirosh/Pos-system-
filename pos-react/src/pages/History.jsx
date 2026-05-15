import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { db, Collections } from '../firebase';
import { fmt, STATUS_CHIP_CLASS } from '../utils/helpers';
import { Search, Calendar, Eye, X } from 'lucide-react';

export default function History() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async (isInitial = false) => {
    if (isInitial) {
      // If initial, we might want to skip the synchronous setLoading if it causes issues,
      // but let's just do it in a way that's clean.
    }
    setLoading(true);
    try {
      let q = query(collection(db, Collections.ORDERS), orderBy('createdAt', 'desc'), limit(100));
      if (statusFilter !== 'All') {
        q = query(collection(db, Collections.ORDERS), where('status', '==', statusFilter), orderBy('createdAt', 'desc'), limit(100));
      }
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      // To avoid the cascading render warning, we can avoid calling setState 
      // synchronously. Using a microtask or just the fact that it's async helps.
      await fetchOrders();
    };
    if (active) load();
    return () => { active = false; };
  }, [fetchOrders]);

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.tableNumber || '').toString().includes(search)
  );

  return (
    <div className="fade-in">
      <div className="section-header mb-4">
        <div>
          <h2 className="section-title">Transaction History</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Review past orders and performance</p>
        </div>
      </div>

      <div className="card-custom mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label-custom">Search</label>
            <div className="topbar-search w-100">
              <span className="search-icon"><Search size={14} /></span>
              <input className="form-control-custom" value={search} onChange={e => setSearch(e.target.value)} placeholder="Order ID, Table, Name..." />
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label-custom">Status</label>
            <div className="cat-pills mb-0">
              {['All', 'Paid', 'Served', 'Cancelled', 'Ready'].map(s => (
                <button key={s} className={`cat-pill ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>
              ))}
            </div>
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <button className="btn-ghost w-100" onClick={() => fetchOrders()}>
              <Calendar size={16} /> Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="card-custom p-0 overflow-hidden">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center p-5">Loading history...</td></tr>
            ) : filteredOrders.map(order => (
              <tr key={order.id}>
                <td className="mono fw-bold">{fmt.orderId(order.id)}</td>
                <td>{fmt.datetime(order.createdAt)}</td>
                <td>{order.type} {order.tableNumber && `· T${order.tableNumber}`}</td>
                <td>{(order.items || []).length} items</td>
                <td className="text-accent fw-bold">{fmt.currency(order.total)}</td>
                <td><span className={`chip ${STATUS_CHIP_CLASS[order.status]}`}>{order.status}</span></td>
                <td>
                  <button className="icon-btn" onClick={() => setSelectedOrder(order)}><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && !loading && (
          <div className="empty-state">No orders found matching your criteria.</div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="loading-overlay" style={{ background: 'rgba(0,0,0,0.7)', display: 'flex' }}>
          <div className="card-custom" style={{ width: '100%', maxWidth: 500 }}>
            <div className="section-header">
              <h3 className="section-title">Order Details</h3>
              <button className="icon-btn" onClick={() => setSelectedOrder(null)}><X size={18} /></button>
            </div>
            
            <div className="mt-4">
              <div className="d-flex justify-content-between mb-4">
                <div>
                  <div className="fw-bold">{fmt.orderId(selectedOrder.id)}</div>
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

              <div className="d-flex justify-content-between fw-bold pt-2">
                <span>Total Amount</span>
                <span className="text-accent fs-5">{fmt.currency(selectedOrder.total)}</span>
              </div>

              <div className="mt-4 pt-3 border-top border-secondary-subtle text-muted small">
                <div>Customer: {selectedOrder.customerName || 'N/A'}</div>
                <div>Server UID: {selectedOrder.createdBy}</div>
              </div>
            </div>

            <div className="mt-4">
              <button className="btn-accent w-100 justify-content-center" onClick={() => setSelectedOrder(null)}>Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
