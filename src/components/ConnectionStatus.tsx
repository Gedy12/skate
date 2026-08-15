"use client";
import React, { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getSyncQueue } from '@/lib/indexeddb';
import { syncPendingOperations } from '@/lib/sync';

export const ConnectionStatus: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Poll sync queue to show status
    const interval = setInterval(async () => {
      const queue = await getSyncQueue();
      setPendingCount(queue.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncNow = async () => {
    if (isOnline) {
      setIsSyncing(true);
      await syncPendingOperations();
      setIsSyncing(false);
      const queue = await getSyncQueue();
      setPendingCount(queue.length);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-between p-3 py-2 bg-white border-bottom shadow-sm">
      <div className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
        <div className={`status-dot ${isOnline ? 'available' : 'finished'}`}></div>
        {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
      </div>
      
      <div className="d-flex align-items-center gap-2">
        {pendingCount > 0 && isOnline && !isSyncing && (
          <button 
            className="btn btn-sm btn-light fw-bold border text-primary rounded-pill d-flex align-items-center gap-1"
            onClick={handleSyncNow}
            style={{ fontSize: '0.75rem' }}
          >
            <i className="bi bi-arrow-repeat"></i> Sync ({pendingCount})
          </button>
        )}
        {pendingCount > 0 && (!isOnline) && (
          <span className="text-muted fw-bold" style={{ fontSize: '0.75rem' }}>{pendingCount} pending</span>
        )}
        {isSyncing && (
          <div className="status-pill syncing">
            <i className="bi bi-arrow-repeat spin"></i> SYNCING...
          </div>
        )}
        {pendingCount === 0 && isOnline && (
          <div className="status-pill online bg-white border">
            <i className="bi bi-check-circle-fill text-success"></i> SYNCED
          </div>
        )}
      </div>
    </div>
  );
};
