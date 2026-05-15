import { useState } from 'react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db, Collections } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Shield, Save, Camera, Lock } from 'lucide-react';
import { processImage } from '../utils/imageProcess';

export default function Profile() {
  const { user, userProfile, setUserProfile } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    displayName: userProfile?.displayName || user?.displayName || '',
    email: user?.email || '',
    phone: userProfile?.phone || '',
    photoURL: userProfile?.photoURL || user?.photoURL || ''
  });

  const [passwords, setPasswords] = useState({ current: '', new: '' });

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await processImage(file, 300, 0.7); // Smaller avatar
      setForm(prev => ({ ...prev, photoURL: base64 }));
      toast.success('Avatar updated locally. Click Save to persist.');
    } catch (err) {
      console.error(err);
      toast.error('Avatar processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update Firebase Auth Profile
      await updateProfile(auth.currentUser, { 
        displayName: form.displayName,
        photoURL: form.photoURL
      });

      // Update Firestore
      const userRef = doc(db, Collections.USERS, user.uid);
      const updates = {
        displayName: form.displayName,
        phone: form.phone,
        photoURL: form.photoURL,
        updatedAt: new Date()
      };
      await updateDoc(userRef, updates);
      
      setUserProfile(prev => ({ ...prev, ...updates }));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Update failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.new) return toast.error('Please enter a new password');
    setLoading(true);
    try {
      await updatePassword(auth.currentUser, passwords.new);
      toast.success('Password updated');
      setPasswords({ current: '', new: '' });
    } catch (err) {
      toast.error('Password update failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="section-header mb-4">
        <h2 className="section-title">Account Settings</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* Profile Card */}
        <div className="card-custom">
          <div className="card-title mb-4">Personal Information</div>
          
          <form onSubmit={handleUpdateProfile}>
            <div className="profile-avatar-wrap mb-4">
              <div className="profile-avatar-large">
                {form.photoURL ? (
                  <img src={form.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (form.displayName || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <label className="avatar-upload-btn">
                <Camera size={14} />
                <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>

            <div className="mb-3">
              <label className="form-label-custom">Display Name</label>
              <div className="topbar-search" style={{ width: '100%' }}>
                <span className="search-icon"><User size={14} /></span>
                <input className="form-control-custom" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label-custom">Phone Number</label>
              <input className="form-control-custom" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
            </div>

            <div className="mb-4">
              <label className="form-label-custom">Email Address</label>
              <div className="topbar-search" style={{ width: '100%' }}>
                <span className="search-icon"><Mail size={14} /></span>
                <input className="form-control-custom" value={form.email} disabled />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed directly here for security.</div>
            </div>

            <button type="submit" className="btn-accent w-100 justify-content-center" disabled={loading}>
              <Save size={16} /> Save Changes
            </button>
          </form>
        </div>

        {/* Security Card */}
        <div className="d-flex flex-column gap-4">
          <div className="card-custom">
            <div className="card-title mb-4">Security</div>
            <div className="d-flex align-items-center gap-3 mb-4 p-3" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ padding: 10, background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: '50%' }}>
                <Shield size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Account Role</div>
                <div style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>{userProfile?.role || 'Staff'}</div>
              </div>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="form-label-custom">New Password</label>
                <div className="topbar-search" style={{ width: '100%' }}>
                  <span className="search-icon"><Lock size={14} /></span>
                  <input type="password" className="form-control-custom" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} placeholder="Min. 6 chars" />
                </div>
              </div>
              <button type="submit" className="btn-ghost w-100 justify-content-center" disabled={loading}>
                Update Password
              </button>
            </form>
          </div>

          <div className="card-custom" style={{ borderStyle: 'dashed' }}>
            <div className="card-title" style={{ color: 'var(--text-muted)' }}>System Info</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
              <div className="d-flex justify-content-between mb-1">
                <span>UID:</span>
                <span className="mono">{user?.uid.slice(0, 10)}...</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Last Login:</span>
                <span>{user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
