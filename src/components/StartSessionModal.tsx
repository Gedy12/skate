"use client";
import React from 'react';
import { Skate } from '@/types';

interface StartSessionModalProps {
  skate: Skate | null;
  onCancel: () => void;
  onStart: (skate: Skate, duration: number, price: number) => void;
  priceConfig: { durationMinutes: number; price: number };
}

export const StartSessionModal: React.FC<StartSessionModalProps> = ({ 
  skate, 
  onCancel, 
  onStart, 
  priceConfig 
}) => {
  if (!skate) return null;
  const formattedNumber = skate.skateNumber.toString().padStart(2, '0');

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
      <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div className="p-4 text-center border-bottom bg-light">
              <div className="d-flex justify-content-center mb-2">
                <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-play-fill fs-3"></i>
                </div>
              </div>
              <h5 className="fw-bold mb-1">Start Skate #{formattedNumber}</h5>
              <p className="text-muted small mb-0">Confirm session details</p>
            </div>
            
            <div className="modal-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-clock text-muted"></i>
                  <span className="text-muted fw-bold">Duration</span>
                </div>
                <span className="fw-bold fs-5">{priceConfig.durationMinutes} min</span>
              </div>
            </div>
            
            <div className="modal-footer p-3 border-top-0 bg-light d-flex gap-2">
              <button 
                type="button" 
                className="btn btn-light flex-grow-1 border fw-bold rounded-pill" 
                onClick={onCancel}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-success flex-grow-1 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2 shadow-sm"
                onClick={() => onStart(skate, priceConfig.durationMinutes, priceConfig.price)}
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
