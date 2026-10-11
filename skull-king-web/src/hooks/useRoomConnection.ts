import { useEffect, useState } from 'react';
import { API_URL, client } from '../client';
export function useRoomConnection(gameId: string) {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!gameId) return;
    const url = new URL(API_URL, location.href);
    url.pathname = `/events/${encodeURIComponent(gameId)}`;
    const stream = new EventSource(url, { withCredentials: true });
    let refresh: ReturnType<typeof setTimeout> | undefined;
    stream.onopen = () => setConnected(true);
    stream.onerror = () => setConnected(false);
    stream.onmessage = () => {
      clearTimeout(refresh);
      refresh = setTimeout(() => void client.refetchQueries({ include: 'active' }).catch(() => undefined), 100);
    };
    return () => { clearTimeout(refresh); stream.close(); setConnected(false); };
  }, [gameId]);
  return connected;
}
