import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommitsService, Commit, RepoName } from '../../core/services/commits.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Repository {
  id: RepoName;
  name: string;
  icon: string;
  description: string;
  commits: Commit[];
  loading: boolean;
  error: boolean;
}

@Component({
  selector: 'app-commits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './commits.component.html',
  styleUrl: './commits.component.scss'
})
export class CommitsComponent implements OnInit, OnDestroy {
  repositories: Repository[] = [
    {
      id: 'building',
      name: '🏗️ Building',
      icon: '🏗️',
      description: 'Código fuente principal',
      commits: [],
      loading: true,
      error: false
    },
    {
      id: 'trending-ghost-data',
      name: '📊 Data',
      icon: '📊',
      description: 'Datos JSON del universo',
      commits: [],
      loading: true,
      error: false
    },
    {
      id: 'trending-ghost-analytics',
      name: '📈 Analytics',
      icon: '📈',
      description: 'Sistema de métricas',
      commits: [],
      loading: true,
      error: false
    },
    {
      id: 'trendingghostofficial.github.io',
      name: '🌐 GitHub Pages',
      icon: '🌐',
      description: 'Sitio público',
      commits: [],
      loading: true,
      error: false
    }
  ];

  selectedRepo: RepoName = 'building';
  
  private destroy$ = new Subject<void>();

  constructor(public commitsService: CommitsService) {}

  ngOnInit(): void {
    this.loadAllRepos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar commits de todos los repos en paralelo
   */
  loadAllRepos(): void {
    // Crear array de observables para los 4 repos
    const requests = this.repositories.map(repo => 
      this.commitsService.getCommits(repo.id, 1, 10) // Solo primeros 10 commits
    );

    // Ejecutar todas las peticiones en paralelo
    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses) => {
          responses.forEach((response, index) => {
            this.repositories[index].commits = response.commits;
            this.repositories[index].loading = false;
            this.repositories[index].error = !response.success;
          });
        },
        error: (err) => {
          console.error('Error loading repos:', err);
          this.repositories.forEach(repo => {
            repo.loading = false;
            repo.error = true;
          });
        }
      });
  }

  /**
   * Cambiar repositorio seleccionado
   */
  selectRepo(repoId: RepoName): void {
    this.selectedRepo = repoId;
  }

  /**
   * Obtener repositorio activo
   */
  getActiveRepo(): Repository | undefined {
    return this.repositories.find(r => r.id === this.selectedRepo);
  }

  /**
   * Cargar más commits del repo actual
   */
  loadMore(repo: Repository): void {
    if (repo.loading) return;
    
    repo.loading = true;
    const currentLength = repo.commits.length;
    
    this.commitsService.getCommits(repo.id, 1, currentLength + 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          repo.commits = response.commits;
          repo.loading = false;
        },
        error: (err) => {
          console.error('Error loading more commits:', err);
          repo.loading = false;
          repo.error = true;
        }
      });
  }

  /**
   * Obtener tiempo relativo (hace X tiempo)
   */
  getRelativeTime(date: string): string {
    return this.commitsService.getRelativeTime(date);
  }

  /**
   * Obtener primera línea del mensaje
   */
  getCommitTitle(message: string): string {
    return message.split('\n')[0];
  }

  /**
   * Verificar si el commit tiene descripción adicional
   */
  hasDescription(message: string): boolean {
    return message.split('\n').length > 1;
  }

  /**
   * Obtener descripción del commit (líneas después de la primera)
   */
  getCommitDescription(message: string): string {
    const lines = message.split('\n');
    return lines.slice(1).join('\n').trim();
  }

  /**
   * Obtener icono según tipo de commit
   */
  getCommitIcon(message: string): string {
    const msg = message.toLowerCase();
    
    if (msg.startsWith('feat')) return '✨';
    if (msg.startsWith('fix')) return '🐛';
    if (msg.startsWith('docs')) return '📝';
    if (msg.startsWith('style')) return '💎';
    if (msg.startsWith('refactor')) return '♻️';
    if (msg.startsWith('perf')) return '⚡';
    if (msg.startsWith('test')) return '🧪';
    if (msg.startsWith('build')) return '🔧';
    if (msg.startsWith('ci')) return '👷';
    if (msg.startsWith('chore')) return '🔨';
    
    return '📦';
  }

  /**
   * Obtener color según tipo de commit
   */
  getCommitColor(message: string): string {
    const msg = message.toLowerCase();
    
    if (msg.startsWith('feat')) return 'var(--success-green)';
    if (msg.startsWith('fix')) return 'var(--error-red)';
    if (msg.startsWith('docs')) return 'var(--cyber-cyan)';
    if (msg.startsWith('refactor')) return 'var(--magenta)';
    if (msg.startsWith('perf')) return '#ffcc00';
    
    return 'var(--text-muted)';
  }

  /**
   * Formatear stats (adiciones/eliminaciones)
   */
  getStatsText(commit: Commit): string {
    const { additions, deletions } = commit.stats;
    if (additions === 0 && deletions === 0) return '';
    
    return `+${additions} -${deletions}`;
  }
}
