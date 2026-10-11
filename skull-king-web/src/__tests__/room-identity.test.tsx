/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Link } from 'react-router-dom';
import { PlayerTokenProvider, usePlayerToken } from '../hooks/PlayerTokenContext';
function Seat() {
  const [token] = usePlayerToken();
  return <><output>{token ?? 'spectator'}</output><Link to="/game/second">Switch room</Link></>;
}
test('room navigation selects the new room credential without carrying a previous seat', () => {
  localStorage.setItem('skullKing', JSON.stringify({ first: 'first-secret', second: 'second-secret' }));
  render(<MemoryRouter initialEntries={['/game/first']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Routes><Route path="/game/:id" element={<PlayerTokenProvider><Seat /></PlayerTokenProvider>} /></Routes></MemoryRouter>);
  expect(screen.getByRole('status').textContent).toBe('first-secret');
  fireEvent.click(screen.getByText('Switch room'));
  expect(screen.getByRole('status').textContent).toBe('second-secret');
});
