export type SkateStatus = 'available' | 'active' | 'maintenance';

export interface Skate {
  id: string; // e.g. 'skate_1'
  skateNumber: number;
  status: SkateStatus;
  updatedAt: number;
}

export type SessionStatus = 'active' | 'completed' | 'cancelled' | 'paused';

export interface Session {
  id: string; // UUID generated locally
  skateId: string;
  skateNumber: number;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  price: number;
  status: SessionStatus;
  synced: boolean;
  completedAt?: number;
  pausedAt?: number | null;
  trainerId?: string;
  createdAt: number;
  updatedAt: number;
}

export type SyncOperationType = 'CREATE_SESSION' | 'COMPLETE_SESSION' | 'UPDATE_SESSION' | 'UPDATE_SKATE';

export interface SyncOperation {
  id: string; // UUID
  operation: SyncOperationType;
  entityId: string; // The ID of the session or skate
  data: any; // The payload to send to Firebase
  createdAt: number;
  attempts: number;
  status: 'pending' | 'processing' | 'failed';
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'trainer' | 'super_admin';
  createdAt: number;
}
