import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, shareReplay, catchError, switchMap } from 'rxjs/operators';

export interface EnemigoItemDrop {
  nombre: string;
  tipo: string;
  rareza: string;
  probabilidad: number;
}

export interface EnemigoSpawnLocation {
  nombre: string;
  tipo: string;
  probabilidad: number;
}

export interface Enemigo {
  id: number;
  nombre: string;
  slug: string;
  tier: string;
  tipo: string;
  subtipo?: string;
  familia?: string;
  faccion?: string;
  descripcion_breve?: string;
  descripcion_completa?: string;
  descripcion_apariencia?: string; // Campo real de la BD
  lore?: string;
  comportamiento?: string;
  tactica_combate?: string;
  debilidades?: string;
  resistencias?: string;
  inmunidades?: string;
  hp?: number; // Campo real de la BD
  hp_base?: number; // Alias alternativo
  mana_base?: number;
  ataque: number;
  defensa: number;
  velocidad: number;
  critico?: number;
  evasion?: number;
  nivel_minimo?: number;
  nivel_maximo?: number;
  experiencia?: number;
  experiencia_drop?: number;
  views_drop?: number;
  datacoins?: number;
  habilidades?: string;
  habilidades_lista?: string;
  habilidad_ultimate?: string;
  patron_ataque?: string;
  patron_movimiento?: string;
  aggro_range?: number;
  social?: boolean;
  vengativo?: boolean;
  inteligencia?: string;
  agresividad?: string;
  tamano?: string;
  tamaño_grupo?: number;
  altura?: number;
  apariencia?: string;
  caracteristicas_visuales?: string;
  estetica?: string;
  color_principal?: string;
  color_tema?: string;
  efectos_visuales?: string;
  sonidos?: string;
  sonido_caracteristico?: string;
  animaciones?: string;
  muerte_animacion?: string;
  spawn_condiciones?: string;
  spawn_horario?: string;
  spawn_clima?: string;
  spawn_chance?: number;
  spawn_rate?: number;
  spawn_ubicaciones?: string;
  puede_domesticarse?: boolean;
  puede_montarse?: boolean;
  puede_invocar_refuerzos?: boolean;
  refuerzos_tipo?: string;
  caza_en_grupo?: number;
  es_boss?: boolean | number; // Puede venir como 0/1 de la BD
  es_elite?: boolean | number;
  es_raro?: boolean | number;
  boss_zona_id?: number;
  boss_saga?: string;
  boss_fases?: number;
  boss_fases_descripcion?: string;
  faccion_id?: number;
  jefe_superior_id?: number;
  trivia?: string;
  easter_eggs?: string;
  referencias?: string;
  origen?: string;
  motivacion?: string;
  nombre_autor?: string;
  inspiracion?: string;
  fecha_creacion?: string;
  actualizaciones_balance?: string;
  aparece_capitulos?: string;
  muerte_capitulo?: number;
  icono?: string;
  imagenes?: string;
  meta_description?: string;
  requiere_capitulo?: number | null;
  bloqueado?: number;
  created_at?: string;
  updated_at?: string;
  items_drop?: EnemigoItemDrop[];
  drops?: any[]; // Desde la BD
  spawn_locations?: EnemigoSpawnLocation[];
  apariciones?: any[]; // Apariciones en capítulos
  ubicaciones?: any[]; // Ubicaciones donde spawn
}

export interface EnemigosIndex {
  total: number;
  por_tier: {
    [tier: string]: number;
  };
  por_tipo: {
    [tipo: string]: number;
  };
  por_faccion: {
    [faccion: string]: number;
  };
  enemigos: Enemigo[];
}

@Injectable({
  providedIn: 'root'
})
export class EnemigosDataService {
  // 🔥 MIGRADO A CLOUDFLARE WORKER
  private readonly WORKER_URL = 'https://worker-data.trendingghostofficial.workers.dev/api/data';
  private readonly FALLBACK_URL = '/data/enemigos';
  private cache$?: Observable<Enemigo[]>;
  private useWorker = true;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los enemigos cargando desde el índice dinámico
   * 🔥 MIGRADO: Usa Cloudflare Worker
   */
  getAll(): Observable<Enemigo[]> {
    if (!this.cache$) {
      const indexUrl = this.useWorker
        ? `${this.WORKER_URL}/enemigos/index`
        : `${this.FALLBACK_URL}/index.json`;
      
      this.cache$ = this.http.get<{enemigos: string[]}>(indexUrl).pipe(
        catchError((error) => {
          console.warn('⚠️ No hay índice de enemigos, lista vacía hasta que se publiquen capítulos');
          return of({ enemigos: [] });
        }),
        switchMap((index: {enemigos: string[]}) => {
          if (!index.enemigos || index.enemigos.length === 0) {
            return of([]);
          }

          const requests = index.enemigos.map(slug =>
            this.getBySlug(slug).pipe(
              catchError(error => {
                console.warn(`⚠️ Error cargando enemigo ${slug}:`, error);
                return of(null);
              })
            )
          );

          return forkJoin(requests).pipe(
            map(enemigos => enemigos.filter((e): e is Enemigo => e !== null))
          );
        }),
        shareReplay(1)
      );
    }

    return this.cache$;
  }

  /**
   * Obtiene un enemigo por su slug
   * 🔥 MIGRADO: Usa Cloudflare Worker
   */
  getBySlug(slug: string): Observable<Enemigo | null> {
    const url = this.useWorker
      ? `${this.WORKER_URL}/enemigos/${slug}`
      : `${this.FALLBACK_URL}/${slug}.json`;
    
    return this.http.get<Enemigo>(url).pipe(
      catchError(error => {
        console.error(`❌ Error cargando enemigo ${slug}:`, error);
        if (this.useWorker) {
          return this.http.get<Enemigo>(`${this.FALLBACK_URL}/${slug}.json`).pipe(
            catchError(() => of(null))
          );
        }
        return of(null);
      })
    );
  }

  /**
   * Obtiene enemigos filtrados por tier
   */
  getByTier(tier: string): Observable<Enemigo[]> {
    return this.getAll().pipe(
      map(enemigos => enemigos.filter(e => e.tier === tier))
    );
  }

  /**
   * Obtiene enemigos filtrados por tipo
   */
  getByTipo(tipo: string): Observable<Enemigo[]> {
    return this.getAll().pipe(
      map(enemigos => enemigos.filter(e => e.tipo === tipo))
    );
  }

  /**
   * Obtiene enemigos filtrados por facción
   */
  getByFactcion(faccion: string): Observable<Enemigo[]> {
    return this.getAll().pipe(
      map(enemigos => enemigos.filter(e => e.faccion === faccion))
    );
  }

  /**
   * Obtiene solo bosses
   */
  getBosses(): Observable<Enemigo[]> {
    return this.getAll().pipe(
      map(enemigos => enemigos.filter(e => e.es_boss))
    );
  }

  /**
   * Obtiene solo elites
   */
  getElites(): Observable<Enemigo[]> {
    return this.getAll().pipe(
      map(enemigos => enemigos.filter(e => e.es_elite))
    );
  }

  /**
   * Obtiene enemigos raros
   */
  getRaros(): Observable<Enemigo[]> {
    return this.getAll().pipe(
      map(enemigos => enemigos.filter(e => e.es_raro))
    );
  }

  /**
   * Obtiene enemigos domesticables
   */
  getDomesticables(): Observable<Enemigo[]> {
    return this.getAll().pipe(
      map(enemigos => enemigos.filter(e => e.puede_domesticarse))
    );
  }

  /**
   * Obtiene un índice con totales por tier, tipo y facción
   */
  getIndex(): Observable<EnemigosIndex> {
    return this.getAll().pipe(
      map(enemigos => {
        // Contar por tier
        const porTier: { [tier: string]: number } = {};
        enemigos.forEach(e => {
          porTier[e.tier] = (porTier[e.tier] || 0) + 1;
        });

        // Contar por tipo
        const porTipo: { [tipo: string]: number } = {};
        enemigos.forEach(e => {
          porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1;
        });

        // Contar por facción
        const porFactcion: { [faccion: string]: number } = {};
        enemigos.forEach(e => {
          if (e.faccion) {
            porFactcion[e.faccion] = (porFactcion[e.faccion] || 0) + 1;
          }
        });

        return {
          total: enemigos.length,
          por_tier: porTier,
          por_tipo: porTipo,
          por_faccion: porFactcion,
          enemigos
        };
      })
    );
  }

  /**
   * Busca enemigos por nombre (case-insensitive)
   */
  buscar(query: string): Observable<Enemigo[]> {
    const normalizedQuery = query.toLowerCase().trim();

    return this.getAll().pipe(
      map(enemigos =>
        enemigos.filter(e =>
          e.nombre.toLowerCase().includes(normalizedQuery) ||
          e.descripcion_breve?.toLowerCase().includes(normalizedQuery) ||
          e.familia?.toLowerCase().includes(normalizedQuery)
        )
      )
    );
  }

  /**
   * Invalida el caché (útil si se actualizan los datos)
   */
  clearCache(): void {
    this.cache$ = undefined;
  }
}
