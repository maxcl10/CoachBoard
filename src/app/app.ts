import { Component, computed, inject, signal } from '@angular/core';
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
  styleUrl: './app.scss',
  imports: [DatePipe, TitleCasePipe],
})
export class App {
  private readonly maxPlayers = 14;
  private readonly playersService = inject(PlayersService);
  protected readonly players = rxResource({
    stream: () => this.playersService.getPlayers(),
  });
  protected readonly selectedPlayerId = signal<number | null>(null);
  protected readonly draggingPlayerId = signal<number | null>(null);

  protected readonly config = signal<MatchConfig>({
    team: 'EJPS 2 U14 (1er)',
    opponent: 'Saint-Louis Neuweg (2e)',
    venue: 'Stade de l\'Au',
    home: false,
    matchType: 'Championnat U14 D1  J2',
    date: '2026-09-19',
    formation: '4-3-3',
    players: [
      { playerId: 28, shirtNumber: 1, position: 'GB' },
      { playerId: 13, shirtNumber: 5, position: 'DG' },
      { playerId: 8, shirtNumber: 2, position: 'DCG' },
      { playerId: 9, shirtNumber: 4, position: 'DCD' },
      { playerId: 3, shirtNumber: 3, position: 'DD' },
      { playerId: 5, shirtNumber: 6, position: 'MDC' },
      { playerId: 34, shirtNumber: 8, position: 'MCG', captain: true },
      { playerId: 17, shirtNumber: 19, position: 'MCD' },
      { playerId: 19, shirtNumber: 10, position: 'AG' },
      { playerId: 27, shirtNumber: 18, position: 'AD' },
      { playerId: 15, shirtNumber: 11, position: 'AC' },
      { playerId: 11, shirtNumber: 20, position: 'R1' },
      { playerId: 29, shirtNumber: 12, position: 'R2' },
      { playerId: 30, shirtNumber: 9, position: 'R3' },
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
    this.config().players.filter((player) => !this.isSubstitute(player)),
  );

  protected readonly listedPlayers = computed(() =>
    [...this.config().players].sort((a, b) => a.shirtNumber - b.shirtNumber),
  );
  protected readonly canAddPlayer = computed(
    () => this.config().players.length < this.maxPlayers,
  );
  protected readonly captainNumero = computed(
    () => this.config().players.find((player) => player.captain)?.playerId ?? null,
  );

  protected readonly substitutes = computed(() =>
    this.config()
      .players.filter((player) => this.isSubstitute(player))
      .sort((a, b) => Number(a.position.slice(1)) - Number(b.position.slice(1))),
  );

  protected readonly playersAvailableToAdd = computed(() => {
    const currentPlayerIds = new Set(this.config().players.map((player) => player.playerId));
    return (this.players.value() ?? [])
      .filter((player) => !currentPlayerIds.has(player.id))
      .sort((a, b) =>
        a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' }) ||
        a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }),
      );
  });

  protected readonly homeTeam = computed(() =>
    this.config().home ? this.config().team : this.config().opponent,
  );

  protected readonly awayTeam = computed(() =>
    this.config().home ? this.config().opponent : this.config().team,
  );

  /** Returns the pitch coordinates for a starter, offsetting duplicate positions. */
  protected positionFor(
    player: Player,
    index: number,
  ): {
    left: string;
    top: string;
  } | null {
    const position = this.positionMap[player.position.toUpperCase()];
    if (!position) return null;

    const previousPlayers = this.starters()
      .slice(0, index)
      .filter((item) => item.position.toUpperCase() === player.position.toUpperCase()).length;
    let offset = 0;
    if (previousPlayers > 0) {
      offset = previousPlayers % 2 === 1 ? 9 : -9;
    }
    const top = Math.max(8, Math.min(92, position[1] + offset));
    return { left: `${position[0]}%`, top: `${top}%` };
  }

  /** Identifies substitute positions such as R1, R2, and R3. */
  protected isSubstitute(player: Player): boolean {
    return /^R\d+$/i.test((player.position || '').trim());
  }

  private nextSubstitutePosition(players: Player[]): string {
    const usedSlots = new Set(
      players
        .filter((player) => this.isSubstitute(player))
        .map((player) => Number(player.position.slice(1))),
    );
    let slot = 1;
    while (usedSlots.has(slot)) slot += 1;
    return `R${slot}`;
  }

  protected playerName(player: Player): string {
    const directoryEntry = (this.players.value() ?? []).find((item) => item.id === player.playerId);
    return directoryEntry
      ? `${directoryEntry.firstName} ${directoryEntry.lastName}`
      : `Joueur ${player.playerId}`;
  }

  protected shortPlayerName(player: Player): string {
    const directoryEntry = (this.players.value() ?? []).find((item) => item.id === player.playerId);
    return directoryEntry
      ? `${directoryEntry.firstName} ${directoryEntry.lastName.charAt(0).toUpperCase()}.`
      : `Joueur ${player.playerId}`;
  }

  protected selectPlayer(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedPlayerId.set(value ? Number(value) : null);
  }

  protected createNewConfig(): void {
    this.config.set({
      team: '',
      opponent: '',
      venue: '',
      home: false,
      matchType: '',
      date: '',
      formation: '',
      players: [],
    });
    this.selectedPlayerId.set(null);
    this.draggingPlayerId.set(null);
  }

  protected addPlayer(): void {
    if (!this.canAddPlayer()) return;
    const playerId = this.selectedPlayerId();
    const player = (this.players.value() ?? []).find((item) => item.id === playerId);
    if (!player || this.config().players.some((item) => item.playerId === player.id)) return;

    const currentPlayers = this.config().players;
    const nextNumber = Math.max(0, ...currentPlayers.map((item) => item.shirtNumber)) + 1;
    const nextSubstitute = this.nextSubstitutePosition(currentPlayers);

    this.config.update((config) => ({
      ...config,
      players: [...config.players, { playerId: player.id, shirtNumber: nextNumber, position: nextSubstitute }],
    }));
    this.selectedPlayerId.set(null);
  }

  protected removePlayer(playerId: number): void {
    this.config.update((config) => ({
      ...config,
      players: config.players.filter((player) => player.playerId !== playerId),
    }));
  }

  protected onPlayerDragStart(event: DragEvent, playerId: number): void {
    event.dataTransfer?.setData('text/plain', String(playerId));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    this.draggingPlayerId.set(playerId);
  }

  protected onPlayerDragEnd(): void {
    this.draggingPlayerId.set(null);
  }

  protected onPitchDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  protected onPitchDrop(event: DragEvent, position: string): void {
    event.preventDefault();
    this.draggingPlayerId.set(null);
    const playerId = Number(event.dataTransfer?.getData('text/plain'));
    if (!Number.isInteger(playerId) || !this.pitchPositions.includes(position)) return;
    this.config.update((config) => ({
      ...config,
      players: (() => {
        const draggedPlayer = config.players.find((player) => player.playerId === playerId);
        if (!draggedPlayer) return config.players;

        const occupant = config.players.find(
          (player) =>
            player.playerId !== playerId && player.position.toUpperCase() === position,
        );
        return config.players.map((player) => {
          if (player.playerId === playerId) return { ...player, position };
          if (occupant && player.playerId === occupant.playerId) {
            return { ...player, position: draggedPlayer.position };
          }
          return player;
        });
      })(),
    }));
  }

  protected onSubstituteDrop(event: DragEvent, targetPlayerId?: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.draggingPlayerId.set(null);
    const playerId = Number(event.dataTransfer?.getData('text/plain'));
    if (!Number.isInteger(playerId)) return;

    this.config.update((config) => {
      const draggedPlayer = config.players.find((player) => player.playerId === playerId);
      if (!draggedPlayer) return config;

      if (targetPlayerId === undefined) {
        if (this.isSubstitute(draggedPlayer)) return config;
        const nextSubstitute = this.nextSubstitutePosition(config.players);
        return {
          ...config,
          players: config.players.map((player) =>
            player.playerId === playerId ? { ...player, position: nextSubstitute } : player,
          ),
        };
      }

      const targetPlayer = config.players.find((player) => player.playerId === targetPlayerId);
      if (!targetPlayer || targetPlayer.playerId === draggedPlayer.playerId) return config;
      return {
        ...config,
        players: config.players.map((player) => {
          if (player.playerId === draggedPlayer.playerId) return { ...player, position: targetPlayer.position };
          if (player.playerId === targetPlayer.playerId) return { ...player, position: draggedPlayer.position };
          return player;
        }),
      };
    });
  }

  protected onTrashDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const playerId = Number(event.dataTransfer?.getData('text/plain'));
    this.draggingPlayerId.set(null);
    if (Number.isInteger(playerId)) this.removePlayer(playerId);
  }

  protected updatePlayerNumber(playerId: number, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const isTaken = this.config().players.some(
      (player) => player.shirtNumber === value && player.playerId !== playerId,
    );
    if (!Number.isInteger(value) || value < 1 || isTaken) {
      window.alert('Le numéro doit être un entier positif et unique.');
      return;
    }

    this.config.update((config) => ({
      ...config,
      players: config.players.map((player) =>
        player.playerId === playerId ? { ...player, shirtNumber: value } : player,
      ),
    }));
  }

  protected selectCaptain(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const playerId = value ? Number(value) : null;
    this.config.update((config) => ({
      ...config,
      players: config.players.map((player) => ({
        ...player,
        captain: playerId !== null && player.playerId === playerId,
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
        const config = JSON.parse(reader.result) as MatchConfig;
        if (config.players.length > this.maxPlayers) {
          window.alert(`Une configuration ne peut pas contenir plus de ${this.maxPlayers} joueurs.`);
          return;
        }
        this.config.set(config);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Le fichier JSON est invalide.');
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
