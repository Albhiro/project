import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, shareReplay, catchError, switchMap } from 'rxjs/operators';

export interface ItemEnemigoDrop {
  nombre: string;
  tier: string;
  tipo: string;
  probabilidad: number;
}

export interface Item {
  id: number;
  nombre: string;
  slug: string;
  tipo: string;
  rareza: string;
  tier: string;
  descripcion_breve: string;
  descripcion_completa: string;
  lore: string;
  stats_base: string;
  efectos_especiales: string;
  requisitos_uso: string;
  stackeable: boolean;
  stack_maximo: number;
  peso: number;
  valor_venta: number;
  valor_compra: number;
  durabilidad: number;
  recargable: boolean;
  municion_tipo: string;
  municion_capacidad: number;
  crafteable: boolean;
  materiales_crafteo: string;
  tiempo_crafteo: number;
  upgradeable: boolean;
  path_upgrade: string;
  max_nivel_upgrade: number;
  slotteable: boolean;
  slots_disponibles: number;
  tipo_slots: string;
  apariencia_visual: string;
  color_rareza: string;
  icono_inventario: string;
  modelo_3d: string;
  efectos_visuales: string;
  sonidos: string;
  animaciones: string;
  trivia: string;
  easter_eggs: string;
  referencias: string;
  nombre_autor: string;
  inspiracion: string;
  fecha_creacion: string;
  actualizaciones_balance: string;
  dropea_de_enemigos: ItemEnemigoDrop[];
}

export interface ItemsIndex {
  total: number;
  por_tipo: {
    [tipo: string]: number;
  };
  por_rareza: {
    [rareza: string]: number;
  };
  por_tier: {
    [tier: string]: number;
  };
  items: Item[];
}

@Injectable({
  providedIn: 'root'
})
export class ItemsDataService {
  // 🔥 MIGRADO A CLOUDFLARE WORKER
  private readonly WORKER_URL = 'https://worker-data.trendingghostofficial.workers.dev/api/data';
  private readonly FALLBACK_URL = '/data/items';
  private cache$?: Observable<Item[]>;
  private useWorker = true;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los items cargando desde el índice dinámico
   * 🔥 MIGRADO: Usa Cloudflare Worker
   */
  getAll(): Observable<Item[]> {
    if (!this.cache$) {
      const indexUrl = this.useWorker
        ? `${this.WORKER_URL}/items/index`
        : `${this.FALLBACK_URL}/index.json`;
      
      this.cache$ = this.http.get<{items: string[]}>(indexUrl).pipe(
        catchError((error) => {
          console.warn('⚠️ No hay índice de items, lista vacía hasta que se publiquen capítulos');
          return of({ items: [] });
        }),
        switchMap((index: {items: string[]}) => {
          if (!index.items || index.items.length === 0) {
            return of([]);
          }

          const requests = index.items.map(slug =>
            this.getBySlug(slug).pipe(
              catchError(error => {
                console.warn(`⚠️ Error cargando item ${slug}:`, error);
                return of(null);
              })
            )
          );

          return forkJoin(requests).pipe(
            map(items => items.filter((i): i is Item => i !== null))
          );
        }),
        shareReplay(1)
      );
    }

    return this.cache$;
  }

  /**
   * Obtiene un item por su slug
   * 🔥 MIGRADO: Usa Cloudflare Worker
   */
  getBySlug(slug: string): Observable<Item | null> {
    const url = this.useWorker
      ? `${this.WORKER_URL}/items/${slug}`
      : `${this.FALLBACK_URL}/${slug}.json`;
    
    return this.http.get<Item>(url).pipe(
      catchError(error => {
        console.error(`❌ Error cargando item ${slug}:`, error);
        if (this.useWorker) {
          return this.http.get<Item>(`${this.FALLBACK_URL}/${slug}.json`).pipe(
            catchError(() => of(null))
          );
        }
        return of(null);
      })
    );
  }

  /**
   * Obtiene items filtrados por tipo
   */
  getByTipo(tipo: string): Observable<Item[]> {
    return this.getAll().pipe(
      map(items => items.filter(i => i.tipo === tipo))
    );
  }

  /**
   * Obtiene items filtrados por rareza
   */
  getByRareza(rareza: string): Observable<Item[]> {
    return this.getAll().pipe(
      map(items => items.filter(i => i.rareza === rareza))
    );
  }

  /**
   * Obtiene items filtrados por tier
   */
  getByTier(tier: string): Observable<Item[]> {
    return this.getAll().pipe(
      map(items => items.filter(i => i.tier === tier))
    );
  }

  /**
   * Obtiene items crafteables
   */
  getCrafteables(): Observable<Item[]> {
    return this.getAll().pipe(
      map(items => items.filter(i => i.crafteable))
    );
  }

  /**
   * Obtiene items upgradeables
   */
  getUpgradeables(): Observable<Item[]> {
    return this.getAll().pipe(
      map(items => items.filter(i => i.upgradeable))
    );
  }

  /**
   * Obtiene un índice con totales por tipo, rareza y tier
   */
  getIndex(): Observable<ItemsIndex> {
    return this.getAll().pipe(
      map(items => {
        // Contar por tipo
        const porTipo: { [tipo: string]: number } = {};
        items.forEach(i => {
          porTipo[i.tipo] = (porTipo[i.tipo] || 0) + 1;
        });

        // Contar por rareza
        const porRareza: { [rareza: string]: number } = {};
        items.forEach(i => {
          porRareza[i.rareza] = (porRareza[i.rareza] || 0) + 1;
        });

        // Contar por tier
        const porTier: { [tier: string]: number } = {};
        items.forEach(i => {
          porTier[i.tier] = (porTier[i.tier] || 0) + 1;
        });

        return {
          total: items.length,
          por_tipo: porTipo,
          por_rareza: porRareza,
          por_tier: porTier,
          items
        };
      })
    );
  }

  /**
   * Busca items por nombre (case-insensitive)
   */
  buscar(query: string): Observable<Item[]> {
    const normalizedQuery = query.toLowerCase().trim();

    return this.getAll().pipe(
      map(items =>
        items.filter(i =>
          i.nombre.toLowerCase().includes(normalizedQuery) ||
          i.descripcion_breve?.toLowerCase().includes(normalizedQuery)
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
