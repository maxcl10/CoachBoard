import {
  Component,
  ViewEncapsulation,
} from '@angular/core';

interface Player {
  numero: number;
  nom: string;
  poste: string;
  capitaine?: boolean;
}

interface MatchConfig {
  equipe: string;
  adversaire: string;
  lieu?: string;
  domicile: boolean;
  typeMatch: string;
  date: string;
  formation: string;
  joueurs: Player[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None,
})
export class App {
  protected config: MatchConfig = {
    equipe: 'EJPS 2 U14',
    adversaire: 'Alsasud',
    lieu: 'Stade Municipal',
    domicile: false,
    typeMatch: 'Championnat J1',
    date: '2026-09-12',
    formation: '4-3-3',
    joueurs: [
      { numero: 1, nom: 'Benjamin M.', poste: 'GB' },
      { numero: 2, nom: 'Daniel T.', poste: 'DG' },
      { numero: 3, nom: 'Alexandre B.', poste: 'DD' },
      { numero: 4, nom: 'Simeon H.', poste: 'DCD' },
      { numero: 6, nom: 'Louën F.', poste: 'MDC' },
      { numero: 7, nom: 'Matthew M.', poste: 'AD' },
      { numero: 8, nom: 'Hugo K.', poste: 'MCG' },
      { numero: 9, nom: 'Cays L.', poste: 'R3' },
      { numero: 10, nom: 'Yamin G.', poste: 'AG' },
      { numero: 11, nom: 'Matteo S.', poste: 'AC' },
      { numero: 12, nom: 'Djelle G.', poste: 'R2' },
      { numero: 18, nom: 'Samuel H.', poste: 'DCG' },
      { numero: 19, nom: 'Mathéo V.', poste: 'MCD' },
      { numero: 20, nom: 'Leo O.', poste: 'R1' },
    ],
  };

  protected readonly positionMap: Record<string, [number, number]> = {
    GB: [7, 50],
    GK: [7, 50],
    DG: [30, 12],
    DCG: [25, 36],
    DC: [25, 50],
    DCD: [25, 64],
    DD: [30, 87],
    MDC: [45, 50],
    MCG: [55, 30],
    MC: [48, 50],
    MCD: [55, 70],
    MOC: [62, 50],
    AG: [70, 12],
    BU: [82, 50],
    AC: [82, 50],
    AD: [70, 87],
    ATT: [82, 50],
  };

  protected get starters(): Player[] {
    return this.config.joueurs.filter((player) => !this.isSubstitute(player));
  }

  protected get substitutes(): Player[] {
    return this.config.joueurs
      .filter((player) => this.isSubstitute(player))
      .sort(
        (a, b) =>
          Number(a.poste.slice(1)) - Number(b.poste.slice(1)),
      );
  }

  protected get homeTeam(): string {
    return this.config.domicile ? this.config.equipe : this.config.adversaire;
  }

  protected get awayTeam(): string {
    return this.config.domicile ? this.config.adversaire : this.config.equipe;
  }

  protected formatDate(value: string): string {
    if (!value) return '—';
    const date = new Date(value + (value.length === 10 ? 'T12:00:00' : ''));
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  protected positionFor(player: Player, index: number): {
    left: string;
    top: string;
  } | null {
    const position = this.positionMap[player.poste.toUpperCase()];
    if (!position) return null;

    const previousPlayers = this.starters
      .slice(0, index)
      .filter((item) => item.poste.toUpperCase() === player.poste.toUpperCase())
      .length;
    const offset = previousPlayers === 0 ? 0 : previousPlayers % 2 === 1 ? 9 : -9;
    const top = Math.max(8, Math.min(92, position[1] + offset));
    return { left: `${position[0]}%`, top: `${top}%` };
  }

  protected isSubstitute(player: Player): boolean {
    return /^R\d+$/i.test((player.poste || '').trim());
  }

  protected onConfigFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.config = JSON.parse(String(reader.result)) as MatchConfig;
      } catch {
        window.alert('Le fichier JSON est invalide.');
      }
      input.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  }

  protected printPage(): void {
    window.print();
  }
}
