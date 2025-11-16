import { createContext, useContext, useState, useEffect } from 'react';
import { setupConnectivityListeners, replayPendingActions } from '../utils/queue.js';

const ConnectivityContext = createContext();

export const useConnectivity = () => {
  const context = useContext(ConnectivityContext);
  if (!context) {
    throw new Error('useConnectivity must be used within ConnectivityProvider');
  }
  return context;
};

export const ConnectivityProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      console.log('Connection restored - syncing offline changes...');
      
      // Replay pending actions when coming online (orders, etc.)
      try {
        await replayPendingActions();
        console.log('Offline changes synced successfully');
      } catch (error) {
        console.error('Error syncing offline changes:', error);
      }
      
      // Trigger a custom event for components to reload data
      window.dispatchEvent(new CustomEvent('online-sync-complete'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Offline mode activated');
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    setupConnectivityListeners(handleOnline, handleOffline);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ConnectivityContext.Provider value={{ isOnline }}>
      {children}
    </ConnectivityContext.Provider>
  );
};
