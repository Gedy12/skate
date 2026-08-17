"use client";
import React, { useState, useEffect } from 'react';
import { Skate, Session } from '@/types';
import { Timer } from './Timer';

interface SkateCardProps {
  skate: Skate;
  activeSession?: Session;
  onStartClick: (skate: Skate) => void;
  onFinishSession: (session: Session) => void;
  onCancelSession: (session: Session) => void;
  onPauseSession?: (session: Session) => void;
  onResumeSession?: (session: Session) => void;
}

export const SkateCard: React.FC<SkateCardProps> = ({ 
  skate, 
  activeSession, 
  onStartClick, 
  onFinishSession, 
  onCancelSession,
  onPauseSession,
  onResumeSession
}) => {
  const isAvailable = skate.status === 'available';
  const isMaintenance = skate.status === 'maintenance';
  
  // Default to available styling
  let statusClass = 'status-available';
  let dotClass = 'available';
  let statusText = 'AVAILABLE';
  let textClass = 'text-success';
  
  if (isMaintenance) {
    statusClass = 'status-maintenance';
    dotClass = 'bg-warning';
    statusText = 'MAINTENANCE';
    textClass = 'text-warning';
  } else if (activeSession) {
    statusClass = 'status-active';
    dotClass = 'active';
    statusText = 'ACTIVE';
    textClass = 'text-primary';
    
    if (activeSession.status === 'paused') {
      statusClass = 'status-paused';
      dotClass = 'bg-warning';
      statusText = 'PAUSED';
      textClass = 'text-warning';
    } else {
      // Check if session is finished (0:00 left)
      const timeRemaining = Math.max(0, activeSession.endTime - Date.now());
      if (timeRemaining <= 0) {
        statusClass = 'status-finished';
        dotClass = 'finished';
        statusText = 'FINISHED';
        textClass = 'text-danger';
      }
    }
  }

  // Format skate number with leading zero
  const formattedNumber = skate.skateNumber.toString().padStart(2, '0');

  return (
    <div className={`modern-card ${statusClass} h-100 d-flex flex-column`} style={activeSession?.status === 'paused' ? { border: '2px dashed #ffc107', opacity: 0.9 } : undefined}>
      <div className="p-3 pb-2 d-flex justify-content-between align-items-start">
        <div>
          <h2 className="fw-bold m-0" style={{ letterSpacing: '-1px' }}>{formattedNumber}</h2>
          <small className="text-muted fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>SKATE</small>
        </div>
        <div className="d-flex align-items-center gap-1">
          <div className={`status-dot ${dotClass}`}></div>
          <small className={`${textClass} fw-bold`} style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
            {statusText}
          </small>
        </div>
      </div>
      
      <div className="card-body p-3 pt-0 d-flex flex-column justify-content-end">
        {isAvailable && (
          <button 
            className="btn btn-outline-success btn-sm w-100 fw-bold rounded-pill shadow-sm d-flex justify-content-center align-items-center gap-2 mt-auto py-2"
            onClick={() => onStartClick(skate)}
          >
            <i className="bi bi-play-fill fs-5" style={{ lineHeight: 0 }}></i>
            Start Session
          </button>
        )}

        {isMaintenance && (
          <div className="text-center mt-auto pb-2">
            <i className="bi bi-tools text-warning fs-4 mb-2 d-block"></i>
            <small className="text-muted d-block lh-sm" style={{ fontSize: '0.75rem' }}>Currently unavailable</small>
          </div>
        )}

        {activeSession && (
          <div className="mt-auto">
            <Timer 
              session={activeSession} 
              onFinish={onFinishSession}
              onCancel={onCancelSession}
              onPause={onPauseSession}
              onResume={onResumeSession}
            />
          </div>
        )}
      </div>
    </div>
  );
};
