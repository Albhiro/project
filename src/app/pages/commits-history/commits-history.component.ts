import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommitsService, Commit, RepoName } from '../../core/services/commits.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ScrollToTopComponent } from '../../components/scroll-to-top/scroll-to-top.component';

@Component({
  selector: 'app-commits-history',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ScrollToTopComponent],
  templateUrl: './commits-history.component.html',
  styleUrls: ['./commits-history.component.scss']
})
export class CommitsHistoryComponent implements OnInit {
  commits: Commit[] = [];
  loading = true;
  error = false;
  errorMessage = '';

  // Selector de repo
  selectedRepo: RepoName = 'building';
  repos: RepoName[] = [
    'building',
    'trending-ghost-data',
    'trending-ghost-analytics',
    'trendingghostofficial.github.io'
  ];

  // Paginación
  currentPage = 1;
  perPage = 30;
  hasMore = true;
  loadingMore = false;

  constructor(public commitsService: CommitsService) {}

  ngOnInit(): void {
    this.loadCommits();
  }

  /**
   * Cargar commits (primera página)
   */
  loadCommits(): void {
    this.loading = true;
    this.error = false;

    this.commitsService.getCommits(this.selectedRepo, this.currentPage, this.perPage).subscribe({
      next: (response) => {
        this.commits = response.commits;
        this.loading = false;
        this.hasMore = response.commits.length === this.perPage;
        console.log('✅ Commits loaded:', response);
      },
      error: (err) => {
        console.error('❌ Error loading commits:', err);
        this.error = true;
        this.errorMessage = err.message || 'Error al cargar el historial';
        this.loading = false;
      }
    });
  }

  /**
   * Cargar más commits (siguiente página)
   */
  loadMore(): void {
    if (this.loadingMore || !this.hasMore) return;

    this.loadingMore = true;
    this.currentPage++;

    this.commitsService.getCommits(this.selectedRepo, this.currentPage, this.perPage).subscribe({
      next: (response) => {
        this.commits = [...this.commits, ...response.commits];
        this.loadingMore = false;
        this.hasMore = response.commits.length === this.perPage;
      },
      error: (err) => {
        console.error('❌ Error loading more commits:', err);
        this.loadingMore = false;
        this.currentPage--; // Revertir página
      }
    });
  }

  /**
   * Cambiar de repositorio
   */
  selectRepo(repo: RepoName): void {
    if (repo === this.selectedRepo) return;
    
    this.selectedRepo = repo;
    this.currentPage = 1;
    this.commits = [];
    this.hasMore = true;
    this.loadCommits();
  }

  /**
   * Recargar commits (limpiar cache)
   */
  reload(): void {
    this.commitsService.clearCache();
    this.currentPage = 1;
    this.commits = [];
    this.loadCommits();
  }

  /**
   * Formatear fecha relativa
   */
  getRelativeTime(date: string): string {
    return this.commitsService.getRelativeTime(date);
  }

  /**
   * Obtener primera línea del mensaje
   */
  getCommitTitle(commit: Commit): string {
    return commit.message.split('\n')[0];
  }

  /**
   * Obtener cuerpo del mensaje (si existe)
   */
  getCommitBody(commit: Commit): string | null {
    const lines = commit.message.split('\n');
    if (lines.length > 2) {
      return lines.slice(2).join('\n').trim();
    }
    return null;
  }

  /**
   * Detectar tipo de commit por prefijo
   */
  getCommitType(message: string): { type: string; icon: string; color: string } {
    const msg = message.toLowerCase();
    
    if (msg.startsWith('feat:') || msg.startsWith('feature:')) {
      return { type: 'Feature', icon: '✨', color: 'cyan' };
    }
    if (msg.startsWith('fix:')) {
      return { type: 'Fix', icon: '🐛', color: 'green' };
    }
    if (msg.startsWith('docs:')) {
      return { type: 'Docs', icon: '📝', color: 'blue' };
    }
    if (msg.startsWith('style:')) {
      return { type: 'Style', icon: '💎', color: 'purple' };
    }
    if (msg.startsWith('refactor:')) {
      return { type: 'Refactor', icon: '♻️', color: 'yellow' };
    }
    if (msg.startsWith('perf:')) {
      return { type: 'Performance', icon: '⚡', color: 'orange' };
    }
    if (msg.startsWith('test:')) {
      return { type: 'Test', icon: '✅', color: 'green' };
    }
    if (msg.startsWith('chore:')) {
      return { type: 'Chore', icon: '🔧', color: 'gray' };
    }
    if (msg.startsWith('ci:')) {
      return { type: 'CI', icon: '🤖', color: 'blue' };
    }
    if (msg.startsWith('build:')) {
      return { type: 'Build', icon: '📦', color: 'brown' };
    }
    
    return { type: 'Commit', icon: '📌', color: 'default' };
  }

  /**
   * Copiar SHA al portapapeles
   */
  copySHA(sha: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    navigator.clipboard.writeText(sha).then(() => {
      console.log('✅ SHA copiado:', sha);
      // TODO: Mostrar toast de confirmación
    }).catch(err => {
      console.error('❌ Error al copiar SHA:', err);
    });
  }
}
