import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, Collections } from '../firebase';
import { processImage } from '../utils/imageProcess';
import { fmt, getCatEmoji } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { Plus, Search, Camera, X } from 'lucide-react';

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const toast = useToast();

  // Form State
  const [form, setForm] = useState({
    name: '', price: '', categoryId: '', description: '', 
    available: true, prepTime: '', tags: '', imageURL: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubCats = onSnapshot(query(collection(db, Collections.CATEGORIES), orderBy('name')), snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubItems = onSnapshot(query(collection(db, Collections.MENU_ITEMS), orderBy('name')), snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubCats(); unsubItems(); };
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await processImage(file);
      setForm(prev => ({ ...prev, imageURL: base64 }));
      toast.success('Image compressed & converted to WebP');
    } catch (err) {
      console.error(err);
      toast.error('Image processing failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) return toast.error('Please fill required fields');
    
    setUploading(true);
    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        prepTime: parseInt(form.prepTime) || null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        updatedAt: serverTimestamp()
      };

      if (editingItem) {
        await updateDoc(doc(db, Collections.MENU_ITEMS, editingItem.id), data);
        toast.success('Item updated');
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, Collections.MENU_ITEMS), data);
        toast.success('Item added');
      }
      closeModal();
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        name: item.name, price: item.price, categoryId: item.categoryId,
        description: item.description || '', available: item.available !== false,
        prepTime: item.prepTime || '', tags: (item.tags || []).join(', '),
        imageURL: item.imageURL || ''
      });
    } else {
      setEditingItem(null);
      setForm({ name: '', price: '', categoryId: '', description: '', available: true, prepTime: '', tags: '', imageURL: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                         (item.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'All' || categories.find(c => c.id === item.categoryId)?.name === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fade-in">
      <div className="section-header mb-4">
        <div>
          <h2 className="section-title">Menu Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Organize your food catalog</p>
        </div>
        <button className="btn-accent" onClick={() => openModal()}><Plus size={18} /> Add Item</button>
      </div>

      <div className="card-custom mb-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="topbar-search" style={{ flex: 1, minWidth: 200 }}>
            <span className="search-icon"><Search size={14} /></span>
            <input type="text" placeholder="Search menu…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div className="cat-pills" style={{ marginBottom: 0 }}>
            {['All', ...categories.map(c => c.name)].map(cat => (
              <button key={cat} className={`cat-pill ${selectedCat === cat ? 'active' : ''}`} onClick={() => setSelectedCat(cat)}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="menu-grid">
        {filteredItems.map(item => (
          <div key={item.id} className="menu-item-card" onClick={() => openModal(item)}>
            <div className="menu-item-img">
              {item.imageURL ? <img src={item.imageURL} alt={item.name} /> : getCatEmoji(categories.find(c => c.id === item.categoryId)?.name)}
            </div>
            <div className="menu-item-body">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="menu-item-name">{item.name}</div>
                {!item.available && <span className="chip chip-danger" style={{ fontSize: 9 }}>Off</span>}
              </div>
              <div className="menu-item-cat">{categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="menu-item-price">{fmt.currency(item.price)}</div>
                {item.prepTime && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>⏱ {item.prepTime}m</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Item Modal */}
      {isModalOpen && (
        <div className="loading-overlay" style={{ background: 'rgba(0,0,0,0.7)', display: 'flex' }}>
          <div className="card-custom" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="section-header">
              <h3 className="section-title">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
              <div className="mb-3">
                <label className="form-label-custom">Food Image (Converted to WebP)</label>
                <div className="img-preview" onClick={() => document.getElementById('imgInput').click()}>
                  {form.imageURL ? (
                    <img src={form.imageURL} alt="preview" />
                  ) : (
                    <>
                      <Camera size={32} />
                      <span>{uploading ? 'Processing…' : 'Click to upload'}</span>
                    </>
                  )}
                  <input type="file" id="imgInput" hidden accept="image/*" onChange={handleImageChange} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="mb-3">
                  <label className="form-label-custom">Item Name *</label>
                  <input className="form-control-custom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Burger" />
                </div>
                <div className="mb-3">
                  <label className="form-label-custom">Price *</label>
                  <input type="number" className="form-control-custom" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" step="0.01" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="mb-3">
                  <label className="form-label-custom">Category *</label>
                  <select className="form-control-custom" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label-custom">Availability</label>
                  <select className="form-control-custom" value={form.available} onChange={e => setForm({ ...form, available: e.target.value === 'true' })}>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Description</label>
                <textarea className="form-control-custom" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="2"></textarea>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-accent" style={{ flex: 1 }} disabled={uploading}>
                  {uploading ? 'Processing…' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
