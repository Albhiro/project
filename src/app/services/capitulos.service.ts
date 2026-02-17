import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface CapituloMetadata {
  numero: number;
  volumen: number;
  titulo: string;
  sinopsis: string;
  fechaPublicacion: string;
  palabras: number;
  duracionLectura: number;
  tags: string[];
  advertencias: string[];
  publicado: boolean;
  destacado?: boolean;
}

export interface CapituloCompleto {
  volumen: number;
  numero: number;
  titulo: string;
  sinopsis: string;
  fechaPublicacion: string;
  palabras: number;
  duracionLectura: number;
  tags: string[];
  advertencias: string[];
  contenido: string;
  navegacion: {
    anterior: { volumen: number; numero: number } | null;
    siguiente: { volumen: number; numero: number } | null;
  };
  extras?: {
    notasAutor?: string;
    curiosidades?: string[];
  };
}

export interface IndiceCapitulos {
  version: string;
  ultimoCapitulo: {
    volumen: number;
    numero: number;
    fechaPublicacion: string;
  };
  estadisticas: {
    totalVolumenes: number;
    totalCapitulos: number;
    palabrasTotales: number;
  };
  capitulos: CapituloMetadata[];
  metadata: {
    repoVersion: string;
    ultimaActualizacion: string;
    avisos: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class CapitulosService {
  private readonly STORAGE_KEY_PREFIX = 'trendingghost_cap_';
  private readonly STORAGE_KEY_INDEX = 'trendingghost_index';
  
  // Capítulos en el mismo repo de GitHub Pages
  // Ruta relativa desde el dominio de la app
  // Producción: https://tu-usuario.github.io/TRENDING-GHOST/capitulos/
  // Desarrollo: http://localhost:4200/capitulos/
  private readonly CAPITULOS_BASE_URL = '/capitulos';

  private indiceCache: IndiceCapitulos | null = null;

  constructor() {}

  /**
   * Carga el índice maestro desde GitHub (con caché)
   * Este es el "endpoint" principal que consulta primero
   */
  getIndice(): Observable<IndiceCapitulos | null> {
    // 1. Si ya está en memoria, devolverlo
    if (this.indiceCache) {
      console.log('%c📋 Índice cargado desde MEMORIA', 'color: #00ff00; font-weight: bold;');
      return of(this.indiceCache);
    }

    // 2. Intentar desde localStorage
    const cached = localStorage.getItem(this.STORAGE_KEY_INDEX);
    if (cached) {
      try {
        this.indiceCache = JSON.parse(cached);
        console.log('%c📦 Índice cargado desde CACHÉ LOCAL', 'color: #00ff00; font-weight: bold;');
        return of(this.indiceCache);
      } catch (e) {
        console.warn('Caché de índice corrupta, descargando...');
      }
    }

    // 3. Descargar desde GitHub
    console.log('%c🌐 Descargando ÍNDICE desde GitHub...', 'color: #00ccff; font-weight: bold;');
    const url = `${this.CAPITULOS_BASE_URL}/index.json`;

    return from(this.fetchWithAuth(url)).pipe(
      map(response => {
        this.indiceCache = response as IndiceCapitulos;
        localStorage.setItem(this.STORAGE_KEY_INDEX, JSON.stringify(this.indiceCache));
        console.log('%c✓ Índice descargado y CACHEADO', 'color: #00ff00; font-weight: bold;');
        return this.indiceCache;
      }),
      catchError(error => {
        console.error('%c❌ Error descargando índice', 'color: #ff0000; font-weight: bold;', error);
        return of(null);
      })
    );
  }

  /**
   * Obtiene los metadatos de un capítulo desde el índice
   */
  getMetadata(volumen: number, numero: number): Observable<CapituloMetadata | null> {
    return this.getIndice().pipe(
      map(indice => {
        if (!indice) return null;
        return indice.capitulos.find(
          c => c.volumen === volumen && c.numero === numero
        ) || null;
      })
    );
  }

  /**
   * Obtiene todos los metadatos desde el índice
   */
  getAllMetadata(): Observable<CapituloMetadata[]> {
    return this.getIndice().pipe(
      map(indice => indice?.capitulos || [])
    );
  }

  /**
   * Carga el contenido completo de un capítulo
   * 1. Busca en localStorage (caché)
   * 2. Si no está, descarga el JSON del capítulo desde GitHub
   * 3. Lo guarda en caché
   */
  getCapitulo(volumen: number, numero: number): Observable<CapituloCompleto | null> {
    const key = `v${volumen}-c${numero}`;
    
    // 1. Intentar desde caché
    const cached = localStorage.getItem(this.STORAGE_KEY_PREFIX + key);
    if (cached) {
      try {
        const capitulo = JSON.parse(cached) as CapituloCompleto;
        console.log(`%c📦 Capítulo ${key} cargado desde CACHÉ`, 'color: #00ff00; font-weight: bold;');
        
        // Procesar markdown a HTML
        return of({
          ...capitulo,
          contenido: this.procesarMarkdown(capitulo.contenido)
        });
      } catch (e) {
        console.warn(`Caché del capítulo ${key} corrupta, descargando...`);
      }
    }

    // 2. Descargar desde GitHub
    console.log(`%c🌐 Capítulo ${key} NO en caché, descargando desde GITHUB...`, 'color: #00ccff; font-weight: bold;');
    const url = `${this.CAPITULOS_BASE_URL}/${key}.json`;

    return from(this.fetchWithAuth(url)).pipe(
      map(data => {
        const capitulo = data as CapituloCompleto;
        
        // Guardar en caché (con contenido markdown original)
        localStorage.setItem(this.STORAGE_KEY_PREFIX + key, JSON.stringify(capitulo));
        console.log(`%c✓ Capítulo ${key} descargado y CACHEADO`, 'color: #00ff00; font-weight: bold;');
        
        // Devolver con contenido procesado a HTML
        return {
          ...capitulo,
          contenido: this.procesarMarkdown(capitulo.contenido)
        };
      }),
      catchError(error => {
        console.error(`%c❌ Capítulo ${key} NO ENCONTRADO en GitHub`, 'color: #ff0000; font-weight: bold;', error.message);
        console.log(`%c💡 URL intentada: ${url}`, 'color: #ffaa00;');
        return of(null);
      })
    );
  }

  /**
   * Fetch sin autenticación (repo público)
   */
  private async fetchWithAuth(url: string): Promise<any> {
    const headers: HeadersInit = {
      'Accept': 'application/json'
    };

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Convierte Markdown a HTML (básico)
   */
  private procesarMarkdown(markdown: string): string {
    return markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      
      // Inline code
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      
      // Horizontal rules
      .replace(/^---$/gim, '<hr>')
      
      // Line breaks
      .replace(/\n/g, '<br>')
      
      // Paragraphs
      .split('<br><br>')
      .map(para => {
        para = para.trim();
        if (para.startsWith('<h') || para.startsWith('<hr') || para.startsWith('<pre')) {
          return para;
        }
        return para ? `<p>${para}</p>` : '';
      })
      .join('\n');
  }

  /**
   * Limpia la caché de un capítulo específico (forzar re-descarga)
   */
  limpiarCache(volumen: number, numero: number): void {
    const key = `v${volumen}-c${numero}`;
    localStorage.removeItem(this.STORAGE_KEY_PREFIX + key);
    console.log(`%c🗑️ Caché del capítulo ${key} limpiada`, 'color: #ff9900; font-weight: bold;');
  }

  /**
   * Limpia toda la caché (índice + todos los capítulos)
   */
  limpiarTodaCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_KEY_PREFIX) || key === this.STORAGE_KEY_INDEX) {
        localStorage.removeItem(key);
      }
    });
    this.indiceCache = null;
    console.log('%c🗑️ Toda la caché limpiada', 'color: #ff9900; font-weight: bold;');
  }

  /**
   * Fuerza la recarga del índice (útil para actualizaciones)
   */
  recargarIndice(): Observable<IndiceCapitulos | null> {
    localStorage.removeItem(this.STORAGE_KEY_INDEX);
    this.indiceCache = null;
    return this.getIndice();
  }

  /**
   * Verifica si existe un capítulo anterior
   */
  hasAnterior(capitulo: CapituloCompleto): boolean {
    return capitulo.navegacion.anterior !== null;
  }

  /**
   * Verifica si existe un capítulo siguiente
   */
  hasSiguiente(capitulo: CapituloCompleto): boolean {
    return capitulo.navegacion.siguiente !== null;
  }
}
