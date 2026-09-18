import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { PlayerDirectoryEntry } from '../models/player-directory-entry.model';

@Injectable({ providedIn: 'root' })
export class PlayersService {
  private readonly http = inject(HttpClient);
  private readonly playersUrl = 'data/players.json';
  private readonly players$ = this.http
    .get<PlayerDirectoryEntry[]>(this.playersUrl)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  getPlayers(): Observable<PlayerDirectoryEntry[]> {
    return this.players$;
  }

  getPlayer(id: number): Observable<PlayerDirectoryEntry | undefined> {
    return this.players$.pipe(map((players) => players.find((player) => player.id === id)));
  }
}
