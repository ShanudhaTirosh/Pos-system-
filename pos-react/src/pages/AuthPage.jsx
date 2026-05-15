import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, Collections } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Staff');

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      const msgs = {
        'auth/user-not-found':  'No account with that email.',
        'auth/wrong-password':  'Incorrect password.',
        'auth/invalid-email':   'Invalid email address.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      };
      toast.error(msgs[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('Please fill in all fields');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(newUser, { displayName: name });

      await setDoc(doc(db, Collections.USERS, newUser.uid), {
        displayName:  name,
        email:        email,
        role:         role,
        phone:        '',
        photoURL:     '',
        preferences:  { theme: 'dark', currency: '$' },
        createdAt:    serverTimestamp(),
      });

      navigate('/dashboard');
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email':        'Invalid email address.',
        'auth/weak-password':        'Password is too weak.',
      };
      toast.error(msgs[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-grid"></div>
      <div className="auth-bg-glow"></div>

      <div className="d-flex align-items-center gap-5 position-relative" style={{ zIndex: 1, maxWidth: 900, width: '100%', padding: 20 }}>
        
        {/* Left Panel: Info (Desktop only) */}
        <div className="d-none d-lg-block" style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 12 }}>
            Complete<br />Restaurant<br /><span style={{ color: 'var(--accent)' }}>Command Center</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Manage tables, orders, kitchen, billing and staff from a single unified platform.
          </p>
          <ul className="feature-list" style={{ listStyle: 'none', padding: 0 }}>
            {['🪑 Real-time Table Management', '🛒 Live Order Tracking', '👨‍🍳 Kitchen Display System', '💳 Instant Billing & Receipts', '📊 Revenue Analytics', '🎨 Customizable Dashboard'].map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 13.5, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Auth Card */}
        <div className="auth-card" style={{ flex: '0 0 420px' }}>
          <div className="auth-logo">🍽️</div>
          <h1 className="auth-title">Restaurant Pro</h1>
          <p className="auth-subtitle">Production-ready management system</p>

          {/* Tabs */}
          <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: 24 }}>
            <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')} style={{ flex: 1, padding: 10, border: 'none', background: tab === 'login' ? 'var(--accent)' : 'var(--bg-tertiary)', color: tab === 'login' ? '#000' : 'var(--text-secondary)', fontWeight: tab === 'login' ? 600 : 500 }}>Sign In</button>
            <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')} style={{ flex: 1, padding: 10, border: 'none', background: tab === 'register' ? 'var(--accent)' : 'var(--bg-tertiary)', color: tab === 'register' ? '#000' : 'var(--text-secondary)', fontWeight: tab === 'register' ? 600 : 500 }}>Register</button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label-custom">Email Address</label>
                <input type="email" className="form-control-custom" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@restaurant.com" />
              </div>
              <div className="mb-4">
                <label className="form-label-custom">Password</label>
                <input type="password" className="form-control-custom" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <button type="submit" className="btn-accent w-100 justify-content-center" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label className="form-label-custom">Full Name</label>
                <input type="text" className="form-control-custom" value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" />
              </div>
              <div className="mb-3">
                <label className="form-label-custom">Email Address</label>
                <input type="email" className="form-control-custom" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@restaurant.com" />
              </div>
              <div className="mb-3">
                <label className="form-label-custom">Password</label>
                <input type="password" className="form-control-custom" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" />
              </div>
              <div className="mb-4">
                <label className="form-label-custom">Role</label>
                <select className="form-control-custom" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Staff">Staff</option>
                  <option value="Kitchen">Kitchen</option>
                </select>
              </div>
              <button type="submit" className="btn-accent w-100 justify-content-center" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>
            </form>
          )}

          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
            By continuing you agree to our Terms of Service & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
