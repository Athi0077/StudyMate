import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

const ReloadPrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 max-w-sm flex items-start gap-4 animate-in slide-in-from-bottom-5">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">Update Available</h3>
        <p className="text-sm text-gray-600 mt-1">A new version of Homework is available. Reload to update.</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => updateServiceWorker(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw size={16} />
            Reload
          </button>
          <button
            onClick={close}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      <button onClick={close} className="text-gray-400 hover:text-gray-600">
        <X size={20} />
      </button>
    </div>
  );
};

export default ReloadPrompt;
