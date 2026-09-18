import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { DatePipe, TitleCasePipe, registerLocaleData } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import localeFr from '@angular/common/locales/fr';
import { MatchConfig } from './models/match-config.model';
import { Player } from './models/player.model';
import { PlayersService } from './services/players.service';

registerLocaleData(localeFr, 'fr-FR');

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None,
  imports: [DatePipe, TitleCasePipe],
})
export class App {
  private readonly playersService = inject(PlayersService);
  protected readonly players = rxResource({
    stream: () => this.playersService.getPlayers(),
  });
  protected readonly selectedPlayerId = signal<number | null>(null);
  protected readonly draggingPlayerNumero = signal<number | null>(null);

  protected readonly config = signal<MatchConfig>({
    equipe: 'EJPS 2 U14 (1er)',
    adversaire: 'Saint-Louis Neuweg (2e)',
    lieu: 'Stade de l\'Au',
    domicile: false,
    typeMatch: 'Championnat U14 D1  J2',
    date: '2026-09-19',
    formation: '4-3-3',
    joueurs: [
      { numero: 1, nom: 'Benjamin M.', poste: 'GB' },
      { numero: 5, nom: 'Matthew M.', poste: 'DG' },
      { numero: 2, nom: 'Samuel H.', poste: 'DCG' },
      { numero: 4, nom: 'Simeon H.', poste: 'DCD' },
      { numero: 3, nom: 'Alexandre B.', poste: 'DD' },
      { numero: 6, nom: 'Louën F.', poste: 'MDC' },
      { numero: 8, nom: 'Hugo K.', poste: 'MCG', capitaine: true },
      { numero: 19, nom: 'Leo O.', poste: 'MCD' },
      { numero: 10, nom: 'Yamin G.', poste: 'AG' },
      { numero: 18, nom: 'Djelle G.', poste: 'AD' },
      { numero: 11, nom: 'Matteo S.', poste: 'AC' },
      { numero: 20, nom: 'Daniel T.', poste: 'R1' },
      { numero: 12, nom: 'Elie K.', poste: 'R2' },
      { numero: 9, nom: 'Cays L.', poste: 'R3' },
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
  protected readonly pitchPositions = [
    'GB', 'DG', 'DCG', 'DCD', 'DD', 'MDC', 'MCG', 'MCD', 'MOC', 'AG', 'AC', 'AD',
  ];

  protected readonly starters = computed(() =>
    this.config().joueurs.filter((player) => !this.isSubstitute(player)),
  );

  protected readonly substitutes = computed(() =>
    this.config()
      .joueurs.filter((player) => this.isSubstitute(player))
      .sort((a, b) => Number(a.poste.slice(1)) - Number(b.poste.slice(1))),
  );

  protected readonly playersAvailableToAdd = computed(() => {
    const currentNames = new Set(this.config().joueurs.map((player) => player.nom));
    return (this.players.value() ?? []).filter((player) => !currentNames.has(player.nom));
  });

  protected readonly homeTeam = computed(() =>
    this.config().domicile ? this.config().equipe : this.config().adversaire,
  );

  protected readonly awayTeam = computed(() =>
    this.config().domicile ? this.config().adversaire : this.config().equipe,
  );

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
    let offset = 0;
    if (previousPlayers > 0) {
      offset = previousPlayers % 2 === 1 ? 9 : -9;
    }
    const top = Math.max(8, Math.min(92, position[1] + offset));
    return { left: `${position[0]}%`, top: `${top}%` };
  }

  /** Identifies substitute positions such as R1, R2, and R3. */
  protected isSubstitute(player: Player): boolean {
    return /^R\d+$/i.test((player.poste || '').trim());
  }

  protected displayPlayerName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) return name;

    const lastName = parts[parts.length - 1].replace(/\.+$/, '');
    return `${parts[0]} ${lastName.charAt(0).toUpperCase()}.`;
  }

  protected selectPlayer(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedPlayerId.set(value ? Number(value) : null);
  }

  protected addPlayer(): void {
    const playerId = this.selectedPlayerId();
    const player = (this.players.value() ?? []).find((item) => item.id === playerId);
    if (!player || this.config().joueurs.some((item) => item.nom === player.nom)) return;

    const currentPlayers = this.config().joueurs;
    const nextNumber = Math.max(0, ...currentPlayers.map((item) => item.numero)) + 1;
    const nextSubstitute = Math.max(
      0,
      ...currentPlayers
        .filter((item) => this.isSubstitute(item))
        .map((item) => Number(item.poste.slice(1))),
    ) + 1;

    this.config.update((config) => ({
      ...config,
      joueurs: [...config.joueurs, { numero: nextNumber, nom: player.nom, poste: `R${nextSubstitute}` }],
    }));
    this.selectedPlayerId.set(null);
  }

  protected removePlayer(numero: number): void {
    this.config.update((config) => ({
      ...config,
      joueurs: config.joueurs.filter((player) => player.numero !== numero),
    }));
  }

  protected onPlayerDragStart(event: DragEvent, numero: number): void {
    event.dataTransfer?.setData('text/plain', String(numero));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    this.draggingPlayerNumero.set(numero);
  }

  protected onPlayerDragEnd(): void {
    this.draggingPlayerNumero.set(null);
  }

  protected onPitchDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  protected onPitchDrop(event: DragEvent, poste: string): void {
    event.preventDefault();
    this.draggingPlayerNumero.set(null);
    const numero = Number(event.dataTransfer?.getData('text/plain'));
    if (!Number.isInteger(numero) || !this.pitchPositions.includes(poste)) return;
    this.config.update((config) => ({
      ...config,
      joueurs: (() => {
        const draggedPlayer = config.joueurs.find((player) => player.numero === numero);
        if (!draggedPlayer) return config.joueurs;

        const occupant = config.joueurs.find(
          (player) =>
            player.numero !== numero && player.poste.toUpperCase() === poste,
        );
        return config.joueurs.map((player) => {
          if (player.numero === numero) return { ...player, poste };
          if (occupant && player.numero === occupant.numero) {
            return { ...player, poste: draggedPlayer.poste };
          }
          return player;
        });
      })(),
    }));
  }

  protected onSubstituteDrop(event: DragEvent, targetNumero?: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.draggingPlayerNumero.set(null);
    const numero = Number(event.dataTransfer?.getData('text/plain'));
    if (!Number.isInteger(numero)) return;

    this.config.update((config) => {
      const draggedPlayer = config.joueurs.find((player) => player.numero === numero);
      if (!draggedPlayer) return config;

      if (targetNumero === undefined) {
        if (this.isSubstitute(draggedPlayer)) return config;
        const nextSubstitute =
          Math.max(
            0,
            ...config.joueurs
              .filter((player) => this.isSubstitute(player))
              .map((player) => Number(player.poste.slice(1))),
          ) + 1;
        return {
          ...config,
          joueurs: config.joueurs.map((player) =>
            player.numero === numero ? { ...player, poste: `R${nextSubstitute}` } : player,
          ),
        };
      }

      const targetPlayer = config.joueurs.find((player) => player.numero === targetNumero);
      if (!targetPlayer || targetPlayer.numero === draggedPlayer.numero) return config;
      return {
        ...config,
        joueurs: config.joueurs.map((player) => {
          if (player.numero === draggedPlayer.numero) return { ...player, poste: targetPlayer.poste };
          if (player.numero === targetPlayer.numero) return { ...player, poste: draggedPlayer.poste };
          return player;
        }),
      };
    });
  }

  protected updatePlayerNumber(previousNumero: number, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const isTaken = this.config().joueurs.some(
      (player) => player.numero === value && player.numero !== previousNumero,
    );
    if (!Number.isInteger(value) || value < 1 || isTaken) {
      window.alert('Le numéro doit être un entier positif et unique.');
      return;
    }

    this.config.update((config) => ({
      ...config,
      joueurs: config.joueurs.map((player) =>
        player.numero === previousNumero ? { ...player, numero: value } : player,
      ),
    }));
  }

  protected setCaptain(numero: number, event: Event): void {
    const isCaptain = (event.target as HTMLInputElement).checked;
    this.config.update((config) => ({
      ...config,
      joueurs: config.joueurs.map((player) => ({
        ...player,
        capitaine: isCaptain ? player.numero === numero : player.numero === numero ? false : player.capitaine,
      })),
    }));
  }

  /** Reads and applies a match configuration selected by the user. */
  protected onConfigFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result !== 'string') {
          throw new TypeError('Le contenu du fichier n’est pas du texte.');
        }
        this.config.set(JSON.parse(reader.result) as MatchConfig);
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
