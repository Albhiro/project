import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ScrollToTopComponent } from '../../components/scroll-to-top/scroll-to-top.component';
import { ProgressService } from '../../services/progress.service';
import { CommonModule } from '@angular/common';
import { EnemigosDataService, Enemigo } from '../../services/enemigos-data.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-bestiario',
  standalone: true,
  imports: [ScrollToTopComponent, CommonModule, TranslatePipe],
  templateUrl: './bestiario.component.html',
  styleUrl: './bestiario.component.css'
})
export class BestiarioComponent implements OnInit {
  // Datos cargados desde JSON
  enemigos: Enemigo[] = [];
  loading = true;
  error = false;

  // Sistema de tabs y filtros
  activeTab: 'todos' | 'glitch' | 'corrupted' | 'elite' | 'boss' = 'todos';
  filtroTier: string = 'todos';
  enemigosFiltrados: Enemigo[] = [];

  // Modal
  modalAbierto: boolean = false;
  enemigoSeleccionado: Enemigo | null = null;

  constructor(
    public progressService: ProgressService,
    private enemigosData: EnemigosDataService,
    private cdr: ChangeDetectorRef,
    private i18n: I18nService
  ) {}

  ngOnInit(): void {
    // Cargar enemigos desde JSON
    this.enemigosData.getAll().subscribe({
      next: (enemigos) => {
        this.enemigos = enemigos;
        this.enemigosFiltrados = enemigos;
        this.loading = false;

        // Forzar detección de cambios
        this.cdr.detectChanges();

        console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #ff0000; font-weight: bold;');
        console.log('%c║               💀 BESTIARIO - DATABASE                        ║', 'color: #ff0000; font-size: 16px; font-weight: bold;');
        console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #ff0000; font-weight: bold;');
        console.log(`%c\n✅ ${this.enemigos.length} enemigos cargados desde JSON`, 'color: #00ffff; font-size: 12px;');
        console.log('%c\n💡 Los enemigos mostrados son los que aparecen en capítulos publicados.', 'color: #00ffff; font-size: 11px;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #888888;');
      },
      error: (err) => {
        console.error('❌ Error cargando enemigos:', err);
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Formatea número de HP
   */
  formatHP(hp: number | undefined): string {
    if (!hp) return '0 HP';

    if (hp >= 1000000) {
      return `${(hp / 1000000).toFixed(1)}M HP`;
    } else if (hp >= 1000) {
      return `${(hp / 1000).toFixed(0)}K HP`;
    } else {
      return `${hp} HP`;
    }
  }

  /**
   * Cambia tab activo y aplica filtros
   */
  setActiveTab(tab: 'todos' | 'glitch' | 'corrupted' | 'elite' | 'boss'): void {
    this.activeTab = tab;
    this.aplicarFiltros();
  }

  /**
   * Cambia tab activo desde string (para tabs dinámicos)
   */
  setActiveTabString(tab: string): void {
    this.activeTab = tab as any;
    this.aplicarFiltros();
  }

  /**
   * Cambia filtro de tier
   */
  setFiltroTier(tier: string): void {
    this.filtroTier = tier;
    this.aplicarFiltros();
  }

  /**
   * Aplica filtros combinados (tab + tier)
   */
  aplicarFiltros(): void {
    let resultado = this.enemigos;

    // Filtrar por tab (tipo)
    if (this.activeTab !== 'todos') {
      if (this.activeTab === 'boss') {
        resultado = resultado.filter(e => e.es_boss === true);
      } else {
        resultado = resultado.filter(e => e.tipo === this.activeTab);
      }
    }

    // Filtrar por tier
    if (this.filtroTier !== 'todos') {
      resultado = resultado.filter(e => e.tier === this.filtroTier);
    }

    this.enemigosFiltrados = resultado;
  }

  /**
   * Obtiene tiers únicos disponibles
   */
  getTiersDisponibles(): string[] {
    const tiers = new Set(this.enemigos.map(e => e.tier).filter(t => t));
    return Array.from(tiers).sort();
  }

  /**
   * Obtiene conteo por tipo
   */
  getConteoPorTipo(tipo: string): number {
    if (tipo === 'todos') return this.enemigos.length;
    if (tipo === 'boss') return this.enemigos.filter(e => e.es_boss === true).length;
    return this.enemigos.filter(e => e.tipo === tipo).length;
  }

  /**
   * Obtiene tipos únicos
   */
  getTiposDisponibles(): string[] {
    const tipos = new Set(this.enemigos.map(e => e.tipo).filter(t => t));
    return Array.from(tipos);
  }

  /**
   * Traduce el tipo de enemigo usando el sistema i18n
   */
  traducirTipoEnemigo(tipo: string): string {
    const key = `bestiary.enemy_type_${tipo}`;
    return this.i18n.getTranslation(key);
  }

  /**
   * Abre modal con detalles del enemigo
   */
  abrirModal(enemigo: Enemigo): void {
    this.enemigoSeleccionado = enemigo;
    this.modalAbierto = true;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Cierra modal
   */
  cerrarModal(): void {
    this.modalAbierto = false;
    this.enemigoSeleccionado = null;
    document.body.style.overflow = 'auto';
  }

  /**
   * Obtiene el icono del enemigo según tipo
   */
  getEnemigoIcono(enemigo: Enemigo): string {
    return this.getIconoPorTipo(enemigo.tipo);
  }

  /**
   * Obtiene el icono por tipo (string)
   */
  getIconoPorTipo(tipo: string): string {
    // Iconos por tipo
    const iconos: { [key: string]: string } = {
      'glitch': '👾',
      'corrupted': '😈',
      'elite': '⚔️',
      'boss': '💀',
      'horror': '😱',
      'digital': '🤖'
    };

    return iconos[tipo] || '👹';
  }  /**
   * Obtiene color por tier
   */
  getTierColor(tier: string): string {
    const colores: { [key: string]: string } = {
      'F': '#22c55e',
      'E': '#84cc16',
      'D': '#eab308',
      'C': '#f97316',
      'B': '#ef4444',
      'A': '#dc2626',
      'S': '#a855f7',
      'GOD': '#d946ef'
    };
    return colores[tier] || '#888';
  }

  /**
   * Parsea habilidades desde string JSON
   */
  parseHabilidades(habilidadesStr: string | undefined): any[] {
    if (!habilidadesStr) return [];
    try {
      return JSON.parse(habilidadesStr);
    } catch {
      return [];
    }
  }

  /**
   * Parsea debilidades desde string JSON
   */
  parseDebilidades(debilidadesStr: string | undefined): string[] {
    if (!debilidadesStr) return [];
    try {
      return JSON.parse(debilidadesStr);
    } catch {
      return [];
    }
  }

  /**
   * Traduce nivel de inteligencia
   */
  traducirInteligencia(inteligencia: string | undefined): string {
    const traducciones: { [key: string]: string } = {
      'idiota': 'Muy Baja',
      'tonto': 'Baja',
      'normal': 'Normal',
      'listo': 'Alta',
      'genial': 'Muy Alta',
      'genio': 'Genio'
    };
    return inteligencia ? (traducciones[inteligencia] || inteligencia) : 'Desconocida';
  }

  /**
   * Traduce nivel de agresividad
   */
  traducirAgresividad(agresividad: string | undefined): string {
    const traducciones: { [key: string]: string } = {
      'pacifico': 'Pacífico',
      'neutral': 'Neutral',
      'agresivo': 'Agresivo',
      'muy_agresivo': 'Muy Agresivo'
    };
    return agresividad ? (traducciones[agresividad] || agresividad) : 'Desconocida';
  }
}
