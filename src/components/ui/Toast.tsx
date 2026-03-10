"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Toast = { id: number; message: string };

type ToastContextValue = {
  addToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4000;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { addToast: () => {} };
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const addToast = useCallback((message: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message }]);
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      timeoutsRef.current.delete(id);
    }, TOAST_DURATION_MS);
    timeoutsRef.current.set(id, t);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastViewport toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="rounded-lg border border-green-200 bg-white px-4 py-3 text-sm font-medium text-green-800 shadow-lg dark:border-green-800 dark:bg-neutral-900 dark:text-green-200"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
