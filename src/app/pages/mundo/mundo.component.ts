import { Component, OnInit } from '@angular/core';
import { ScrollToTopComponent } from '../../components/scroll-to-top/scroll-to-top.component';
import { ProgressService } from '../../services/progress.service';
import { CommonModule } from '@angular/common';
import { MundoDataService, Ubicacion } from '../../services/mundo-data.service';
import { WorldbuildingDataService } from '../../services/worldbuilding-data.service';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-mundo',
  standalone: true,
  imports: [ScrollToTopComponent, CommonModule, TranslatePipe],
  templateUrl: './mundo.component.html',
  styleUrl: './mundo.component.css'
})
export class MundoComponent implements OnInit {
  // Datos cargados desde JSON
  ubicaciones: Ubicacion[] = [];
  worldbuilding: Map<string, any> = new Map();
  loading = true;
  error = false;

  // Secciones dinámicas construidas desde datos
  secciones: any[] = [];

  constructor(
    public progressService: ProgressService,
    private mundoData: MundoDataService,
    private worldbuildingData: WorldbuildingDataService
  ) {}

  ngOnInit(): void {
    // Cargar datos desde JSON
    forkJoin({
      ubicaciones: this.mundoData.getAll(),
      worldbuilding: this.worldbuildingData.getAll()
    }).subscribe({
      next: ({ ubicaciones, worldbuilding }) => {
        this.ubicaciones = ubicaciones;
        this.worldbuilding = worldbuilding;

        // Construir secciones dinámicas desde ubicaciones
        this.construirSecciones();

        this.loading = false;

        // Limpiar consola y mostrar Easter Egg
        console.clear();

        if (this.progressService.getCapituloActual() === 0) {
          console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #00ffff; font-weight: bold;');
          console.log('%c║                  🌍 MUNDO - ENCICLOPEDIA                      ║', 'color: #00ffff; font-size: 16px; font-weight: bold;');
          console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #00ffff; font-weight: bold;');
          console.log('%c\n🔍 INSPECTOR DETECTADO 🔍', 'color: #00ffff; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px #00ffff;');
          console.log('%c¿Pensabas que ibas a spoilearte la historia por DevTools?', 'color: #ff00ff; font-size: 14px;');
          console.log('%cEn TRENDING GHOST, incluso los hackers deben esperar. 😎', 'color: #00ffff; font-size: 12px;');
          console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ffff;');
          console.log('%c💬 MENSAJE DEL ALGORITMO 2.0:', 'color: #ff00ff; font-size: 16px; font-weight: bold;');
          console.log('%c"Esse est percipi" — Ser es ser percibido.', 'color: #ffffff; font-size: 13px; font-style: italic;');
          console.log('%cPero si nadie te ve inspeccionando... ¿realmente lo estás haciendo?', 'color: #888888; font-size: 11px;');
          console.log('%c\n🎭 EASTER EGG DESBLOQUEADO:', 'color: #00ffff; font-size: 14px; font-weight: bold;');
          console.log('%cFelicidades, eres nivel "Script Kiddie 0 Views".', 'color: #ff00ff; font-size: 12px;');
          console.log('%cVuelve cuando se publique el Cap. 1 (14 Jun 2026) como toda la gente normal. 👻', 'color: #00ffff; font-size: 12px;');
          console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #00ffff;');
        } else {
          console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #00ffff; font-weight: bold;');
          console.log('%c║                  🌍 MUNDO - ENCICLOPEDIA                      ║', 'color: #00ffff; font-size: 16px; font-weight: bold;');
          console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #00ffff; font-weight: bold;');
          console.log('%c\n👻 TRENDING GHOST', 'color: #00ffff; font-size: 16px; font-weight: bold;');
          console.log(`%cProgreso actual: Cap. ${this.progressService.getCapituloActual()}/100`, 'color: #ff00ff; font-size: 12px;');
          console.log(`%c✅ ${this.ubicaciones.length} ubicaciones cargadas desde JSON`, 'color: #00ffff; font-size: 12px;');
          console.log(`%c✅ ${this.worldbuilding.size} tablas de worldbuilding cargadas`, 'color: #00ffff; font-size: 12px;');
          console.log('%c¿Buscando spoilers? El contenido bloqueado está en el DOM... pero ¿dónde está la diversión en eso? 🤷', 'color: #888888; font-size: 11px; font-style: italic;');
          console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #888888;');
        }
      },
      error: (err) => {
        console.error('❌ Error cargando datos de mundo:', err);
        this.loading = false;
        this.error = true;
      }
    });
  }

  /**
   * Construye secciones dinámicamente desde ubicaciones y worldbuilding
   */
  construirSecciones(): void {
    this.secciones = [];

    // Agregar ubicaciones como secciones (sin filtrar - el script ya filtró)
    this.ubicaciones.forEach(ubicacion => {
      this.secciones.push({
        id: ubicacion.slug,
        icono: ubicacion.icono || '📍',
        titulo: ubicacion.nombre,
        descripcion: ubicacion.descripcion_corta,
        tipo: 'ubicacion',
        data: ubicacion
      });
    });

    // Agregar tablas de worldbuilding como secciones especiales
    const tablasImportantes = [
      { tabla: 'conceptos', icono: '💡', titulo: 'Conceptos Clave' },
      { tabla: 'sistema_stats', icono: '📊', titulo: 'Sistema de Stats' },
      { tabla: 'jerga', icono: '🗣️', titulo: 'Jerga del Mundo' },
      { tabla: 'ocupaciones', icono: '💼', titulo: 'Ocupaciones' },
      { tabla: 'monedas', icono: '💰', titulo: 'Sistema Monetario' }
    ];

    tablasImportantes.forEach(({ tabla, icono, titulo }) => {
      if (this.worldbuilding.has(tabla)) {
        const data = this.worldbuilding.get(tabla);
        this.secciones.push({
          id: tabla,
          icono,
          titulo,
          descripcion: `${data.metadata.total} entradas`,
          tipo: 'worldbuilding',
          data
        });
      }
    });
  }

  scrollToSection(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Obtiene datos de una ubicación por slug
   */
  getUbicacion(slug: string): Ubicacion | undefined {
    return this.ubicaciones.find(u => u.slug === slug);
  }

  /**
   * Obtiene tabla de worldbuilding
   */
  getWorldbuildingTabla(tabla: string): any {
    return this.worldbuilding.get(tabla);
  }

  /**
   * Formatea población
   */
  formatPoblacion(poblacion: number): string {
    if (poblacion >= 1000000) {
      return `${(poblacion / 1000000).toFixed(1)}M habitantes`;
    } else if (poblacion >= 1000) {
      return `${(poblacion / 1000).toFixed(0)}K habitantes`;
    } else {
      return `${poblacion} habitantes`;
    }
  }

  /**
   * Formatea números grandes
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    } else {
      return num.toString();
    }
  }

  /**
   * Obtiene nivel de peligro con emoji
   */
  getPeligrosidadBadge(peligrosidad: string): string {
    const badges: { [key: string]: string } = {
      'muy_bajo': '🟢 Muy Bajo',
      'bajo': '🟡 Bajo',
      'medio': '🟠 Medio',
      'alto': '🔴 Alto',
      'extremo': '⚫ Extremo',
      'letal': '💀 Letal'
    };
    return badges[peligrosidad] || peligrosidad;
  }

  /**
   * Obtiene keys de worldbuilding para iterar
   */
  getWorldbuildingKeys(): string[] {
    return Array.from(this.worldbuilding.keys());
  }

  /**
   * Obtiene icono para tabla de worldbuilding
   */
  getTableIcon(key: string): string {
    const iconos: { [key: string]: string } = {
      'conceptos': '💡',
      'sistema_stats': '📊',
      'jerga': '🗣️',
      'ocupaciones': '💼',
      'monedas': '💰',
      'alimentos': '🍱',
      'tipos_vivienda': '🏠',
      'bebidas': '🍹',
      'tecnologia': '💻',
      'transporte': '🚗',
      'entretenimiento': '🎮',
      'redes_sociales': '📱',
      'empresas': '🏢',
      'facciones': '⚔️',
      'leyes': '⚖️',
      'educacion': '🎓',
      'salud': '🏥',
      'religion': '✝️',
      'festividades': '🎉',
      'deportes': '⚽',
      'arte': '🎨',
      'musica': '🎵',
      'moda': '👗',
      'lenguaje': '📝',
      'estilos_moda': '👗',
      'tipos_relaciones': '💑',
      'metodos_reproduccion': '👶',
      'tipos_muerte': '💀',
      'tipos_funerales': '⚰️',
      'estadisticas_sociales': '📈',
      'referencias': '📚',
      'precios_referencia': '💵',
      'sistemas_corporales': '🧬',
      'enfermedades': '🦠',
      'instituciones_educativas': '🎓'
    };
    return iconos[key] || '📋';
  }

  /**
   * Obtiene nombre corto para navegación
   */
  getTableShortName(key: string): string {
    const nombres: { [key: string]: string } = {
      'conceptos': 'Conceptos',
      'sistema_stats': 'Stats',
      'jerga': 'Jerga',
      'ocupaciones': 'Ocupaciones',
      'monedas': 'Monedas',
      'alimentos': 'Alimentos',
      'tipos_vivienda': 'Vivienda',
      'estilos_moda': 'Moda',
      'tipos_relaciones': 'Relaciones',
      'metodos_reproduccion': 'Reproducción',
      'tipos_muerte': 'Muerte',
      'tipos_funerales': 'Funerales',
      'festividades': 'Festividades',
      'estadisticas_sociales': 'Estadísticas',
      'referencias': 'Referencias',
      'precios_referencia': 'Precios',
      'sistemas_corporales': 'Biología',
      'enfermedades': 'Enfermedades',
      'instituciones_educativas': 'Educación'
    };
    return nombres[key] || key;
  }

  /**
   * Formatea nombre de tabla de worldbuilding
   */
  formatTableName(key: string): string {
    const nombres: { [key: string]: string } = {
      'conceptos': 'Conceptos Clave',
      'sistema_stats': 'Sistema de Stats',
      'jerga': 'Jerga del Mundo',
      'ocupaciones': 'Ocupaciones',
      'monedas': 'Sistema Monetario',
      'alimentos': 'Alimentos',
      'tipos_vivienda': 'Tipos de Vivienda',
      'bebidas': 'Bebidas',
      'tecnologia': 'Tecnología',
      'transporte': 'Transporte',
      'entretenimiento': 'Entretenimiento',
      'redes_sociales': 'Redes Sociales',
      'empresas': 'Empresas',
      'facciones': 'Facciones',
      'leyes': 'Leyes',
      'educacion': 'Educación',
      'salud': 'Salud',
      'religion': 'Religión',
      'festividades': 'Festividades',
      'deportes': 'Deportes',
      'arte': 'Arte',
      'musica': 'Música',
      'moda': 'Moda',
      'lenguaje': 'Lenguaje',
      'estilos_moda': 'Estilos de Moda',
      'tipos_relaciones': 'Tipos de Relaciones',
      'metodos_reproduccion': 'Métodos de Reproducción',
      'tipos_muerte': 'Tipos de Muerte',
      'tipos_funerales': 'Tipos de Funerales',
      'estadisticas_sociales': 'Estadísticas Sociales',
      'referencias': 'Referencias Culturales',
      'precios_referencia': 'Precios de Referencia',
      'sistemas_corporales': 'Sistemas Corporales',
      'enfermedades': 'Enfermedades',
      'instituciones_educativas': 'Instituciones Educativas'
    };
    return nombres[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
  }
}
