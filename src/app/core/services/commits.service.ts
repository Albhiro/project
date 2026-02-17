import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

export interface CommitAuthor {
  name: string;
  email: string;
  date: string;
  avatar_url: string | null;
}

export interface CommitCommitter {
  name: string;
  date: string;
}

export interface CommitStats {
  additions: number;
  deletions: number;
  total: number;
}

export interface Commit {
  sha: string;
  sha_full: string;
  message: string;
  author: CommitAuthor;
  committer: CommitCommitter;
  url: string;
  stats: CommitStats;
}

export interface CommitsResponse {
  success: boolean;
  cached: boolean;
  repo: string;
  commits: Commit[];
  total_count: number;
  page: number;
  per_page: number;
}

export type RepoName = 'building' | 'trending-ghost-data' | 'trending-ghost-analytics' | 'trendingghostofficial.github.io';

@Injectable({
  providedIn: 'root'
})
export class CommitsService {
  private readonly API_URL = 'https://worker-commits.trendingghostofficial.workers.dev/api/commits';
  
  // Cache en memoria del servicio
  private cache$ = new Map<string, Observable<CommitsResponse>>();

  // Nombres amigables de repos
  readonly repoDisplayNames: Record<RepoName, string> = {
    'building': '🏗️ Building (Código Fuente)',
    'trending-ghost-data': '📊 Data (JSON)',
    'trending-ghost-analytics': '📈 Analytics (Estadísticas)',
    'trendingghostofficial.github.io': '🌐 GitHub Pages (Sitio)'
  };

  constructor(private http: HttpClient) {}

  /**
   * Obtener historial de commits con paginación
   */
  getCommits(repo: RepoName = 'building', page = 1, perPage = 30, branch = 'main'): Observable<CommitsResponse> {
    const cacheKey = `${repo}:${branch}:${page}:${perPage}`;
    
    // Si ya está en cache, retornar observable cacheado
    if (this.cache$.has(cacheKey)) {
      return this.cache$.get(cacheKey)!;
    }

    const params = new HttpParams()
      .set('repo', repo)
      .set('page', page.toString())
      .set('per_page', perPage.toString())
      .set('branch', branch);

    const request$ = this.http.get<CommitsResponse>(this.API_URL, { params }).pipe(
      map(response => {
        console.log('✅ Commits loaded:', response.commits.length, 'cached:', response.cached);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error loading commits:', error);
        return of({
          success: false,
          cached: false,
          repo,
          commits: [],
          total_count: 0,
          page,
          per_page: perPage
        } as CommitsResponse);
      }),
      shareReplay(1) // Compartir resultado entre múltiples suscriptores
    );

    this.cache$.set(cacheKey, request$);
    return request$;
  }

  /**
   * Obtener últimos N commits de un repo específico
   */
  getLatestCommits(repo: RepoName = 'building', count = 10): Observable<Commit[]> {
    return this.getCommits(repo, 1, count).pipe(
      map(response => response.commits)
    );
  }

  /**
   * Formatear fecha de commit en formato relativo
   */
  getRelativeTime(date: string): string {
    const now = new Date();
    const commitDate = new Date(date);
    const diffMs = now.getTime() - commitDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) !== 1 ? 's' : ''}`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) !== 1 ? 'es' : ''}`;
    return `Hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) !== 1 ? 's' : ''}`;
  }

  /**
   * Truncar mensaje de commit
   */
  truncateMessage(message: string, maxLength = 50): string {
    const firstLine = message.split('\n')[0];
    if (firstLine.length <= maxLength) return firstLine;
    return firstLine.substring(0, maxLength) + '...';
  }

  /**
   * Limpiar cache (útil si quieres forzar recarga)
   */
  clearCache(): void {
    this.cache$.clear();
  }
}
