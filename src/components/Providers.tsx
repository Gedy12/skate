"use client";
import { useEffect } from 'react';
import { startSyncListener } from '@/lib/sync';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    startSyncListener();
  }, []);

  return <>{children}</>;
}
