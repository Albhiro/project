import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';

// Interfaces
export interface Capitulo {
  id: number;
  numero: number;
  titulo: string;
  slug: string;
  volumen: number;
  vol_titulo: string;
  vol_numero: number;
  contenido: string;
  publicado: boolean;
  palabras: number;
  minutos_lectura: number;
  excerpt: string;
  icono?: string;
  personajes: Array<{
    id: number;
    nombre: string;
    slug: string;
    tipo: string;
    rol: string;
    importancia: string;
  }>;
  ubicaciones: Array<{
    id: number;
    nombre: string;
    slug: string;
    tipo: string;
    es_principal: boolean;
  }>;
  enemigos: Array<any>;
  eventos: Array<any>;
  metadata: {
    generatedAt: string;
  };
}

export interface Personaje {
  id: number;
  nombre: string;
  slug: string;
  tipo: string;
  descripcion?: string;
  requiere_capitulo?: number;
  bloqueado: boolean;
  apariciones: Array<{
    cap_id: number;
    numero: number;
    titulo: string;
    slug: string;
    rol: string;
    importancia: string;
  }>;
  relaciones: Array<any>;
  items: Array<any>;
  metadata: {
    generatedAt: string;
  };
}

export interface SagasIndex {
  metadata: {
    total: number;
    generatedAt: string;
  };
  volumenes: Array<{
    id: number;
    numero: number;
    titulo: string;
    descripcion: string;
    capitulos: Array<{
      id: number;
      numero: number;
      titulo: string;
      slug: string;
      publicado: boolean;
      icono?: string;
      palabras: number;
      minutos_lectura: number;
      excerpt: string;
    }>;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Cloudflare Worker URL
  private readonly DATA_WORKER = 'https://worker-data.trendingghostofficial.workers.dev/api/data';
  
  // Cache en memoria
  private sagasCache$ = new BehaviorSubject<SagasIndex | null>(null);
  private capitulosCache = new Map<string, Observable<Capitulo>>();
  private personajesCache = new Map<string, Observable<Personaje>>();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el índice de sagas (volumenes + capítulos)
   * Cached: Se mantiene en memoria durante toda la sesión
   */
  getSagasIndex(): Observable<SagasIndex> {
    // Si ya está en cache, devolverlo
    if (this.sagasCache$.value) {
      return of(this.sagasCache$.value);
    }

    // Si no, hacer fetch
    const url = `${this.DATA_WORKER}/sagas/index`;
    return this.http.get<SagasIndex>(url).pipe(
      tap(data => this.sagasCache$.next(data)),
      catchError(error => {
        console.error('[DataService] Error fetching sagas index:', error);
        throw error;
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtiene un capítulo por volumen y número
   * Cached: Permanece en memoria una vez cargado
   */
  getCapitulo(volumen: number, numero: number): Observable<Capitulo> {
    const key = `v${volumen}-c${numero}`;
    
    // Si ya está en cache, devolverlo
    if (this.capitulosCache.has(key)) {
      return this.capitulosCache.get(key)!;
    }

    // Si no, hacer fetch y cachear
    const url = `${this.DATA_WORKER}/capitulos/${key}`;
    const request$ = this.http.get<Capitulo>(url).pipe(
      catchError(error => {
        console.error(`[DataService] Error fetching cap ${key}:`, error);
        throw error;
      }),
      shareReplay(1)
    );

    this.capitulosCache.set(key, request$);
    return request$;
  }

  /**
   * Obtiene un personaje por slug
   * Cached: Permanece en memoria una vez cargado
   */
  getPersonaje(slug: string): Observable<Personaje> {
    // Si ya está en cache, devolverlo
    if (this.personajesCache.has(slug)) {
      return this.personajesCache.get(slug)!;
    }

    // Si no, hacer fetch y cachear
    const url = `${this.DATA_WORKER}/personajes/${slug}`;
    const request$ = this.http.get<Personaje>(url).pipe(
      catchError(error => {
        console.error(`[DataService] Error fetching personaje ${slug}:`, error);
        throw error;
      }),
      shareReplay(1)
    );

    this.personajesCache.set(slug, request$);
    return request$;
  }

  /**
   * Obtiene el índice de personajes (lista de slugs)
   */
  getPersonajesIndex(): Observable<{ personajes: string[]; metadata: any }> {
    const url = `${this.DATA_WORKER}/personajes/index`;
    return this.http.get<{ personajes: string[]; metadata: any }>(url).pipe(
      catchError(error => {
        console.error('[DataService] Error fetching personajes index:', error);
        throw error;
      })
    );
  }

  /**
   * Limpia el cache (útil para refrescar datos)
   */
  clearCache(): void {
    this.sagasCache$.next(null);
    this.capitulosCache.clear();
    this.personajesCache.clear();
  }

  /**
   * Precarga capítulos adyacentes (optimización)
   * Útil para precarga mientras el usuario lee
   */
  preloadAdjacentCapitulos(volumen: number, numero: number): void {
    // Precarga siguiente
    this.getCapitulo(volumen, numero + 1).subscribe({
      next: () => console.log(`[DataService] Preloaded cap ${numero + 1}`),
      error: () => {} // Ignorar errores (puede no existir)
    });

    // Precarga anterior si no es el primero
    if (numero > 1) {
      this.getCapitulo(volumen, numero - 1).subscribe({
        next: () => console.log(`[DataService] Preloaded cap ${numero - 1}`),
        error: () => {}
      });
    }
  }
}
