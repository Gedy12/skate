import { getSyncQueue, removeSyncOperation, saveSyncOperation, initDB, getSession } from './indexeddb';
import { db } from './firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

let isSyncing = false;

export const syncPendingOperations = async () => {
  if (isSyncing || typeof window === 'undefined' || !navigator.onLine) {
    return;
  }
  
  isSyncing = true;
  console.log('Starting sync process...');

  try {
    const queue = await getSyncQueue();
    // Sort by createdAt to process in order
    queue.sort((a, b) => a.createdAt - b.createdAt);

    for (const op of queue) {
      if (op.status === 'processing') continue;

      try {
        // Mark as processing locally
        op.status = 'processing';
        op.attempts += 1;
        await saveSyncOperation(op);

        if (op.operation === 'CREATE_SESSION' || op.operation === 'COMPLETE_SESSION') {
          // Idempotent write using the local UUID
          const sessionRef = doc(db, 'sessions', op.entityId);
          await setDoc(sessionRef, op.data, { merge: true });
          
          // Mark local session as synced
          const idb = await initDB();
          if (idb) {
            const localSession = await getSession(op.entityId);
            if (localSession) {
               localSession.synced = true;
               await idb.put('sessions', localSession);
            }
          }
        } else if (op.operation === 'UPDATE_SKATE') {
          const skateRef = doc(db, 'skates', op.entityId);
          await setDoc(skateRef, op.data, { merge: true });
        }

        // Remove operation on success
        await removeSyncOperation(op.id);
        console.log(`Successfully synced operation: ${op.id}`);
      } catch (error) {
        console.error(`Failed to sync operation ${op.id}:`, error);
        op.status = 'pending';
        await saveSyncOperation(op);
        // If it's a network error, we probably want to stop the whole sync loop for now
        break; 
      }
    }
  } catch (error) {
    console.error('Error in sync pending operations:', error);
  } finally {
    isSyncing = false;
  }
};

export const startSyncListener = () => {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('online', () => {
    console.log('App is online. Triggering sync...');
    syncPendingOperations();
  });

  // Optional: Periodic sync while online
  setInterval(() => {
     if (navigator.onLine) {
       syncPendingOperations();
     }
  }, 1000 * 60 * 2); // Every 2 minutes
};
