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
        bottom: '20px',
        left: '20px',
        backgroundColor: '#f44336',
        color: 'white',
        padding: '14px 20px',
        borderRadius: '8px',
        zIndex: 10000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '400px',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <span style={{ fontSize: '18px' }}>📡</span>
      <div>
        <strong style={{ display: 'block', marginBottom: '2px', fontSize: '14px' }}>
          Offline Mode
        </strong>
        <span style={{ fontSize: '12px', opacity: 0.9 }}>
          Changes will be synced when connection is restored.
        </span>
      </div>
    </div>
  );
};

