"use client";
import React, { useState, useEffect } from 'react';
import { Skate, Session } from '@/types';
import { SkateCard } from './SkateCard';
import { StartSessionModal } from './StartSessionModal';
import { v4 as uuidv4 } from 'uuid';
import { 
  getSkates, getSessions, saveSkate, saveSession, saveSyncOperation 
} from '@/lib/indexeddb';
import { syncPendingOperations } from '@/lib/sync';

export const TrainerDashboard: React.FC = () => {
  const [skates, setSkates] = useState<Skate[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSkate, setSelectedSkate] = useState<Skate | null>(null);
  
  // Temporary hardcoded price config, in production this is fetched from Firebase settings
  const priceConfig = { durationMinutes: 30, price: 150 };

  const loadLocalData = async () => {
    let localSkates = await getSkates();
    if (localSkates.length === 0) {
      // Initialize 16 skates locally if missing
      for (let i = 1; i <= 16; i++) {
        const newSkate: Skate = {
          id: `skate_${i}`,
          skateNumber: i,
          status: 'available',
          updatedAt: Date.now()
        };
        await saveSkate(newSkate);
        localSkates.push(newSkate);
      }
    }
    // sort by number
    localSkates.sort((a, b) => a.skateNumber - b.skateNumber);
    setSkates(localSkates);

    const localSessions = await getSessions();
    setSessions(localSessions);
  };

  useEffect(() => {
    loadLocalData();
    
    // Poll for updates if needed or setup a local event system
    const interval = setInterval(loadLocalData, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartClick = (skate: Skate) => {
    setSelectedSkate(skate);
  };

  const handleStartSession = async (skate: Skate, duration: number, price: number) => {
    const now = Date.now();
    const session: Session = {
      id: uuidv4(),
      skateId: skate.id,
      skateNumber: skate.skateNumber,
      startTime: now,
      endTime: now + duration * 60000,
      durationMinutes: duration,
      price: price,
      status: 'active',
      synced: false,
      createdAt: now,
      updatedAt: now
    };

    const updatedSkate = { ...skate, status: 'active' as const, updatedAt: now };

    // Save locally
    await saveSession(session);
    await saveSkate(updatedSkate);

    // Queue sync
    await saveSyncOperation({
      id: uuidv4(),
      operation: 'CREATE_SESSION',
      entityId: session.id,
      data: session,
      createdAt: now,
      attempts: 0,
      status: 'pending'
    });

    await saveSyncOperation({
      id: uuidv4(),
      operation: 'UPDATE_SKATE',
      entityId: skate.id,
      data: updatedSkate,
      createdAt: now,
      attempts: 0,
      status: 'pending'
    });

    setSelectedSkate(null);
    loadLocalData();
    syncPendingOperations();
  };

  const handleFinishSession = async (session: Session) => {
    const now = Date.now();
    const updatedSession = { ...session, status: 'completed' as const, completedAt: now, updatedAt: now };
    const skate = skates.find(s => s.id === session.skateId);
    if (!skate) return;
    const updatedSkate = { ...skate, status: 'available' as const, updatedAt: now };

    await saveSession(updatedSession);
    await saveSkate(updatedSkate);

    await saveSyncOperation({
      id: uuidv4(),
      operation: 'COMPLETE_SESSION',
      entityId: session.id,
      data: updatedSession,
      createdAt: now,
      attempts: 0,
      status: 'pending'
    });

    await saveSyncOperation({
      id: uuidv4(),
      operation: 'UPDATE_SKATE',
      entityId: skate.id,
      data: updatedSkate,
      createdAt: now,
      attempts: 0,
      status: 'pending'
    });

    loadLocalData();
    syncPendingOperations();
  };

  const handleCancelSession = async (session: Session) => {
    if (!confirm('Are you sure you want to stop this session early? It will NOT count as revenue.')) return;

    const now = Date.now();
    const updatedSession = { ...session, status: 'cancelled' as const, completedAt: now, updatedAt: now };
    const skate = skates.find(s => s.id === session.skateId);
    if (!skate) return;
    const updatedSkate = { ...skate, status: 'available' as const, updatedAt: now };

    await saveSession(updatedSession);
    await saveSkate(updatedSkate);

    await saveSyncOperation({
      id: uuidv4(),
      operation: 'COMPLETE_SESSION',
      entityId: session.id,
      data: updatedSession,
      createdAt: now,
      attempts: 0,
      status: 'pending'
    });
    
    await saveSyncOperation({
      id: uuidv4(),
      operation: 'UPDATE_SKATE',
      entityId: skate.id,
      data: updatedSkate,
      createdAt: now,
      attempts: 0,
      status: 'pending'
    });

    loadLocalData();
    syncPendingOperations();
  };

  const activeCount = skates.filter(s => s.status === 'active').length;
  const availableCount = skates.filter(s => s.status === 'available').length;

  return (
    <div className="container-fluid py-4 max-w-desktop">
      {/* Dashboard Summary */}
      <div className="row g-2 mb-4">
        <div className="col-6">
          <div className="bg-white rounded p-3 text-center shadow-sm border border-light">
            <h6 className="text-muted mb-1 fw-bold" style={{ fontSize: '0.8rem' }}>ACTIVE</h6>
            <h3 className="text-primary fw-bold m-0">{activeCount}</h3>
          </div>
        </div>
        <div className="col-6">
          <div className="bg-white rounded p-3 text-center shadow-sm border border-light">
            <h6 className="text-muted mb-1 fw-bold" style={{ fontSize: '0.8rem' }}>AVAILABLE</h6>
            <h3 className="text-success fw-bold m-0">{availableCount}</h3>
          </div>
        </div>
      </div>

      {/* Skate Grid */}
      <div className="row g-3">
        {skates.map(skate => {
          const activeSession = sessions.find(s => s.skateId === skate.id && s.status === 'active');
          return (
            <div key={skate.id} className="col-6 col-md-4 col-lg-3">
              <SkateCard 
                skate={skate}
                activeSession={activeSession}
                onStartClick={handleStartClick}
                onFinishSession={handleFinishSession}
                onCancelSession={handleCancelSession}
              />
            </div>
          );
        })}
      </div>
      
      <StartSessionModal 
        skate={selectedSkate}
        onCancel={() => setSelectedSkate(null)}
        onStart={handleStartSession}
        priceConfig={priceConfig}
      />
    </div>
  );
};
