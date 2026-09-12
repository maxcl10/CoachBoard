import { Component, ViewEncapsulation, computed, signal } from '@angular/core';
import { MatchConfig } from './models/match-config.model';
import { Player } from './models/player.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None,
})
export class App {
  protected readonly config = signal<MatchConfig>({
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
      { numero: 19, nom: 'Mathéo V.', poste: 'MCD', capitaine: true },
      { numero: 20, nom: 'Leo O.', poste: 'R1' },
    ],
  });

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

  protected readonly starters = computed(() =>
    this.config().joueurs.filter((player) => !this.isSubstitute(player)),
  );

  protected readonly substitutes = computed(() =>
    this.config()
      .joueurs.filter((player) => this.isSubstitute(player))
      .sort((a, b) => Number(a.poste.slice(1)) - Number(b.poste.slice(1))),
  );

  protected readonly homeTeam = computed(() =>
    this.config().domicile ? this.config().equipe : this.config().adversaire,
  );

  protected readonly awayTeam = computed(() =>
    this.config().domicile ? this.config().adversaire : this.config().equipe,
  );

  /** Formats an ISO date for display in French. */
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

  /** Returns the pitch coordinates for a starter, offsetting duplicate positions. */
  protected positionFor(
    player: Player,
    index: number,
  ): {
    left: string;
    top: string;
  } | null {
    const position = this.positionMap[player.poste.toUpperCase()];
    if (!position) return null;

    const previousPlayers = this.starters()
      .slice(0, index)
      .filter((item) => item.poste.toUpperCase() === player.poste.toUpperCase()).length;
    const offset = previousPlayers === 0 ? 0 : previousPlayers % 2 === 1 ? 9 : -9;
    const top = Math.max(8, Math.min(92, position[1] + offset));
    return { left: `${position[0]}%`, top: `${top}%` };
  }

  /** Identifies substitute positions such as R1, R2, and R3. */
  protected isSubstitute(player: Player): boolean {
    return /^R\d+$/i.test((player.poste || '').trim());
  }

  /** Reads and applies a match configuration selected by the user. */
  protected onConfigFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.config.set(JSON.parse(String(reader.result)) as MatchConfig);
      } catch {
        window.alert('Le fichier JSON est invalide.');
      }
      input.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  }

  /** Opens the browser print dialog for the match sheet. */
  protected printPage(): void {
    window.print();
  }
}
