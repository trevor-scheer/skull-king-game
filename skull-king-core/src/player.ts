import { Card } from "./cards";

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isAutomated?: boolean;
}
