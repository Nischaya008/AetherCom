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
    const handleOnline = () => {
      setIsOnline(true);
      // Replay pending actions when coming online
      replayPendingActions().catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

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

