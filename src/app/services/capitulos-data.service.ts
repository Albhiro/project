import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';

// ============================================
// INTERFACES - Coinciden exactamente con JSONs
// ============================================

export interface CapitulosIndex {
  total: number;
  publicados: number;
  ultimo_publicado: string;
  proximo_publicacion?: string;
  volumenes: Volumen[];
}

export interface Volumen {
  numero: number;
  titulo: string;
  subtitulo: string;
  rango: string;
  estado: 'planificacion' | 'publicacion' | 'completo';
  color_tema: string;
  capitulos_publicados: number;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  capitulos: CapituloMeta[];
}

export interface CapituloMeta {
  numero: number;
  titulo: string;
  slug: string;
  fecha: string;
  publicado: boolean;
  minutos: number;
  palabras: number;
  icono: string;
  excerpt: string | null;
}

export interface Capitulo {
  id: number;
  numero: number;
  volumen: number;
  titulo: string;
  slug: string;
  fecha_publicacion: string;
  publicado: boolean;
  minutos_lectura: number;
  palabras: number;
  icono: string;
  excerpt: string;
  contenido_html: string;
  contenido_markdown: string;
  personajes: any[];
  ubicaciones: any[];
  enemigos: any[];
  eventos: any[];
  // Campos opcionales del JSON
  anterior_slug?: string | null;
  siguiente_slug?: string | null;
  meta_description?: string;
  meta_keywords?: string;
  meta_og_image?: string;
  meta_author?: string;
  views_totales?: number;
  likes?: number;
  compartidos?: number;
  comentarios?: number;
}

// ============================================
// SERVICIO
// ============================================

@Injectable({
  providedIn: 'root'
})
export class CapitulosDataService {
  // 🔥 MIGRADO A CLOUDFLARE WORKER
  private readonly WORKER_URL = 'https://worker-data.trendingghostofficial.workers.dev/api/data';
  private readonly FALLBACK_URL = '/data'; // Fallback local si Worker falla
  private indexCache$?: Observable<CapitulosIndex>;
  private useWorker = true; // Toggle para testing

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el índice completo de capítulos
   * 🔥 MIGRADO: Usa Cloudflare Worker → trending-ghost-data/arcs.json
   * @returns Observable con la estructura completa de volúmenes y capítulos
   */
  getIndex(): Observable<CapitulosIndex> {
    if (!this.indexCache$) {
      const url = this.useWorker 
        ? `${this.WORKER_URL}/arcs` // Worker (sin .json)
        : `${this.FALLBACK_URL}/arcs.json`; // Fallback local
      
      this.indexCache$ = this.http.get<any>(url).pipe(
        map(arcs => {
          // Transformar estructura arcs.json a CapitulosIndex
          const volumenes: Volumen[] = arcs.volumenes.map((vol: any) => ({
            numero: vol.numero,
            titulo: vol.titulo,
            subtitulo: vol.subtitulo || '',
            rango: vol.rango,
            estado: vol.estado,
            color_tema: vol.color_tema,
            capitulos_publicados: vol.capitulos_publicados || 0,
            fecha_inicio: vol.fecha_inicio,
            fecha_fin_estimada: vol.fecha_fin_estimada,
            capitulos: (vol.capitulos || []).map((cap: any) => ({
              numero: cap.numero,
              titulo: cap.titulo,
              slug: cap.slug,
              fecha: cap.fecha_publicacion || '',
              publicado: cap.publicado === 1 || cap.publicado === true,
              minutos: cap.minutos_lectura || 0,
              palabras: cap.palabras || 0,
              icono: cap.icono || '📖',
              excerpt: cap.excerpt || null
            }))
          }));

          // Calcular totales
          const totalCapitulos = volumenes.reduce((sum, vol) => sum + vol.capitulos.length, 0);
          const publicados = volumenes.reduce((sum, vol) =>
            sum + vol.capitulos.filter(c => c.publicado).length, 0
          );

          // Encontrar último y próximo
          let ultimoPublicado = '';
          let proximoPublicacion = '';

          volumenes.forEach(vol => {
            vol.capitulos.forEach(cap => {
              if (cap.publicado && cap.fecha && cap.fecha > ultimoPublicado) {
                ultimoPublicado = cap.fecha;
              }
            });
          });

          return {
            total: totalCapitulos,
            publicados: publicados,
            ultimo_publicado: ultimoPublicado,
            proximo_publicacion: proximoPublicacion || undefined,
            volumenes: volumenes
          };
        }),
        shareReplay(1), // Cache en memoria
        catchError(error => {
          console.error('❌ Error cargando arcs.json:', error);
          // Retornar estructura vacía si falla
          return of({
            total: 0,
            publicados: 0,
            ultimo_publicado: '',
            volumenes: []
          });
        })
      );
    }
    return this.indexCache$;
  }

  /**
   * Obtiene un capítulo individual por slug
   * 🔥 MIGRADO: Usa Cloudflare Worker → trending-ghost-data/capitulos/{slug}.json
   * @param slug - Identificador del capítulo (ej: 'v1-c1-el-nadie-de-ciudad-neon')
   * @returns Observable con el contenido completo del capítulo
   */
  getCapitulo(slug: string): Observable<Capitulo | null> {
    const url = this.useWorker
      ? `${this.WORKER_URL}/capitulos/${slug}` // Worker (sin .json)
      : `${this.FALLBACK_URL}/capitulos/${slug}.json`; // Fallback local
    
    return this.http.get<Capitulo>(url).pipe(
      catchError(error => {
        console.error(`❌ Error cargando capítulo ${slug}:`, error);
        
        // Si Worker falla, intentar fallback local
        if (this.useWorker) {
          console.warn('⚠️  Worker falló, intentando fallback local...');
          return this.http.get<Capitulo>(`${this.FALLBACK_URL}/capitulos/${slug}.json`).pipe(
            catchError(() => of(null))
          );
        }
        
        return of(null);
      })
    );
  }

  /**
   * Obtiene un capítulo por número de volumen y capítulo
   * Construye el slug automáticamente: v{volumen}-c{numero}
   * @param volumen - Número del volumen
   * @param numero - Número del capítulo
   * @returns Observable con el contenido del capítulo
   */
  getCapituloPorNumero(volumen: number, numero: number): Observable<Capitulo | null> {
    const slug = `v${volumen}-c${numero}`;
    return this.getCapitulo(slug);
  }

  /**
   * Obtiene todos los capítulos de un volumen específico
   * @param numeroVolumen - Número del volumen
   * @returns Observable con array de metadatos de capítulos
   */
  getCapitulosDelVolumen(numeroVolumen: number): Observable<CapituloMeta[]> {
    return this.getIndex().pipe(
      map(index => {
        const volumen = index.volumenes.find(v => v.numero === numeroVolumen);
        return volumen ? volumen.capitulos : [];
      })
    );
  }

  /**
   * Obtiene los datos de un volumen específico
   * @param numeroVolumen - Número del volumen
   * @returns Observable con datos del volumen o null si no existe
   */
  getVolumen(numeroVolumen: number): Observable<Volumen | null> {
    return this.getIndex().pipe(
      map(index => {
        return index.volumenes.find(v => v.numero === numeroVolumen) || null;
      })
    );
  }

  /**
   * Obtiene todos los volúmenes
   * @returns Observable con array de volúmenes
   */
  getVolumenes(): Observable<Volumen[]> {
    return this.getIndex().pipe(
      map(index => index.volumenes)
    );
  }

  /**
   * Calcula el progreso de lectura de un volumen
   * @param numeroVolumen - Número del volumen
   * @returns Observable con porcentaje (0-100)
   */
  getProgresoVolumen(numeroVolumen: number): Observable<number> {
    return this.getCapitulosDelVolumen(numeroVolumen).pipe(
      map(capitulos => {
        if (capitulos.length === 0) return 0;
        const publicados = capitulos.filter(c => c.publicado).length;
        return (publicados / capitulos.length) * 100;
      })
    );
  }

  /**
   * Calcula el progreso global de todos los capítulos
   * @returns Observable con porcentaje (0-100)
   */
  getProgresoGlobal(): Observable<number> {
    return this.getIndex().pipe(
      map(index => {
        if (index.total === 0) return 0;
        return (index.publicados / index.total) * 100;
      })
    );
  }

  /**
   * Obtiene solo los capítulos publicados
   * @returns Observable con array de capítulos publicados
   */
  getCapitulosPublicados(): Observable<CapituloMeta[]> {
    return this.getIndex().pipe(
      map(index => {
        const publicados: CapituloMeta[] = [];
        index.volumenes.forEach(vol => {
          vol.capitulos.forEach(cap => {
            if (cap.publicado) {
              publicados.push(cap);
            }
          });
        });
        return publicados;
      })
    );
  }

  /**
   * Invalida el cache del índice
   * Útil tras publicar un nuevo capítulo o actualizar datos
   */
  invalidateCache(): void {
    this.indexCache$ = undefined;
    console.log('♻️ Cache del índice invalidado');
  }

  /**
   * Precarga el índice en memoria
   * Útil para llamar en AppComponent.ngOnInit()
   */
  preloadIndex(): void {
    this.getIndex().subscribe({
      next: () => console.log('✅ Índice de capítulos precargado'),
      error: (err) => console.error('❌ Error precargando índice:', err)
    });
  }
}
