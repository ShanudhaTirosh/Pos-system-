import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, Collections } from '../firebase';
import { fmt } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { ChefHat, Clock, AlertCircle } from 'lucide-react';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const toast = useToast();

  useEffect(() => {
    // Only show Pending or Cooking orders for kitchen
    const q = query(
      collection(db, Collections.ORDERS),
      where('status', 'in', ['Pending', 'Cooking']),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, Collections.ORDERS, id), {
        status: newStatus,
        [`${newStatus.toLowerCase()}At`]: serverTimestamp()
      });
      toast.success(`Order ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order');
    }
  };

  return (
    <div className="fade-in">
      <div className="section-header mb-4">
        <div>
          <h2 className="section-title">Kitchen Display</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Active preparation queue</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="pulse-dot green"></span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Live Connection</span>
        </div>
      </div>

      <div className="d-flex gap-4 overflow-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        
        {/* Pending Section */}
        <div style={{ flex: '0 0 350px' }}>
          <div className="d-flex align-items-center gap-2 mb-3 px-2">
            <AlertCircle size={18} className="text-warning" />
            <span className="fw-bold">Incoming ({orders.filter(o => o.status === 'Pending').length})</span>
          </div>
          <div className="d-flex flex-column gap-3">
            {orders.filter(o => o.status === 'Pending').map(order => (
              <KitchenCard key={order.id} order={order} onAction={() => updateStatus(order.id, 'Cooking')} actionLabel="Start Cooking" variant="pending" />
            ))}
          </div>
        </div>

        {/* Cooking Section */}
        <div style={{ flex: '0 0 350px' }}>
          <div className="d-flex align-items-center gap-2 mb-3 px-2">
            <ChefHat size={18} className="text-info" />
            <span className="fw-bold">In Progress ({orders.filter(o => o.status === 'Cooking').length})</span>
          </div>
          <div className="d-flex flex-column gap-3">
            {orders.filter(o => o.status === 'Cooking').map(order => (
              <KitchenCard key={order.id} order={order} onAction={() => updateStatus(order.id, 'Ready')} actionLabel="Mark Ready" variant="cooking" />
            ))}
          </div>
        </div>

      </div>

      {orders.length === 0 && (
        <div className="empty-state p-5 mt-5">
          <ChefHat size={48} className="mb-3 opacity-25" />
          <h4>Kitchen is clear!</h4>
          <p className="text-muted">No active orders to prepare right now.</p>
        </div>
      )}
    </div>
  );
}

function KitchenCard({ order, onAction, actionLabel, variant }) {
  const timeSince = (ts) => {
    if (!ts) return '0m';
    const mins = Math.floor((new Date() - ts.toDate()) / 60000);
    return `${mins}m ago`;
  };

  return (
    <div className={`kitchen-card ${variant}`}>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div>
          <div className="kitchen-order-id">{fmt.orderId(order.id)}</div>
          <div className="kitchen-table">{order.type === 'Table Order' ? `Table ${order.tableNumber}` : order.type}</div>
        </div>
        <div className="kitchen-time d-flex align-items-center gap-1">
          <Clock size={10} /> {timeSince(order.createdAt)}
        </div>
      </div>

      <div className="kitchen-items border-top border-secondary-subtle pt-2 mb-3">
        {order.items.map((item, i) => (
          <div key={i} className="d-flex justify-content-between">
            <span className="fw-bold text-light">×{item.qty} {item.name}</span>
          </div>
        ))}
        {order.notes && (
          <div className="mt-2 p-2 rounded bg-input text-warning" style={{ fontSize: 11 }}>
            <strong>Note:</strong> {order.notes}
          </div>
        )}
      </div>

      <button className="btn-accent w-100 justify-content-center p-2" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
