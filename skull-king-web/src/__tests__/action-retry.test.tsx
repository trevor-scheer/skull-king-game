/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BidForm } from '../pages/Game/InGame/BidForm/BidForm';
import { Hand } from '../pages/Game/InGame/Hand/Hand';
const failedRequest = () => ({ then: (_resolve:unknown, reject?: (e:Error)=>void) => reject?.(new Error('Connection interrupted')) });
jest.mock('../hooks/PlayerTokenContext', () => ({ usePlayerToken: () => ['seat'] }));
jest.mock('../hooks/useGameId', () => ({ useGameId: () => 'room' }));
jest.mock('../types/graphqlTypes', () => ({
  useSubmitBidMutation: () => [failedRequest],
  usePlayColoredCardMutation: () => [failedRequest],
  usePlaySpecialCardMutation: () => [failedRequest],
  useRoundNumberQuery: () => ({ data:{state:{currentRound:{roundNumber:1, cardsPerPlayer:1}}} }),
  useMyHandQuery: () => ({data:{state:{legalCardIds:['yellow-1'],me:{name:'Anne', hand:[{__typename:'ColoredCard',id:'yellow-1',color:'YELLOW',number:1}]},currentRound:{phase:'play',playerTurn:'Anne',trickColor:null}}}}),
}));
test('a failed bid can be retried without losing the hand', async () => {
  render(<BidForm />);
  fireEvent.click(screen.getByRole('button',{name:'1'}));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Connection interrupted/));
  expect((screen.getByRole('button',{name:'1'}) as HTMLButtonElement).disabled).toBe(false);
});
test('a failed card play releases the click lock and explains the error', async () => {
  render(<Hand />);
  fireEvent.click(screen.getByRole('button',{name:'YELLOW 1'}));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Connection interrupted/));
  expect((screen.getByRole('button',{name:'YELLOW 1'}) as HTMLButtonElement).disabled).toBe(false);
});
