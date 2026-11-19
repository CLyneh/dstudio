import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ToastKind = 'info' | 'error';
type ShowToast = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<ShowToast>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback<ShowToast>((message, kind = 'info') => {
    setToast({ message, kind });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), kind === 'error' ? 6000 : 3000);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite">
        {toast && <div className={`toast ${toast.kind === 'error' ? 'error' : ''}`}>{toast.message}</div>}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ShowToast {
  return useContext(ToastContext);
}
