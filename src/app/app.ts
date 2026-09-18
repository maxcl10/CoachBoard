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
  private readonly maxPlayers = 14;
  private readonly playersService = inject(PlayersService);
  protected readonly players = rxResource({
    stream: () => this.playersService.getPlayers(),
  });
  protected readonly selectedPlayerId = signal<number | null>(null);
  protected readonly draggingPlayerId = signal<number | null>(null);

  protected readonly config = signal<MatchConfig>({
    equipe: 'EJPS 2 U14 (1er)',
    adversaire: 'Saint-Louis Neuweg (2e)',
    lieu: 'Stade de l\'Au',
    domicile: false,
    typeMatch: 'Championnat U14 D1  J2',
    date: '2026-09-19',
    formation: '4-3-3',
    joueurs: [
      { playerId: 28, numero: 1, poste: 'GB' },
      { playerId: 13, numero: 5, poste: 'DG' },
      { playerId: 8, numero: 2, poste: 'DCG' },
      { playerId: 9, numero: 4, poste: 'DCD' },
      { playerId: 3, numero: 3, poste: 'DD' },
      { playerId: 5, numero: 6, poste: 'MDC' },
      { playerId: 34, numero: 8, poste: 'MCG', capitaine: true },
      { playerId: 17, numero: 19, poste: 'MCD' },
      { playerId: 19, numero: 10, poste: 'AG' },
      { playerId: 27, numero: 18, poste: 'AD' },
      { playerId: 15, numero: 11, poste: 'AC' },
      { playerId: 11, numero: 20, poste: 'R1' },
      { playerId: 29, numero: 12, poste: 'R2' },
      { playerId: 30, numero: 9, poste: 'R3' },
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

  protected readonly listedPlayers = computed(() =>
    [...this.config().joueurs].sort((a, b) => a.numero - b.numero),
  );
  protected readonly canAddPlayer = computed(
    () => this.config().joueurs.length < this.maxPlayers,
  );
  protected readonly captainNumero = computed(
    () => this.config().joueurs.find((player) => player.capitaine)?.playerId ?? null,
  );

  protected readonly substitutes = computed(() =>
    this.config()
      .joueurs.filter((player) => this.isSubstitute(player))
      .sort((a, b) => Number(a.poste.slice(1)) - Number(b.poste.slice(1))),
  );

  protected readonly playersAvailableToAdd = computed(() => {
    const currentPlayerIds = new Set(this.config().joueurs.map((player) => player.playerId));
    return (this.players.value() ?? [])
      .filter((player) => !currentPlayerIds.has(player.id))
      .sort((a, b) =>
        a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' }) ||
        a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }),
      );
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

  protected playerName(player: Player): string {
    const directoryEntry = (this.players.value() ?? []).find((item) => item.id === player.playerId);
    return directoryEntry
      ? `${directoryEntry.prenom} ${directoryEntry.nom}`
      : player.nom ?? `Joueur ${player.playerId}`;
  }

  protected selectPlayer(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedPlayerId.set(value ? Number(value) : null);
  }

  protected addPlayer(): void {
    if (!this.canAddPlayer()) return;
    const playerId = this.selectedPlayerId();
    const player = (this.players.value() ?? []).find((item) => item.id === playerId);
    if (!player || this.config().joueurs.some((item) => item.playerId === player.id)) return;

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
      joueurs: [...config.joueurs, { playerId: player.id, numero: nextNumber, poste: `R${nextSubstitute}` }],
    }));
    this.selectedPlayerId.set(null);
  }

  protected removePlayer(playerId: number): void {
    this.config.update((config) => ({
      ...config,
      joueurs: config.joueurs.filter((player) => player.playerId !== playerId),
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

  protected onPitchDrop(event: DragEvent, poste: string): void {
    event.preventDefault();
    this.draggingPlayerId.set(null);
    const playerId = Number(event.dataTransfer?.getData('text/plain'));
    if (!Number.isInteger(playerId) || !this.pitchPositions.includes(poste)) return;
    this.config.update((config) => ({
      ...config,
      joueurs: (() => {
        const draggedPlayer = config.joueurs.find((player) => player.playerId === playerId);
        if (!draggedPlayer) return config.joueurs;

        const occupant = config.joueurs.find(
          (player) =>
            player.playerId !== playerId && player.poste.toUpperCase() === poste,
        );
        return config.joueurs.map((player) => {
          if (player.playerId === playerId) return { ...player, poste };
          if (occupant && player.playerId === occupant.playerId) {
            return { ...player, poste: draggedPlayer.poste };
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
      const draggedPlayer = config.joueurs.find((player) => player.playerId === playerId);
      if (!draggedPlayer) return config;

      if (targetPlayerId === undefined) {
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
            player.playerId === playerId ? { ...player, poste: `R${nextSubstitute}` } : player,
          ),
        };
      }

      const targetPlayer = config.joueurs.find((player) => player.playerId === targetPlayerId);
      if (!targetPlayer || targetPlayer.playerId === draggedPlayer.playerId) return config;
      return {
        ...config,
        joueurs: config.joueurs.map((player) => {
          if (player.playerId === draggedPlayer.playerId) return { ...player, poste: targetPlayer.poste };
          if (player.playerId === targetPlayer.playerId) return { ...player, poste: draggedPlayer.poste };
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
    const isTaken = this.config().joueurs.some(
      (player) => player.numero === value && player.playerId !== playerId,
    );
    if (!Number.isInteger(value) || value < 1 || isTaken) {
      window.alert('Le numéro doit être un entier positif et unique.');
      return;
    }

    this.config.update((config) => ({
      ...config,
      joueurs: config.joueurs.map((player) =>
        player.playerId === playerId ? { ...player, numero: value } : player,
      ),
    }));
  }

  protected selectCaptain(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const playerId = value ? Number(value) : null;
    this.config.update((config) => ({
      ...config,
      joueurs: config.joueurs.map((player) => ({
        ...player,
        capitaine: playerId !== null && player.playerId === playerId,
      })),
    }));
  }

  private normalizeConfig(
    config: MatchConfig & { joueurs: Array<Player & { playerId?: number }> },
  ): MatchConfig {
    const directory = this.players.value();
    if (!directory) {
      throw new Error('Le répertoire des joueurs n’est pas encore chargé.');
    }

    const joueurs = config.joueurs.map((player) => {
      if (Number.isInteger(player.playerId)) {
        return {
          playerId: player.playerId,
          numero: player.numero,
          poste: player.poste,
          capitaine: player.capitaine,
        };
      }

      const legacyName = player.nom?.trim().toLocaleLowerCase('fr-FR');
      const directoryEntry = directory.find((entry) => {
        const fullName = `${entry.prenom} ${entry.nom}`.toLocaleLowerCase('fr-FR');
        if (legacyName === fullName) return true;
        const parts = legacyName?.split(/\s+/) ?? [];
        return parts.length >= 2 &&
          entry.prenom.toLocaleLowerCase('fr-FR') === parts[0] &&
          entry.nom.charAt(0).toLocaleLowerCase('fr-FR') === parts[parts.length - 1].replace('.', '');
      });

      if (!directoryEntry) {
        throw new Error(`Le joueur « ${player.nom ?? 'inconnu'} » n’existe pas dans le répertoire.`);
      }
      return {
        playerId: directoryEntry.id,
        numero: player.numero,
        poste: player.poste,
        capitaine: player.capitaine,
      };
    });

    return { ...config, joueurs };
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
        const config = this.normalizeConfig(
          JSON.parse(reader.result) as MatchConfig & { joueurs: Array<Player & { playerId?: number }> },
        );
        if (config.joueurs.length > this.maxPlayers) {
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
