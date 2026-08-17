"use client";
import React from 'react';
import { useTimer } from '@/hooks/useTimer';
import { Session } from '@/types';

interface TimerProps {
  session: Session;
  onFinish?: (session: Session) => void;
  onCancel?: (session: Session) => void;
  onPause?: (session: Session) => void;
  onResume?: (session: Session) => void;
}

export const Timer: React.FC<TimerProps> = ({ session, onFinish, onCancel, onPause, onResume }) => {
  const { formattedTime, isFinished, remainingTime } = useTimer(session.startTime, session.endTime, session.pausedAt);

  // Time remaining in minutes for color logic
  const minutesRemaining = remainingTime / 60000;
  
  let timerColor = 'text-primary';
  if (isFinished) {
    timerColor = 'text-danger';
  } else if (session.status === 'paused') {
    timerColor = 'text-warning';
  } else if (minutesRemaining <= 5) {
    timerColor = 'text-danger';
  } else if (minutesRemaining <= 10) {
    timerColor = 'text-warning';
  }

  if (isFinished) {
    return (
      <div className="text-center mt-2 pb-2">
        <div className={`display-5 fw-bold font-monospace-timer ${timerColor} lh-1 mb-3`}>
          {formattedTime}
        </div>
        <button 
          className="btn btn-danger btn-sm w-100 fw-bold rounded-pill shadow-sm d-flex justify-content-center align-items-center gap-2"
          onClick={() => onFinish?.(session)}
        >
          <i className="bi bi-stop-circle-fill fs-5" style={{ lineHeight: 0 }}></i>
          Finish Session
        </button>
      </div>
    );
  }

  const isPaused = session.status === 'paused';

  return (
    <div className="text-center mt-2 pb-2">
      <div className={`display-5 fw-bold font-monospace-timer ${timerColor} lh-1 mb-2`}>
        {formattedTime}
      </div>
      <small className="text-muted d-block mb-3 fw-bold" style={{ fontSize: '0.7rem' }}>
        {isPaused ? 'PAUSED' : 'REMAINING'}
      </small>
      <div className="d-flex gap-2">
        {isPaused ? (
          <button 
            className="btn btn-warning btn-sm flex-grow-1 fw-bold rounded-pill d-flex justify-content-center align-items-center gap-1 text-white"
            onClick={() => onResume?.(session)}
          >
            <i className="bi bi-play-fill fs-5" style={{ lineHeight: 0 }}></i>
            Resume
          </button>
        ) : (
          <button 
            className="btn btn-outline-warning btn-sm flex-grow-1 fw-bold rounded-pill d-flex justify-content-center align-items-center gap-1"
            onClick={() => onPause?.(session)}
          >
            <i className="bi bi-pause-fill fs-5" style={{ lineHeight: 0 }}></i>
            Pause
          </button>
        )}
        <button 
          className="btn btn-outline-danger btn-sm flex-grow-1 fw-bold rounded-pill d-flex justify-content-center align-items-center gap-1"
          onClick={() => onCancel?.(session)}
        >
          <i className="bi bi-x-circle fs-5" style={{ lineHeight: 0 }}></i>
          Stop
        </button>
      </div>
    </div>
  );
};
