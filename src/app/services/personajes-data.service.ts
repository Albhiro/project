import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, shareReplay, catchError, switchMap } from 'rxjs/operators';

export interface PersonajeHabilidad {
  id: number;
  nombre: string;
  slug: string;
  tipo: string;
  tier: string;
  nivel_desbloqueo: number;
  dominio: string;
}

export interface PersonajeFactcion {
  id: number;
  nombre: string;
  slug: string;
  tipo: string;
  rol: string;
  activo: number;
}

export interface PersonajeItem {
  id: number;
  nombre: string;
  slug: string;
  tipo: string;
  rareza: string;
  cantidad: number;
  equipado: number;
}

export interface PersonajeAparicion {
  cap_id: number;
  numero: number;
  titulo: string;
  slug: string;
  rol: string;
  importancia: string;
}

export interface Personaje {
  id: number;
  nombre: string;
  slug: string;
  tipo: 'protagonista' | 'antagonista' | 'aliado' | 'secundario' | 'npc';
  nombre_completo: string;
  alias: string;
  edad: number;
  genero: string;
  altura_cm: number;
  apariencia_low_res: string;
  apariencia_high_res: string;
  estilo_visual: string;
  color_tema: string;
  tier_inicial: string;
  tier_actual: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  subs: number;
  trending_score: number;
  ocupacion_pre_colapso: string;
  ocupacion_post_colapso: string;
  origen: string;
  personalidad: string;
  motivacion: string;
  filosofia: string;
  miedos: string;
  poder_unico: string;
  poder_descripcion: string;
  debilidades: string;
  faccion_id: number | null;
  aliados: string;
  enemigos: string;
  familia: string;
  aparece_volumen_inicio: number;
  aparece_volumen_fin: number;
  estado_vital: string;
  muerte_capitulo: number | null;
  muerte_descripcion: string | null;
  arma_principal: string;
  items_unicos: string;
  biografia: string;
  historia_completa: string;
  momentos_clave: string;
  frases_iconicas: string;
  icono: string;
  imagen_perfil: string;
  galeria: string | null;
  aparece_capitulos: string | null;
  meta_description: string | null;
  requiere_capitulo: number | null;
  bloqueado: number;
  created_at: string;
  updated_at: string;
  habilidades: PersonajeHabilidad[];
  facciones: PersonajeFactcion[];
  items: PersonajeItem[];
  apariciones: PersonajeAparicion[];
}

export interface PersonajesIndex {
  total: number;
  protagonistas: number;
  antagonistas: number;
  aliados: number;
  secundarios: number;
  npcs: number;
  personajes: Personaje[];
}

@Injectable({
  providedIn: 'root'
})
export class PersonajesDataService {
  // 🔥 MIGRADO A CLOUDFLARE WORKER
  private readonly WORKER_URL = 'https://worker-data.trendingghostofficial.workers.dev/api/data';
  private readonly FALLBACK_URL = '/data/personajes';
  private cache$?: Observable<Personaje[]>;
  private useWorker = true;

  // NO usamos lista hardcodeada - cargamos dinámicamente los que existen
  // Los personajes bloqueados simplemente no tendrán archivo JSON

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los personajes disponibles (desbloqueados)
   * 🔥 MIGRADO: Usa Cloudflare Worker → trending-ghost-data/personajes/index.json
   */
  getAll(): Observable<Personaje[]> {
    if (!this.cache$) {
      const indexUrl = this.useWorker
        ? `${this.WORKER_URL}/personajes/index`
        : `${this.FALLBACK_URL}/index.json`;
      
      // Intentar cargar desde un índice
      // Si no existe, retornar array vacío
      this.cache$ = this.http.get<{personajes: string[]}>(indexUrl).pipe(
        catchError(() => {
          console.warn('⚠️ No hay índice de personajes, la lista estará vacía hasta que se publiquen capítulos');
          return of({ personajes: [] });
        }),
        switchMap(index => {
          if (!index.personajes || index.personajes.length === 0) {
            return of([]);
          }

          // Cargar todos los personajes del índice
          const requests = index.personajes.map(slug =>
            this.getBySlug(slug).pipe(
              catchError(error => {
                console.warn(`⚠️ Error cargando personaje ${slug}:`, error);
                return of(null);
              })
            )
          );

          return forkJoin(requests).pipe(
            map(personajes => personajes.filter((p): p is Personaje => p !== null))
          );
        }),
        shareReplay(1)
      );
    }

    return this.cache$;
  }

  /**
   * Obtiene un personaje por su slug
   * 🔥 MIGRADO: Usa Cloudflare Worker → trending-ghost-data/personajes/{slug}.json
   */
  getBySlug(slug: string): Observable<Personaje | null> {
    const url = this.useWorker
      ? `${this.WORKER_URL}/personajes/${slug}`
      : `${this.FALLBACK_URL}/${slug}.json`;
    
    return this.http.get<Personaje>(url).pipe(
      catchError(error => {
        console.error(`❌ Error cargando personaje ${slug}:`, error);
        
        // Fallback si Worker falla
        if (this.useWorker) {
          return this.http.get<Personaje>(`${this.FALLBACK_URL}/${slug}.json`).pipe(
            catchError(() => of(null))
          );
        }
        
        return of(null);
      })
    );
  }

  /**
   * Obtiene personajes filtrados por tipo
   */
  getByTipo(tipo: Personaje['tipo']): Observable<Personaje[]> {
    return this.getAll().pipe(
      map(personajes => personajes.filter(p => p.tipo === tipo))
    );
  }

  /**
   * Obtiene personajes filtrados por tier
   */
  getByTier(tier: string): Observable<Personaje[]> {
    return this.getAll().pipe(
      map(personajes => personajes.filter(p => p.tier_actual === tier))
    );
  }

  /**
   * Obtiene un índice con totales por tipo
   */
  getIndex(): Observable<PersonajesIndex> {
    return this.getAll().pipe(
      map(personajes => {
        const protagonistas = personajes.filter(p => p.tipo === 'protagonista');
        const antagonistas = personajes.filter(p => p.tipo === 'antagonista');
        const aliados = personajes.filter(p => p.tipo === 'aliado');
        const secundarios = personajes.filter(p => p.tipo === 'secundario');
        const npcs = personajes.filter(p => p.tipo === 'npc');

        return {
          total: personajes.length,
          protagonistas: protagonistas.length,
          antagonistas: antagonistas.length,
          aliados: aliados.length,
          secundarios: secundarios.length,
          npcs: npcs.length,
          personajes
        };
      })
    );
  }

  /**
   * Busca personajes por nombre (case-insensitive)
   */
  buscar(query: string): Observable<Personaje[]> {
    const normalizedQuery = query.toLowerCase().trim();

    return this.getAll().pipe(
      map(personajes =>
        personajes.filter(p =>
          p.nombre.toLowerCase().includes(normalizedQuery) ||
          p.nombre_completo?.toLowerCase().includes(normalizedQuery) ||
          p.alias?.toLowerCase().includes(normalizedQuery)
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
