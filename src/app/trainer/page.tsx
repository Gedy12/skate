"use client";
import React from 'react';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { TrainerDashboard } from '@/components/TrainerDashboard';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function TrainerPage() {
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  return (
    <div className="d-flex flex-column vh-100 bg-light">
      <header className="text-white p-3 d-flex justify-content-between align-items-center shadow-sm" style={{ backgroundColor: 'var(--dark)' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="bg-white rounded overflow-hidden d-flex justify-content-center align-items-center" style={{ width: '36px', height: '36px' }}>
            <img src="/icon.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h5 className="mb-0 fw-bold" style={{ letterSpacing: '-0.5px' }}>LEEQAA SKATE HOUSE</h5>
            <small className="text-light opacity-75" style={{ fontSize: '0.75rem' }}>Trainer Dashboard</small>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-dark btn-sm border-secondary d-flex align-items-center gap-2 rounded-pill px-3">
          <i className="bi bi-box-arrow-right"></i>
          <span className="d-none d-sm-inline">Logout</span>
        </button>
      </header>
      
      <ConnectionStatus />
      
      <main className="flex-grow-1 overflow-auto">
        <TrainerDashboard />
      </main>
    </div>
  );
}
