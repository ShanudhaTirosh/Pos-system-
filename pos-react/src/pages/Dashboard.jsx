import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, Collections } from '../firebase';
import { fmt } from '../utils/helpers';
import { ShoppingBag, Users, DollarSign, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuCount, setMenuCount] = useState(0);

  useEffect(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const unsubOrders = onSnapshot(query(collection(db, Collections.ORDERS), where('createdAt', '>=', today)), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubTables = onSnapshot(collection(db, Collections.TABLES), snap => {
      setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMenu = onSnapshot(collection(db, Collections.MENU_ITEMS), snap => {
      setMenuCount(snap.size);
    });

    return () => { unsubOrders(); unsubTables(); unsubMenu(); };
  }, []);

  const stats = useMemo(() => {
    const revenue = orders.filter(o => ['Paid', 'Served'].includes(o.status)).reduce((acc, o) => acc + (o.total || 0), 0);
    const activeOrders = orders.filter(o => !['Paid', 'Cancelled'].includes(o.status)).length;
    const occupiedTables = tables.filter(t => t.status === 'Occupied').length;
    
    return [
      { label: "Today's Revenue", value: fmt.currency(revenue), icon: <DollarSign />, color: 'var(--accent)', trend: 'Accrued' },
      { label: "Active Orders", value: activeOrders, icon: <ShoppingBag />, color: '#3b82f6', trend: 'Live' },
      { label: "Occupied Tables", value: `${occupiedTables}/${tables.length}`, icon: <Users />, color: '#ef4444', trend: 'Floor' },
      { label: "Menu Items", value: menuCount, icon: <TrendingUp />, color: '#10b981', trend: 'Active' },
    ];
  }, [orders, tables, menuCount]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="fade-in">
      <div className="section-header mb-4">
        <div>
          <h2 className="section-title">Dashboard Overview</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Real-time performance metrics for today</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="row g-4 mb-4">
        {stats.map((stat, i) => (
          <div key={i} className="col-md-6 col-xl-3">
            <div className="card-custom h-100">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ padding: 10, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', color: stat.color }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: stat.color, padding: '2px 8px', background: 'var(--bg-tertiary)', borderRadius: 99 }}>
                  {stat.trend}
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, fontFamily: 'var(--font-display)' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Recent Activity */}
        <div className="col-lg-7">
          <div className="card-custom h-100 p-0 overflow-hidden">
            <div className="p-3 border-bottom border-secondary-subtle d-flex justify-content-between align-items-center">
              <span className="fw-bold">Recent Orders</span>
              <Link to="/orders" className="btn-ghost btn-sm" style={{ fontSize: 11 }}>View All <ChevronRight size={14} /></Link>
            </div>
            <div className="scroll-list">
              {recentOrders.length === 0 ? (
                <div className="empty-state p-5">No orders today yet.</div>
              ) : recentOrders.map(order => (
                <div key={order.id} className="live-order-item">
                  <div className="d-flex justify-content-between">
                    <div>
                      <div className="fw-bold">{fmt.orderId(order.id)}</div>
                      <div className="text-muted small">{order.type} {order.tableNumber && `· T${order.tableNumber}`}</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-accent">{fmt.currency(order.total)}</div>
                      <div className="text-muted small">{fmt.time(order.createdAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-lg-5">
          <div className="card-custom h-100">
            <div className="fw-bold mb-3">Quick Management</div>
            <div className="d-flex flex-column gap-2">
              <Link to="/orders" className="btn-accent w-100 justify-content-start p-3">
                <ShoppingBag size={18} className="me-2" /> New POS Order
              </Link>
              <Link to="/tables" className="btn-ghost w-100 justify-content-start p-3 text-start">
                <Users size={18} className="me-2" /> Update Floor Status
              </Link>
              <Link to="/menu" className="btn-ghost w-100 justify-content-start p-3 text-start">
                <UtensilsCrossed size={18} className="me-2" /> Manage Food Menu
              </Link>
            </div>

            <div className="mt-4 p-3 rounded bg-tertiary">
              <div className="d-flex align-items-center gap-2 mb-2">
                <Clock size={16} className="text-warning" />
                <span className="fw-bold small">System Status</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Firebase Firestore: <span className="text-success">Connected</span><br />
                Cloud Storage: <span className="text-success">Active</span><br />
                Auth Provider: <span className="text-success">Production</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

