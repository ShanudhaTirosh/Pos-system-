import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, orderBy, addDoc, updateDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { db, Collections } from '../firebase';
import { fmt, calcBillAmounts } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { CreditCard, Printer, Search, Download, CheckCircle2, X } from 'lucide-react';

export default function Billing() {
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountPct, setDiscountPct] = useState(0);
  const [searchBills, setSearchBills] = useState('');
  const [showReceipt, setShowReceipt] = useState(null); // bill object
  const toast = useToast();

  useEffect(() => {
    // Orders ready to bill (Served but not Paid)
    const unsubOrders = onSnapshot(query(collection(db, Collections.ORDERS), where('status', '==', 'Served'), orderBy('createdAt', 'desc')), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Bill History
    const unsubBills = onSnapshot(query(collection(db, Collections.BILLS), orderBy('createdAt', 'desc'), limit(50)), snap => {
      setBills(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubOrders(); unsubBills(); };
  }, []);

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);

  const billCalculation = useMemo(() => {
    if (!selectedOrder) return { subtotal: 0, tax: 0, total: 0, discount: 0, finalTotal: 0 };
    const subtotal = selectedOrder.subtotal;
    const { tax, total } = calcBillAmounts(subtotal);
    const discount = total * (discountPct / 100);
    const finalTotal = total - discount;
    return { subtotal, tax, total, discount, finalTotal };
  }, [selectedOrder, discountPct]);

  const processPayment = async () => {
    if (!selectedOrder) return;
    try {
      const billData = {
        orderId: selectedOrder.id,
        type: selectedOrder.type,
        items: selectedOrder.items,
        subtotal: billCalculation.subtotal,
        tax: billCalculation.tax,
        discount: billCalculation.discount,
        discountPct: parseFloat(discountPct),
        total: billCalculation.finalTotal,
        paymentMethod,
        status: 'Paid',
        tableNumber: selectedOrder.tableNumber || null,
        customerName: selectedOrder.customerName || null,
        createdBy: selectedOrder.createdBy,
        createdAt: serverTimestamp(),
        paidAt: serverTimestamp()
      };

      const ref = await addDoc(collection(db, Collections.BILLS), billData);
      await updateDoc(doc(db, Collections.ORDERS, selectedOrder.id), { status: 'Paid' });
      
      toast.success('Payment processed successfully');
      setSelectedOrderId(null);
      setDiscountPct(0);
      setShowReceipt({ id: ref.id, ...billData });
    } catch (err) {
      toast.error('Payment failed: ' + err.message);
    }
  };

  const exportBills = () => {
    const headers = ['Bill ID', 'Order ID', 'Type', 'Total', 'Method', 'Date'];
    const rows = bills.map(b => [fmt.orderId(b.id), fmt.orderId(b.orderId), b.type, b.total.toFixed(2), b.paymentMethod, fmt.datetime(b.createdAt)]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills_export_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  return (
    <div className="fade-in">
      <div className="section-header mb-4">
        <div>
          <h2 className="section-title">Billing & Payments</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Process transactions and print receipts</p>
        </div>
      </div>

      <div className="row g-4">
        
        {/* Orders Pending Column */}
        <div className="col-lg-5">
          <div className="card-custom p-0 overflow-hidden d-flex flex-column" style={{ maxHeight: '70vh' }}>
            <div className="p-3 border-bottom border-secondary-subtle bg-tertiary">
              <div className="card-title m-0">Ready for Billing</div>
              <div className="small text-muted">Orders served and waiting for payment</div>
            </div>
            <div className="scroll-list flex-1">
              {orders.length === 0 ? (
                <div className="empty-state p-5">No orders pending payment</div>
              ) : (
                orders.map(o => (
                  <div key={o.id} className={`live-order-item ${selectedOrderId === o.id ? 'selected' : ''}`} onClick={() => setSelectedOrderId(o.id)}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{fmt.orderId(o.id)}</div>
                        <div className="text-muted small">{o.type} {o.tableNumber && `· Table ${o.tableNumber}`}</div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-accent">{fmt.currency(o.total)}</div>
                        <div className="text-muted" style={{ fontSize: 10 }}>{fmt.time(o.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bill Preview Column */}
        <div className="col-lg-7">
          <div className="card-custom h-100 d-flex flex-column p-0 overflow-hidden">
            <div className="p-3 border-bottom border-secondary-subtle bg-tertiary">
              <div className="card-title m-0">Bill Preview</div>
            </div>
            
            <div className="p-4 flex-1 overflow-auto">
              {!selectedOrder ? (
                <div className="empty-state p-5">
                  <CreditCard size={48} className="mb-3 opacity-25" />
                  <p>Select an order from the list to generate its bill</p>
                </div>
              ) : (
                <div style={{ maxWidth: 500, margin: '0 auto' }}>
                  <div className="d-flex justify-content-between mb-4">
                    <div>
                      <div className="text-muted small">Billing for</div>
                      <h4 className="fw-bold m-0">{fmt.orderId(selectedOrder.id)}</h4>
                    </div>
                    <div className="text-end">
                      <div className="text-muted small">{fmt.datetime(selectedOrder.createdAt)}</div>
                      <div className="text-accent fw-bold">{selectedOrder.type}</div>
                    </div>
                  </div>

                  <table className="table-custom mb-4">
                    <thead>
                      <tr><th>Item</th><th className="text-center">Qty</th><th className="text-end">Total</th></tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name}</td>
                          <td className="text-center">{item.qty}</td>
                          <td className="text-end mono">{fmt.currency(item.price * item.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="bg-tertiary rounded p-3 mb-4">
                    <div className="total-row"><span>Subtotal</span><span>{fmt.currency(billCalculation.subtotal)}</span></div>
                    <div className="total-row"><span>Tax (8%)</span><span>{fmt.currency(billCalculation.tax)}</span></div>
                    {discountPct > 0 && <div className="total-row text-danger"><span>Discount ({discountPct}%)</span><span>-{fmt.currency(billCalculation.discount)}</span></div>}
                    <div className="total-row grand"><span>Total Due</span><span className="amount">{fmt.currency(billCalculation.finalTotal)}</span></div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label-custom">Payment Method</label>
                    <div className="d-flex gap-2 mb-3">
                      {['Cash', 'Card', 'UPI', 'Wallet'].map(m => (
                        <button key={m} className={`order-type-btn flex-fill ${paymentMethod === m ? 'active' : ''}`} onClick={() => setPaymentMethod(m)}>{m}</button>
                      ))}
                    </div>
                    <label className="form-label-custom">Add Discount (%)</label>
                    <input type="number" className="form-control-custom w-25" value={discountPct} onChange={e => setDiscountPct(e.target.value)} min="0" max="100" />
                  </div>

                  <div className="d-flex gap-2">
                    <button className="btn-accent flex-1 justify-content-center p-3" onClick={processPayment}>
                      <CheckCircle2 size={18} /> Process Payment
                    </button>
                    <button className="btn-ghost p-3" onClick={() => setShowReceipt(selectedOrder)}>
                      <Printer size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bill History Section */}
      <div className="card-custom mt-4">
        <div className="section-header mb-3">
          <span className="card-title">Recent Bills</span>
          <div className="d-flex gap-2">
            <div className="topbar-search">
              <span className="search-icon"><Search size={14} /></span>
              <input className="form-control-custom" placeholder="Search bills..." value={searchBills} onChange={e => setSearchBills(e.target.value)} />
            </div>
            <button className="btn-ghost" onClick={exportBills}><Download size={16} /> Export</button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="table-custom">
            <thead>
              <tr><th>Bill ID</th><th>Order</th><th>Type</th><th>Total</th><th>Method</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {bills.filter(b => fmt.orderId(b.id).includes(searchBills) || fmt.orderId(b.orderId).includes(searchBills)).map(bill => (
                <tr key={bill.id}>
                  <td className="mono fw-bold">{fmt.orderId(bill.id)}</td>
                  <td className="mono">{fmt.orderId(bill.orderId)}</td>
                  <td>{bill.type}</td>
                  <td className="fw-bold text-accent">{fmt.currency(bill.total)}</td>
                  <td><span className="chip chip-info">{bill.paymentMethod}</span></td>
                  <td className="text-muted small">{fmt.datetime(bill.createdAt)}</td>
                  <td><button className="icon-btn" onClick={() => setShowReceipt(bill)}><Printer size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="loading-overlay" style={{ background: 'rgba(0,0,0,0.8)', display: 'flex' }}>
          <div className="card-custom" style={{ width: '100%', maxWidth: 400, background: '#fff', color: '#000', padding: 0 }}>
            <div className="no-print p-2 border-bottom d-flex justify-content-between" style={{ background: '#f8f9fa' }}>
               <button className="btn-ghost btn-sm" onClick={() => setShowReceipt(null)}><X size={16} /> Close</button>
               <button className="btn-accent btn-sm" onClick={() => window.print()}><Printer size={16} /> Print</button>
            </div>
            <div className="p-4" id="printable-receipt">
              <div className="text-center mb-3">
                <h3 className="fw-bold m-0">🍽️ Restaurant Pro</h3>
                <div className="small">123 Premium Avenue, Luxury City</div>
                <div className="small">Tel: +1 234 567 890</div>
                <div className="mt-2 border-top border-dark border-dashed pt-2">
                  <div>Bill: {fmt.orderId(showReceipt.id || 'NEW')}</div>
                  {showReceipt.tableNumber && <div>Table: #{showReceipt.tableNumber}</div>}
                  <div style={{ fontSize: 10 }}>{new Date().toLocaleString()}</div>
                </div>
              </div>
              <div className="border-top border-dark border-dashed py-2">
                {showReceipt.items.map((item, i) => (
                  <div key={i} className="d-flex justify-content-between small">
                    <span>{item.name} ×{item.qty}</span>
                    <span>{fmt.currency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="border-top border-dark border-dashed pt-2 mb-3">
                <div className="d-flex justify-content-between small"><span>Subtotal</span><span>{fmt.currency(showReceipt.subtotal)}</span></div>
                <div className="d-flex justify-content-between small"><span>Tax (8%)</span><span>{fmt.currency(showReceipt.tax)}</span></div>
                {showReceipt.discount > 0 && <div className="d-flex justify-content-between small"><span>Discount</span><span>-{fmt.currency(showReceipt.discount)}</span></div>}
                <div className="d-flex justify-content-between fw-bold mt-1"><span>TOTAL</span><span>{fmt.currency(showReceipt.total)}</span></div>
              </div>
              <div className="text-center small border-top border-dark border-dashed pt-3">
                <div className="fw-bold">THANK YOU!</div>
                <div>Please visit us again</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .app-shell, .loading-overlay { display: none !important; }
          body { background: #fff !important; margin: 0; padding: 0; }
          #printable-receipt { display: block !important; width: 100%; position: absolute; top: 0; left: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
