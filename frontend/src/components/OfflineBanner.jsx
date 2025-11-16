import { useConnectivity } from '../contexts/ConnectivityContext.jsx';

export const OfflineBanner = () => {
  const { isOnline } = useConnectivity();

  if (isOnline) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f44336',
        color: 'white',
        padding: '12px',
        textAlign: 'center',
        zIndex: 10000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      <strong>Offline Mode:</strong> You are currently offline. Changes will be synced when connection is restored.
    </div>
  );
};

