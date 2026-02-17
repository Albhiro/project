import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ScrollToTopComponent } from '../../components/scroll-to-top/scroll-to-top.component';
import { ProgressService } from '../../services/progress.service';
import { CommonModule } from '@angular/common';
import { PersonajesDataService, Personaje } from '../../services/personajes-data.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-personajes',
  standalone: true,
  imports: [ScrollToTopComponent, CommonModule, TranslatePipe],
  templateUrl: './personajes-tabs.component.html',
  styleUrl: './personajes-tabs.component.css'
})
export class PersonajesComponent implements OnInit {
  // Datos cargados desde JSON
  personajes: Personaje[] = [];
  protagonistas: Personaje[] = [];
  antagonistas: Personaje[] = [];
  aliados: Personaje[] = [];
  secundarios: Personaje[] = [];
  loading = true;
  error = false;

  // Sistema de tabs y filtros
  activeTab: 'todos' | 'protagonistas' | 'antagonistas' | 'aliados' | 'secundarios' = 'todos';
  filtroTier: string = 'todos';
  personajesFiltrados: Personaje[] = [];

  // Modal
  modalAbierto: boolean = false;
  personajeSeleccionado: Personaje | null = null;

  constructor(
    public progressService: ProgressService,
    private personajesData: PersonajesDataService,
    private cdr: ChangeDetectorRef,
    private i18n: I18nService
  ) {}

  ngOnInit(): void {
    // Cargar personajes desde JSON (sin filtros - el script ya filtró)
    this.personajesData.getAll().subscribe({
      next: (personajes) => {
        this.personajes = personajes;

        // Separar por tipo
        this.protagonistas = personajes.filter(p => p.tipo === 'protagonista');
        this.antagonistas = personajes.filter(p => p.tipo === 'antagonista');
        this.aliados = personajes.filter(p => p.tipo === 'aliado');
        this.secundarios = personajes.filter(p => p.tipo === 'secundario');

        // Inicializar filtrados con todos
        this.personajesFiltrados = this.personajes;

        this.loading = false;

        // Forzar detección de cambios
        this.cdr.detectChanges();

        // Limpiar consola y mostrar info
        console.clear();
        console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #ff00ff; font-weight: bold;');
        console.log('%c║               👥 PERSONAJES - DATABASE                        ║', 'color: #ff00ff; font-size: 16px; font-weight: bold;');
        console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #ff00ff; font-weight: bold;');
        console.log(`%c\n✅ ${this.personajes.length} personajes cargados desde JSON`, 'color: #00ffff; font-size: 12px;');
        console.log(`%c   • Protagonistas: ${this.protagonistas.length}`, 'color: #888888; font-size: 11px;');
        console.log(`%c   • Antagonistas: ${this.antagonistas.length}`, 'color: #888888; font-size: 11px;');
        console.log(`%c   • Aliados: ${this.aliados.length}`, 'color: #888888; font-size: 11px;');
        console.log(`%c   • Secundarios: ${this.secundarios.length}`, 'color: #888888; font-size: 11px;');
        console.log('%c\n💡 Los personajes mostrados son los que aparecen en capítulos publicados.', 'color: #00ffff; font-size: 11px;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #888888;');
      },
      error: (err) => {
        console.error('❌ Error cargando personajes:', err);
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  getAllPersonajes(): Personaje[] {
    return this.personajes;
  }

  // Métodos para construir datos de vista compatibles con template existente
  getPersonajeIcono(personaje: Personaje): string {
    return personaje.icono || '[:)]';
  }

  getPersonajeTitulo(personaje: Personaje): string {
    const aliasArray = personaje.alias ? JSON.parse(personaje.alias) : [];
    const alias = Array.isArray(aliasArray) && aliasArray.length > 0 ? aliasArray[0] : personaje.nombre;
    return `${alias} · ${this.formatViews(personaje.views)}`;
  }

  getPersonajeStats(personaje: Personaje) {
    return {
      views: this.formatViews(personaje.views),
      resolution: this.getResolution(personaje),
      poder: this.getPrimerHabilidad(personaje)
    };
  }

  formatViews(views: number): string {
    if (views >= 1000000000) {
      return `${(views / 1000000000).toFixed(1)}B Views`;
    } else if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M Views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(0)}K Views`;
    } else {
      return `${views} Views`;
    }
  }

  getResolution(personaje: Personaje): string {
    if (personaje.apariencia_low_res && personaje.apariencia_low_res.includes('garabato')) {
      return 'MS Paint 1995 (16 colores)';
    } else if (personaje.apariencia_high_res && personaje.apariencia_high_res.includes('8K')) {
      return 'Hiperrealismo 8K perfecto';
    } else {
      // Estimar por tier
      const tier = personaje.tier_actual;
      if (tier === 'GOD' || tier === 'S') return 'Ultra-HD (1440p+)';
      if (tier === 'A' || tier === 'B') return '1080p';
      if (tier === 'C' || tier === 'D') return '720p';
      return '480p';
    }
  }

  getPrimerHabilidad(personaje: Personaje): string {
    if (personaje.habilidades && personaje.habilidades.length > 0) {
      const habilidad = personaje.habilidades[0];
      return `${habilidad.nombre} - ${personaje.poder_descripcion || habilidad.tipo}`;
    }
    return personaje.poder_unico || 'Sin habilidades registradas';
  }

  getPersonajeDescripcion(personaje: Personaje): string {
    return personaje.biografia || personaje.personalidad || personaje.historia_completa || '';
  }

  /**
   * Cambia tab activo y aplica filtros
   */
  setActiveTab(tab: 'todos' | 'protagonistas' | 'antagonistas' | 'aliados' | 'secundarios'): void {
    this.activeTab = tab;
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
    let resultado = this.personajes;

    // Filtrar por tab
    if (this.activeTab !== 'todos') {
      resultado = resultado.filter(p => p.tipo === this.activeTab.slice(0, -1)); // 'protagonistas' -> 'protagonista'
    }

    // Filtrar por tier
    if (this.filtroTier !== 'todos') {
      resultado = resultado.filter(p => p.tier_actual === this.filtroTier);
    }

    this.personajesFiltrados = resultado;
  }

  /**
   * Obtiene tiers únicos disponibles
   */
  getTiersDisponibles(): string[] {
    const tiers = new Set(this.personajes.map(p => p.tier_actual).filter(t => t));
    return Array.from(tiers).sort();
  }

  /**
   * Traduce el tipo de personaje usando el sistema i18n
   */
  traducirTipoPersonaje(tipo: string): string {
    const key = `characters.char_type_${tipo}`;
    return this.i18n.getTranslation(key);
  }

  /**
   * Obtiene conteo por tipo
   */
  getConteoPorTipo(tipo: string): number {
    if (tipo === 'todos') return this.personajes.length;
    return this.personajes.filter(p => p.tipo === tipo).length;
  }

  /**
   * Abre modal con detalles del personaje
   */
  abrirModal(personaje: Personaje): void {
    this.personajeSeleccionado = personaje;
    this.modalAbierto = true;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Cierra modal
   */
  cerrarModal(): void {
    this.modalAbierto = false;
    this.personajeSeleccionado = null;
    document.body.style.overflow = 'auto';
  }
}
