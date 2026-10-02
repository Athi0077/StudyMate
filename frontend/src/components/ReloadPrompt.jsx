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
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 bg-black/50 sm:bg-transparent z-[9999] flex items-center justify-center sm:block p-4 sm:p-0 backdrop-blur-sm sm:backdrop-blur-none transition-all">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 p-5 flex items-start gap-4 animate-in fade-in zoom-in-95 duration-200 m-auto">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Update Available</h3>
          <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">A new version of StudyMate is available. Reload to update.</p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-soft"
            >
              <RefreshCw size={16} />
              Reload
            </button>
            <button
              onClick={close}
              className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
        <button onClick={close} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ReloadPrompt;
