import { Player } from './player.model';

export interface MatchConfig {
  equipe: string;
  adversaire: string;
  lieu?: string;
  domicile: boolean;
  typeMatch: string;
  date: string;
  formation: string;
  joueurs: Player[];
}
