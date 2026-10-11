import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { API_URL } from '../../client';

export type Account = { id: string; username: string };
export function accountUrl(path: string) {
  return new URL(`/api/account/${path}`, new URL(API_URL, window.location.origin)).toString();
}
export async function accountRequest<T>(path: string, body?: unknown, csrf?: string): Promise<T> {
  const response = await fetch(accountUrl(path), {
    credentials: 'include', method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-SK-CSRF': csrf ?? '' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Please try again.');
  return data;
}
const AccountContext = createContext<{ account: Account | null; csrf: string; loading: boolean; error: string; refresh: () => Promise<void> }>({ account: null, csrf: '', loading: true, error: '', refresh: async () => {} });
export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [csrf, setCsrf] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const session = await accountRequest<{ account: Account | null; csrf: string }>('session');
      setAccount(session.account); setCsrf(session.csrf); setError('');
    } catch { setError('Account service is unavailable. You can still play as a guest.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return <AccountContext.Provider value={{ account, csrf, loading, error, refresh }}>{children}</AccountContext.Provider>;
}
export const useAccount = () => useContext(AccountContext);
