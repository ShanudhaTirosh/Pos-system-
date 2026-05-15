import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, Collections } from '../firebase';
import { useToast } from '../context/ToastContext';
import { Plus, Users, MapPin, X, Trash2, LayoutGrid, List, Edit2 } from 'lucide-react';

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [view, setView] = useState('grid'); // grid or list
  const toast = useToast();

  const [form, setForm] = useState({
    number: '',
    capacity: 4,
    area: 'Main Hall',
    status: 'Available'
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, Collections.TABLES), orderBy('number')), snap => {
      setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.number) return toast.error('Table number is required');
    
    try {
      const data = {
        ...form,
        number: form.number.toString(),
        capacity: parseInt(form.capacity),
        updatedAt: serverTimestamp()
      };

      if (editingTable) {
        await updateDoc(doc(db, Collections.TABLES, editingTable.id), data);
        toast.success('Table updated');
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, Collections.TABLES), data);
        toast.success('Table added');
      }
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save table');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table?')) return;
    try {
      await deleteDoc(doc(db, Collections.TABLES, id));
      toast.success('Table removed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  const openModal = (table = null) => {
    if (table) {
      setEditingTable(table);
      setForm({
        number: table.number,
        capacity: table.capacity,
        area: table.area,
        status: table.status
      });
    } else {
      setEditingTable(null);
      setForm({ number: (tables.length + 1).toString(), capacity: 4, area: 'Main Hall', status: 'Available' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTable(null);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Available': return 'available';
      case 'Occupied': return 'occupied';
      case 'Reserved': return 'reserved';
      default: return '';
    }
  };

  return (
    <div className="fade-in">
      <div className="section-header mb-4">
        <div>
          <h2 className="section-title">Table Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Monitor and organize your floor layout</p>
        </div>
        <div className="d-flex gap-2">
          <div className="btn-group" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
            <button className={`btn-ghost ${view === 'grid' ? 'active' : ''}`} style={{ padding: '6px 10px', border: 'none' }} onClick={() => setView('grid')}><LayoutGrid size={16} /></button>
            <button className={`btn-ghost ${view === 'list' ? 'active' : ''}`} style={{ padding: '6px 10px', border: 'none' }} onClick={() => setView('list')}><List size={16} /></button>
          </div>
          <button className="btn-accent" onClick={() => openModal()}><Plus size={18} /> Add Table</button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="table-grid">
          {tables.map(table => (
            <div key={table.id} className={`floor-table-card ${getStatusClass(table.status)}`} onClick={() => openModal(table)}>
              <div className="table-number">{table.number}</div>
              <div className="table-area"><MapPin size={10} /> {table.area}</div>
              <div className="table-cap"><Users size={10} /> {table.capacity} Seats</div>
              <div style={{ marginTop: 12 }}>
                <span className={`chip chip-${getStatusClass(table.status) === 'available' ? 'success' : getStatusClass(table.status) === 'occupied' ? 'danger' : 'warning'}`} style={{ fontSize: 9 }}>
                  {table.status}
                </span>
              </div>
            </div>
          ))}
          {tables.length === 0 && <div className="empty-state w-100">No tables configured yet.</div>}
        </div>
      ) : (
        <div className="card-custom p-0 overflow-hidden">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Number</th>
                <th>Area</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tables.map(table => (
                <tr key={table.id}>
                  <td className="fw-bold">Table {table.number}</td>
                  <td>{table.area}</td>
                  <td>{table.capacity} Seats</td>
                  <td>
                    <span className={`chip chip-${getStatusClass(table.status) === 'available' ? 'success' : getStatusClass(table.status) === 'occupied' ? 'danger' : 'warning'}`}>
                      {table.status}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button className="icon-btn" onClick={() => openModal(table)}><Edit2 size={14} /></button>
                      <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(table.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Modal */}
      {isModalOpen && (
        <div className="loading-overlay" style={{ background: 'rgba(0,0,0,0.7)', display: 'flex' }}>
          <div className="card-custom" style={{ width: '100%', maxWidth: 450 }}>
            <div className="section-header">
              <h3 className="section-title">{editingTable ? 'Edit Table' : 'Add New Table'}</h3>
              <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
              <div className="mb-3">
                <label className="form-label-custom">Table Number</label>
                <input className="form-control-custom" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="e.g. 05" />
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Area / Location</label>
                <select className="form-control-custom" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}>
                  <option value="Main Hall">Main Hall</option>
                  <option value="Terrace">Terrace</option>
                  <option value="VIP Room">VIP Room</option>
                  <option value="Bar">Bar Area</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Seating Capacity</label>
                <input type="number" className="form-control-custom" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
              </div>

              <div className="mb-4">
                <label className="form-label-custom">Current Status</label>
                <select className="form-control-custom" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Reserved">Reserved</option>
                </select>
              </div>

              <div className="d-flex gap-2 pt-2">
                <button type="button" className="btn-ghost flex-fill" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-accent flex-fill">Save Table</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

