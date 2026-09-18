export interface Player {
  playerId: number;
  numero: number;
  poste: string;
  capitaine?: boolean;
  /** Legacy field accepted only while importing old configuration files. */
  nom?: string;
}
