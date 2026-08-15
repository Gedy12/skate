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
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow-sm border-0" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body p-4">
          <h2 className="text-center fw-bold mb-4">SKATE HOUSE</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label text-muted fw-bold">Email</label>
              <input 
                type="email" 
                className="form-control form-control-lg" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted fw-bold">Password</label>
              <input 
                type="password" 
                className="form-control form-control-lg" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary btn-lg w-100 fw-bold"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
