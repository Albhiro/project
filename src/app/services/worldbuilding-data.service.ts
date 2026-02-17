import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';

export interface WorldbuildingDato {
  [key: string]: any; // Cada tabla tiene estructura diferente
}

export interface WorldbuildingTabla {
  metadata: {
    tabla: string;
    total: number;
    descripcion?: string;
  };
  datos: WorldbuildingDato[];
}

export interface WorldbuildingIndex {
  total_tablas: number;
  tablas: {
    [tabla: string]: {
      total: number;
      bloqueado: boolean;
      requiere_capitulo: number | null;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class WorldbuildingDataService {
  // 🔥 MIGRADO A CLOUDFLARE WORKER
  private readonly WORKER_URL = 'https://worker-data.trendingghostofficial.workers.dev/api/data';
  private readonly FALLBACK_URL = '/data/worldbuilding';
  private cache$?: Observable<Map<string, WorldbuildingTabla>>;
  private useWorker = true;

  // Lista de tablas de worldbuilding (se poblarán dinámicamente)
  private readonly TABLAS_DISPONIBLES = [
    'conceptos',
    'alimentos',
    'tipos_vivienda',
    'estilos_moda',
    'tipos_relaciones',
    'metodos_reproduccion',
    'tipos_muerte',
    'tipos_funerales',
    'festividades',
    'estadisticas_sociales',
    'referencias',
    'precios_referencia',
    'sistemas_corporales',
    'enfermedades',
    'sistema_stats',
    'jerga',
    'ocupaciones',
    'monedas',
    'instituciones_educativas'
  ];

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las tablas de worldbuilding
   */
  getAll(): Observable<Map<string, WorldbuildingTabla>> {
    if (!this.cache$) {
      // Cargar todas las tablas en paralelo
      const requests = this.TABLAS_DISPONIBLES.map(tabla =>
        this.getTabla(tabla).pipe(
          map(data => ({ tabla, data })),
          catchError(error => {
            console.warn(`⚠️ Error cargando tabla ${tabla}:`, error);
            return of({ tabla, data: null });
          })
        )
      );

      this.cache$ = forkJoin(requests).pipe(
        map(resultados => {
          const mapa = new Map<string, WorldbuildingTabla>();
          resultados.forEach(({ tabla, data }) => {
            if (data) {
              mapa.set(tabla, data);
            }
          });
          return mapa;
        }),
        shareReplay(1)
      );
    }

    return this.cache$;
  }

  /**
   * Obtiene una tabla específica de worldbuilding
   * 🔥 MIGRADO: Usa Cloudflare Worker
   */
  getTabla(tabla: string): Observable<WorldbuildingTabla | null> {
    const url = this.useWorker
      ? `${this.WORKER_URL}/worldbuilding/${tabla}`
      : `${this.FALLBACK_URL}/${tabla}.json`;
    
    return this.http.get<WorldbuildingTabla>(url).pipe(
      catchError(error => {
        console.error(`❌ Error cargando tabla ${tabla}:`, error);
        if (this.useWorker) {
          return this.http.get<WorldbuildingTabla>(`${this.FALLBACK_URL}/${tabla}.json`).pipe(
            catchError(() => of(null))
          );
        }
        return of(null);
      })
    );
  }

  /**
   * Obtiene un índice con información de todas las tablas
   */
  getIndex(): Observable<WorldbuildingIndex> {
    return this.getAll().pipe(
      map(mapa => {
        const tablas: { [tabla: string]: any } = {};
        let totalTablas = 0;

        mapa.forEach((data, tabla) => {
          if (data) {
            totalTablas++;
            tablas[tabla] = {
              total: data.metadata.total,
              bloqueado: false, // Se determinará por el JSON
              requiere_capitulo: null // Se determinará por el JSON
            };
          }
        });

        return {
          total_tablas: totalTablas,
          tablas
        };
      })
    );
  }

  /**
   * Busca en todas las tablas por término
   */
  buscar(query: string): Observable<{ tabla: string; dato: WorldbuildingDato }[]> {
    const normalizedQuery = query.toLowerCase().trim();

    return this.getAll().pipe(
      map(mapa => {
        const resultados: { tabla: string; dato: WorldbuildingDato }[] = [];

        mapa.forEach((data, tabla) => {
          if (data && data.datos) {
            data.datos.forEach(dato => {
              // Buscar en todos los valores del objeto
              const valores = Object.values(dato).join(' ').toLowerCase();
              if (valores.includes(normalizedQuery)) {
                resultados.push({ tabla, dato });
              }
            });
          }
        });

        return resultados;
      })
    );
  }

  /**
   * Obtiene datos filtrados de una tabla por campo
   */
  getTablaFiltrada(
    tabla: string,
    campo: string,
    valor: any
  ): Observable<WorldbuildingDato[]> {
    return this.getTabla(tabla).pipe(
      map(data => {
        if (!data || !data.datos) return [];
        return data.datos.filter(dato => dato[campo] === valor);
      })
    );
  }

  /**
   * Invalida el caché (útil si se actualizan los datos)
   */
  clearCache(): void {
    this.cache$ = undefined;
  }
}
