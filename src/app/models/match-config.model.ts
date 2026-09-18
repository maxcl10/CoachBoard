import { Player } from './player.model';

export interface MatchConfig {
  team: string;
  opponent: string;
  venue?: string;
  home: boolean;
  matchType: string;
  date: string;
  formation: string;
  players: Player[];
}
