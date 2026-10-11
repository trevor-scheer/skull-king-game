import { useCallback, useEffect, useState } from 'react';
export function useLocalStorage<T>(key: string, initialValue: T) {
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(key) ?? 'null');
      return value !== null && typeof value === typeof initialValue ? value as T : initialValue;
    } catch { return initialValue; }
  };
  const [storedValue, setStoredValue] = useState<T>(read);
  useEffect(() => {
    const onStorage = (event:StorageEvent) => { if (event.key === key || event.key === null) setStoredValue(read()); };
    window.addEventListener('storage',onStorage);
    return () => window.removeEventListener('storage',onStorage);
  },[key]);
  const setValue = useCallback((value:T) => {
    setStoredValue(value);
    try { localStorage.setItem(key,JSON.stringify(value)); } catch { /* Keep the seat available for this tab when storage is full. */ }
  },[key]);
  return [storedValue,setValue] as const;
}
