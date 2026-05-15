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
      <div className="auth-bg-glow glow-2"></div>

      <div className="d-flex align-items-center gap-5 position-relative" style={{ zIndex: 1, maxWidth: 1000, width: '100%', padding: 24 }}>
        
        {/* Left Panel: Info (Desktop only) */}
        <div className="d-none d-lg-block" style={{ flex: 1 }}>
          <div className="brand-logo mb-4" style={{ width: 64, height: 64, fontSize: 32 }}>🍽️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 16 }}>
            The Elite<br />Restaurant<br /><span style={{ color: 'var(--accent)' }}>Management Suite</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 32, maxWidth: 400 }}>
            Elevate your hospitality business with real-time analytics, seamless POS operations, and intelligent kitchen workflows.
          </p>
          <div className="row g-3">
            {[
              { icon: '🪑', text: 'Real-time Tables' },
              { icon: '🛒', text: 'Live POS' },
              { icon: '👨‍🍳', text: 'Kitchen Display' },
              { icon: '💳', text: 'Fast Billing' }
            ].map((f, i) => (
              <div key={i} className="col-6">
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span className="me-2">{f.icon}</span> {f.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auth Card */}
        <div className="auth-card card-custom" style={{ flex: '0 0 440px', padding: 40 }}>
          <div className="auth-header text-center mb-4">
            <h1 className="auth-title mb-1">Welcome Back</h1>
            <p className="auth-subtitle text-muted small">Sign in to your command center</p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs-custom mb-4">
            <button className={`tab-btn-custom ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`tab-btn-custom ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Create Account</button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="fade-in">
              <div className="mb-3">
                <label className="form-label-custom">Work Email</label>
                <input type="email" className="form-control-custom" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@restaurant.com" required />
              </div>
              <div className="mb-4">
                <label className="form-label-custom">Access Key</label>
                <input type="password" className="form-control-custom" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn-accent w-100 py-3" disabled={loading}>
                {loading ? 'Authenticating…' : 'Initialize Session'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="fade-in">
              <div className="mb-3">
                <label className="form-label-custom">Full Name</label>
                <input type="text" className="form-control-custom" value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" required />
              </div>
              <div className="mb-3">
                <label className="form-label-custom">Work Email</label>
                <input type="email" className="form-control-custom" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@restaurant.com" required />
              </div>
              <div className="mb-3">
                <label className="form-label-custom">Access Key</label>
                <input type="password" className="form-control-custom" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required />
              </div>
              <div className="mb-4">
                <label className="form-label-custom">Organizational Role</label>
                <select className="form-control-custom" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="Admin">System Administrator</option>
                  <option value="Manager">Floor Manager</option>
                  <option value="Staff">Service Staff</option>
                  <option value="Kitchen">Kitchen Executive</option>
                </select>
              </div>
              <button type="submit" className="btn-accent w-100 py-3" disabled={loading}>
                {loading ? 'Registering…' : 'Establish Account'}
              </button>
            </form>
          )}

          <div className="mt-4 pt-3 border-top border-secondary-subtle text-center">
            <p className="text-muted" style={{ fontSize: 11, letterSpacing: 0.5 }}>SECURE ENTERPRISE ENCRYPTION ACTIVE</p>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #05070A;
          position: relative;
          overflow: hidden;
        }
        .auth-bg-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0);
          background-size: 40px 40px;
        }
        .auth-bg-glow {
          position: absolute;
          width: 600px; height: 600px;
          background: var(--accent);
          filter: blur(150px);
          opacity: 0.1;
          top: -200px; right: -200px;
          border-radius: 50%;
        }
        .glow-2 { bottom: -200px; left: -200px; background: var(--info); }
        
        .auth-card {
          background: rgba(15, 18, 24, 0.6) !important;
          backdrop-filter: blur(30px) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        
        .auth-tabs-custom {
          display: flex;
          background: rgba(0,0,0,0.2);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .tab-btn-custom {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text-muted);
          padding: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: var(--transition);
          border-radius: 8px;
        }
        .tab-btn-custom.active {
          background: var(--accent);
          color: #000;
          box-shadow: 0 4px 15px var(--accent-glow);
        }
      `}</style>
    </div>
  );
}
