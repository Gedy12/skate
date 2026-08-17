"use client";
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'trainer') {
          router.push('/trainer');
        } else if (role === 'super_admin') {
          router.push('/admin');
        } else {
          setError('Unknown role.');
        }
      } else {
        setError('User record not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg min-vh-100 d-flex flex-column align-items-center justify-content-center position-relative py-3 overflow-hidden">
      {/* Decorative background splashes (approximated with CSS gradients if no images) */}
      <div className="position-absolute top-0 start-0 w-100 h-100 bg-white" style={{ zIndex: -2 }}></div>
      <div className="position-absolute" style={{ top: '10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(13,110,253,0.1) 0%, rgba(255,255,255,0) 70%)', zIndex: -1 }}></div>
      <div className="position-absolute" style={{ bottom: '10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(255,140,0,0.1) 0%, rgba(255,255,255,0) 70%)', zIndex: -1 }}></div>

      {/* Logo */}
      <div className="text-center mb-3 mt-2 px-3" style={{ maxWidth: '240px' }}>
        <img src="/icon.jpg" alt="Leeqaa Skate House" className="img-fluid drop-shadow-xl" style={{ filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.1))' }} />
      </div>

      {/* Login Card */}
      <div className="card shadow-lg border-0 rounded-4 mb-3" style={{ width: '90%', maxWidth: '400px', zIndex: 10 }}>
        <div className="card-body p-3 p-md-4">
          <div className="text-center mb-3">
            <p className="text-warning fw-bold mb-1" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
              <span className="text-muted opacity-50 me-2">—</span>
              WELCOME BACK!
              <span className="text-muted opacity-50 ms-2">—</span>
            </p>
            <h2 className="fw-black mb-0" style={{ letterSpacing: '-0.5px', fontSize: '1.8rem' }}>
              <span style={{ color: '#1a2a40' }}>SKATE </span>
              <span className="text-warning">HOUSE</span>
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>Login to continue to your account</p>
          </div>

          {error && <div className="alert alert-danger py-1 mb-2" style={{ fontSize: '0.8rem' }}>{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="mb-2">
              <label className="form-label fw-bold d-flex align-items-center gap-2 mb-1" style={{ color: '#1a2a40', fontSize: '0.85rem' }}>
                <i className="bi bi-envelope-fill text-primary"></i> Email
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0 text-primary border-primary border-opacity-25" style={{ borderRadius: '8px 0 0 8px' }}>
                  <i className="bi bi-envelope-fill"></i>
                </span>
                <input 
                  type="email" 
                  className="form-control border-start-0 border-primary border-opacity-25 py-2" 
                  style={{ borderRadius: '0 8px 8px 0', boxShadow: 'none', backgroundColor: '#f8f9fa' }}
                  placeholder="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label fw-bold d-flex align-items-center gap-2 mb-1" style={{ color: '#1a2a40', fontSize: '0.85rem' }}>
                <i className="bi bi-lock-fill text-primary"></i> Password
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0 border-primary border-opacity-25" style={{ borderRadius: '8px 0 0 8px' }}>
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="form-control border-start-0 border-end-0 border-primary border-opacity-25 py-2" 
                  style={{ boxShadow: 'none', backgroundColor: '#f8f9fa' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <span 
                  className="input-group-text bg-white border-start-0 border-primary border-opacity-25 text-muted" 
                  style={{ borderRadius: '0 8px 8px 0', cursor: 'pointer' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </span>
              </div>
            </div>

            <div className="text-end mb-3">
              <a href="#" className="text-decoration-none" style={{ fontSize: '0.75rem', color: '#0d6efd' }}>Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100 fw-bold border-0 py-2"
              disabled={loading}
              style={{ 
                borderRadius: '8px',
                background: 'linear-gradient(90deg, #0d6efd 0%, #0098ff 100%)',
                boxShadow: '0 4px 10px rgba(13, 110, 253, 0.3)'
              }}
            >
              {loading ? (
                <div className="spinner-border spinner-border-sm text-white" role="status"></div>
              ) : (
                <div className="d-flex align-items-center justify-content-center gap-2" style={{ letterSpacing: '0.5px' }}>
                  <i className="bi bi-unlock-fill"></i> LOGIN
                </div>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Features */}
      <div className="container px-3 mt-1">
        <div className="row text-center g-2">
          <div className="col-3">
            <div className="text-primary mb-1">
              <i className="bi bi-shield-check" style={{ fontSize: '1.2rem' }}></i>
            </div>
            <h6 className="fw-bold mb-0" style={{ fontSize: '0.55rem', color: '#1a2a40' }}>SAFE & SECURE</h6>
          </div>
          <div className="col-3">
            <div className="text-warning mb-1">
              <i className="bi bi-lightning-charge" style={{ fontSize: '1.2rem' }}></i>
            </div>
            <h6 className="fw-bold mb-0" style={{ fontSize: '0.55rem', color: '#1a2a40' }}>FAST & EASY</h6>
          </div>
          <div className="col-3">
            <div className="text-primary mb-1">
              <i className="bi bi-people" style={{ fontSize: '1.2rem' }}></i>
            </div>
            <h6 className="fw-bold mb-0" style={{ fontSize: '0.55rem', color: '#1a2a40' }}>COMMUNITY</h6>
          </div>
          <div className="col-3">
            <div className="text-warning mb-1">
              <i className="bi bi-trophy" style={{ fontSize: '1.2rem' }}></i>
            </div>
            <h6 className="fw-bold mb-0" style={{ fontSize: '0.55rem', color: '#1a2a40' }}>ACHIEVE MORE</h6>
          </div>
        </div>
      </div>
    </div>
  );
}
