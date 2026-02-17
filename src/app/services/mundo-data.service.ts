import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, shareReplay, catchError, switchMap } from 'rxjs/operators';

export interface UbicacionCapitulo {
  cap_id: number;
  numero: number;
  titulo: string;
  slug: string;
  es_principal: number;
}

export interface UbicacionEnemigo {
  id: number;
  nombre: string;
  slug: string;
  tipo: string;
  tier: string;
  spawn_rate: number;
}

export interface Ubicacion {
  id: number;
  nombre: string;
  slug: string;
  tipo: string;
  ubicacion_padre_id: number | null;
  capa_planetaria: string;
  descripcion_corta: string;
  descripcion_completa: string;
  poblacion: number;
  extension_km2: number;
  nivel_señal: number;
  trending_promedio: number;
  clima: string;
  peligrosidad: string;
  efectos_especiales: string | null;
  habitantes_principales: string;
  controlada_por: string;
  faccion_dominante_id: number | null;
  puntos_interes: string;
  enemigos_comunes: string;
  boss_zona_id: number | null;
  moneda_principal: string | null;
  servicios_disponibles: string | null;
  precio_alquiler_mensual: number | null;
  color_tema: string;
  icono: string;
  imagenes: string | null;
  aparece_volumenes: string;
  aparece_capitulos: string | null;
  meta_description: string | null;
  requiere_capitulo: number | null;
  bloqueado: number;
  created_at: string;
  updated_at: string;
  apariciones: UbicacionCapitulo[];
  enemigos: UbicacionEnemigo[];
}

export interface UbicacionesIndex {
  total: number;
  por_tipo: {
    [tipo: string]: number;
  };
  por_region: {
    [region: string]: number;
  };
  ubicaciones: Ubicacion[];
}

@Injectable({
  providedIn: 'root'
})
export class MundoDataService {
  // 🔥 MIGRADO A CLOUDFLARE WORKER
  private readonly WORKER_URL = 'https://worker-data.trendingghostofficial.workers.dev/api/data';
  private readonly FALLBACK_URL = '/data/ubicaciones';
  private cache$?: Observable<Ubicacion[]>;
  private useWorker = true;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las ubicaciones cargando desde el índice dinámico
   * 🔥 MIGRADO: Usa Cloudflare Worker
   */
  getAll(): Observable<Ubicacion[]> {
    if (!this.cache$) {
      const indexUrl = this.useWorker
        ? `${this.WORKER_URL}/ubicaciones/index`
        : `${this.FALLBACK_URL}/index.json`;
      
      this.cache$ = this.http.get<{ubicaciones: string[]}>(indexUrl).pipe(
        catchError((error) => {
          console.warn('⚠️ No hay índice de ubicaciones, lista vacía hasta que se publiquen capítulos');
          return of({ ubicaciones: [] });
        }),
        switchMap((index: {ubicaciones: string[]}) => {
          if (!index.ubicaciones || index.ubicaciones.length === 0) {
            return of([]);
          }

          const requests = index.ubicaciones.map(slug =>
            this.getBySlug(slug).pipe(
              catchError(error => {
                console.warn(`⚠️ Error cargando ubicación ${slug}:`, error);
                return of(null);
              })
            )
          );

          return forkJoin(requests).pipe(
            map(ubicaciones => ubicaciones.filter((u): u is Ubicacion => u !== null))
          );
        }),
        shareReplay(1)
      );
    }

    return this.cache$;
  }  /**
   * Obtiene una ubicación por su slug
   * 🔥 MIGRADO: Usa Cloudflare Worker
   */
  getBySlug(slug: string): Observable<Ubicacion | null> {
    const url = this.useWorker
      ? `${this.WORKER_URL}/ubicaciones/${slug}`
      : `${this.FALLBACK_URL}/${slug}.json`;
    
    return this.http.get<Ubicacion>(url).pipe(
      catchError(error => {
        console.error(`❌ Error cargando ubicación ${slug}:`, error);
        if (this.useWorker) {
          return this.http.get<Ubicacion>(`${this.FALLBACK_URL}/${slug}.json`).pipe(
            catchError(() => of(null))
          );
        }
        return of(null);
      })
    );
  }

  /**
   * Obtiene ubicaciones filtradas por tipo
   */
  getByTipo(tipo: string): Observable<Ubicacion[]> {
    return this.getAll().pipe(
      map(ubicaciones => ubicaciones.filter(u => u.tipo === tipo))
    );
  }

  /**
   * Obtiene ubicaciones filtradas por región (basado en tipo o controlador)
   */
  getByRegion(controlador: string): Observable<Ubicacion[]> {
    return this.getAll().pipe(
      map(ubicaciones => ubicaciones.filter(u => u.controlada_por === controlador))
    );
  }

  /**
   * Obtiene ubicaciones filtradas por nivel de peligro (basado en peligrosidad)
   */
  getByNivelPeligro(peligrosidad: string): Observable<Ubicacion[]> {
    return this.getAll().pipe(
      map(ubicaciones => ubicaciones.filter(u => u.peligrosidad === peligrosidad))
    );
  }

  /**
   * Obtiene un índice con totales por tipo y controlador
   */
  getIndex(): Observable<UbicacionesIndex> {
    return this.getAll().pipe(
      map(ubicaciones => {
        // Contar por tipo
        const porTipo: { [tipo: string]: number } = {};
        ubicaciones.forEach(u => {
          porTipo[u.tipo] = (porTipo[u.tipo] || 0) + 1;
        });

        // Contar por controlador (usando controlada_por como "región")
        const porRegion: { [region: string]: number } = {};
        ubicaciones.forEach(u => {
          const control = u.controlada_por || 'Sin control';
          porRegion[control] = (porRegion[control] || 0) + 1;
        });

        return {
          total: ubicaciones.length,
          por_tipo: porTipo,
          por_region: porRegion,
          ubicaciones
        };
      })
    );
  }

  /**
   * Busca ubicaciones por nombre (case-insensitive)
   */
  buscar(query: string): Observable<Ubicacion[]> {
    const normalizedQuery = query.toLowerCase().trim();

    return this.getAll().pipe(
      map(ubicaciones =>
        ubicaciones.filter(u =>
          u.nombre.toLowerCase().includes(normalizedQuery) ||
          u.descripcion_corta?.toLowerCase().includes(normalizedQuery)
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
