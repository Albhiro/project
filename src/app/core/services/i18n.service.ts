import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface TranslationInfo {
  metodo: 'manual' | 'deepl' | 'chatgpt' | 'community' | 'unavailable';
  calidad_score?: number;
  necesita_revision: boolean;
  traducido_por?: string;
  fecha_traduccion?: string;
}

export interface Chapter {
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
  idioma: string;
  idiomas_disponibles: string[];
  traduccion_info?: TranslationInfo;
  desbloquea?: {
    mundo: string[];
    personajes: string[];
    conceptos: string[];
  };
  navegacion?: {
    anterior: any;
    siguiente: any;
  };
}

export interface IdiomaInfo {
  codigo: string;
  nombre_nativo: string;
  nombre_ingles: string;
  emoji: string;
  icono_emoji: string; // Alias para compatibilidad
  activo: boolean; // Estado del idioma
  capitulos_traducidos: number;
  capitulos_totales: number;
  porcentaje: number;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLang$ = new BehaviorSubject<string>('es');
  private idiomasDisponibles$ = new BehaviorSubject<IdiomaInfo[]>([]);

  // 🆕 Cache de traducciones de UI
  private uiTranslations: Record<string, any> = {};
  private translationsLoaded$ = new BehaviorSubject<boolean>(false);

  // Idiomas soportados (15 idiomas totales)
  private readonly SUPPORTED_LANGS = [
    'es',    // 🇪🇸 Español
    'en',    // 🇬🇧 English
    'ja',    // 🇯🇵 日本語
    'pt',    // 🇧🇷 Português
    'fr',    // 🇫🇷 Français
    'de',    // 🇩🇪 Deutsch
    'it',    // 🇮🇹 Italiano
    'ko',    // 🇰🇷 한국어
    'zh-CN', // 🇨🇳 简体中文
    'zh-TW', // 🇹🇼 繁體中文
    'ru',    // 🇷🇺 Русский
    'pl',    // 🇵🇱 Polski
    'tr',    // 🇹🇷 Türkçe
    'hi',    // 🇮🇳 हिन्दी
    'ar'     // 🇸🇦 العربية
  ];

  // Base URL para JSONs (ajustar según entorno)
  private readonly DATA_BASE_URL = 'https://raw.githubusercontent.com/trendingghostofficial/trending-ghost-data/main';

  constructor(
    private http: HttpClient
  ) {
    this.detectLanguage();
    this.loadIdiomasDisponibles();
    this.loadUITranslations(this.getCurrentLanguageSync()); // 🆕 Cargar traducciones al inicio
  }

  /**
   * Detecta el idioma preferido del usuario
   * Prioridad: URL param > localStorage > navegador > español
   */
  private detectLanguage(): void {
    // 1. URL param (?lang=en)
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && this.SUPPORTED_LANGS.includes(urlLang)) {
      this.setLanguage(urlLang);
      return;
    }

    // 2. localStorage (preferencia guardada)
    const savedLang = localStorage.getItem('preferred_lang');
    if (savedLang && this.SUPPORTED_LANGS.includes(savedLang)) {
      this.setLanguage(savedLang);
      return;
    }

    // 3. Navegador
    const browserLang = navigator.language.split('-')[0]; // 'en-US' → 'en'
    if (this.SUPPORTED_LANGS.includes(browserLang)) {
      this.setLanguage(browserLang);
      return;
    }

    // 4. Fallback a español
    this.setLanguage('es');
  }

  /**
   * Establece el idioma actual
   */
  setLanguage(lang: string): void {
    if (!this.SUPPORTED_LANGS.includes(lang)) {
      console.warn(`[i18n] Idioma no soportado: ${lang}, usando 'es'`);
      lang = 'es';
    }

    console.log(`[i18n] 🔄 Cambiando idioma a: ${lang}`);
    this.currentLang$.next(lang);
    localStorage.setItem('preferred_lang', lang);

    // 🆕 Cargar traducciones de UI del nuevo idioma
    this.loadUITranslations(lang);

    // Actualizar URL param (sin recargar página)
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url.toString());

    console.log(`[i18n] ✅ Idioma actualizado: ${lang}, URL: ${url.toString()}`);
  }

  /**
   * Obtiene el idioma actual como Observable
   */
  getCurrentLanguage(): Observable<string> {
    return this.currentLang$.asObservable();
  }

  /**
   * Obtiene el idioma actual (sync)
   */
  getCurrentLanguageSync(): string {
    return this.currentLang$.value;
  }

  /**
   * Carga información de idiomas disponibles desde archivo local
   */
  private loadIdiomasDisponibles(): void {
    const url = `assets/i18n/idiomas.json`;
    console.log(`[i18n] 📂 Cargando idiomas disponibles desde: ${url}`);

    this.http.get<any>(url)
      .pipe(
        map(data => {
          console.log('[i18n] 📦 Datos de idiomas.json recibidos:', data);
          // 🆕 FILTRAR SOLO IDIOMAS ACTIVOS
          const todosLosIdiomas = data.idiomas || [];
          const idiomasActivos = todosLosIdiomas.filter((idioma: IdiomaInfo) => idioma.activo === true);
          console.log(`[i18n] ✅ Idiomas activos filtrados: ${idiomasActivos.length} de ${todosLosIdiomas.length}`);
          return idiomasActivos;
        }),
        catchError(error => {
          console.error('[i18n] ❌ Error cargando idiomas:', error);
          // Fallback: idiomas hardcodeados (TODOS activos)
          return of([
            { codigo: 'es', nombre_nativo: 'Español', nombre_ingles: 'Spanish', emoji: '🇪🇸', icono_emoji: '🇪🇸', activo: true, es_original: true, capitulos_traducidos: 0, capitulos_totales: 0, porcentaje: 100 },
            { codigo: 'en', nombre_nativo: 'English', nombre_ingles: 'English', emoji: '🇬🇧', icono_emoji: '🇬🇧', activo: true, es_original: false, capitulos_traducidos: 0, capitulos_totales: 0, porcentaje: 0 },
            { codigo: 'ja', nombre_nativo: '日本語', nombre_ingles: 'Japanese', emoji: '🇯🇵', icono_emoji: '🇯🇵', activo: true, es_original: false, capitulos_traducidos: 0, capitulos_totales: 0, porcentaje: 0 },
            { codigo: 'pt', nombre_nativo: 'Português', nombre_ingles: 'Portuguese', emoji: '🇧🇷', icono_emoji: '🇧🇷', activo: true, es_original: false, capitulos_traducidos: 0, capitulos_totales: 0, porcentaje: 0 },
            { codigo: 'fr', nombre_nativo: 'Français', nombre_ingles: 'French', emoji: '🇫🇷', icono_emoji: '🇫🇷', activo: true, es_original: false, capitulos_traducidos: 0, capitulos_totales: 0, porcentaje: 0 }
          ]);
        })
      )
      .subscribe(idiomas => {
        console.log('[i18n] ✅ Idiomas disponibles cargados:', idiomas);
        this.idiomasDisponibles$.next(idiomas);
      });
  }

  /**
   * Obtiene lista de idiomas disponibles
   */
  getIdiomasDisponibles(): Observable<IdiomaInfo[]> {
    return this.idiomasDisponibles$.asObservable();
  }

  /**
   * Carga un capítulo en el idioma especificado con fallback automático
   *
   * Orden de fallback:
   * 1. Idioma solicitado (ej: v1-c1.en.json)
   * 2. Inglés (si no es el solicitado)
   * 3. Español (original)
   */
  loadChapter(slug: string, lang?: string): Observable<Chapter> {
    const targetLang = lang || this.getCurrentLanguageSync();

    return this.tryLoadChapter(slug, targetLang).pipe(
      catchError(error => {
        console.warn(`[i18n] Capítulo no disponible en ${targetLang}, intentando fallback`);

        // Fallback a inglés si no es el idioma solicitado
        if (targetLang !== 'en') {
          return this.tryLoadChapter(slug, 'en').pipe(
            catchError(() => {
              // Fallback final a español
              return this.tryLoadChapter(slug, 'es');
            })
          );
        }

        // Si ya intentó inglés, fallback directo a español
        return this.tryLoadChapter(slug, 'es');
      })
    );
  }

  /**
   * Intenta cargar un capítulo en un idioma específico
   */
  private tryLoadChapter(slug: string, lang: string): Observable<Chapter> {
    const filename = lang === 'es'
      ? `${slug}.json`
      : `${slug}.${lang}.json`;

    const url = `${this.DATA_BASE_URL}/capitulos/${filename}`;

    return this.http.get<Chapter>(url).pipe(
      map(chapter => {
        // Asegurar que el idioma esté establecido
        chapter.idioma = lang;
        return chapter;
      })
    );
  }

  /**
   * Verifica si un idioma está disponible para un capítulo
   */
  isLanguageAvailable(chapter: Chapter, lang: string): boolean {
    return chapter.idiomas_disponibles?.includes(lang) || false;
  }

  /**
   * Obtiene el nombre nativo de un idioma
   */
  getLanguageName(lang: string): string {
    const idiomas = this.idiomasDisponibles$.value;
    const idioma = idiomas.find(i => i.codigo === lang);
    return idioma?.nombre_nativo || lang.toUpperCase();
  }

  /**
   * Obtiene el emoji de un idioma
   */
  getLanguageEmoji(lang: string): string {
    const idiomas = this.idiomasDisponibles$.value;
    const idioma = idiomas.find(i => i.codigo === lang);
    return idioma?.emoji || '🌐';
  }

  /**
   * Verifica si una traducción necesita revisión
   */
  needsReview(chapter: Chapter): boolean {
    return chapter.traduccion_info?.necesita_revision || false;
  }

  /**
   * Obtiene el método de traducción usado
   */
  getTranslationMethod(chapter: Chapter): string {
    const metodo = chapter.traduccion_info?.metodo;

    const metodos: Record<string, string> = {
      'manual': 'Traducción manual',
      'deepl': 'Traducido con DeepL',
      'chatgpt': 'Traducido con ChatGPT',
      'community': 'Traducción comunitaria',
      'unavailable': 'Traducción no disponible'
    };

    return metodos[metodo || 'unavailable'] || 'Traducción automática';
  }

  // ========================================================================
  // 🆕 MÉTODOS DE TRADUCCIÓN DE UI (Interfaz)
  // ========================================================================

  /**
   * Carga las traducciones de UI desde assets/i18n/{lang}.json
   *
   * @param lang - Código de idioma (es, en, ja, pt, fr)
   */
  private loadUITranslations(lang: string): void {
    // Usar ruta relativa para assets
    const path = `assets/i18n/${lang}.json`;
    console.log(`[i18n] 📂 Cargando traducciones UI desde: ${path}`);

    this.http.get<any>(path)
      .pipe(
        catchError(error => {
          console.error(`[i18n] ❌ Error cargando traducciones UI para ${lang}:`, error);
          // Fallback a español si falla
          if (lang !== 'es') {
            console.log(`[i18n] 🔄 Fallback a español...`);
            return this.http.get<any>('assets/i18n/es.json');
          }
          return of({});
        })
      )
      .subscribe(translations => {
        this.uiTranslations = translations;
        this.translationsLoaded$.next(true);
        console.log(`[i18n] ✅ Traducciones de UI cargadas: ${lang}`, Object.keys(translations).length, 'claves');
      });
  }

  /**
   * Obtiene una traducción de UI por su key
   *
   * @param key - Clave de traducción (ej: 'translation.feedback.title')
   * @returns Texto traducido o la key si no se encuentra
   *
   * EJEMPLOS:
   * getTranslation('common.loading')         → "Cargando..." (es) / "Loading..." (en)
   * getTranslation('nav.home')               → "Inicio" (es) / "Home" (en)
   * getTranslation('translation.feedback.title') → "Sugerir traducción" (es) / "Suggest translation" (en)
   */
  getTranslation(key: string): string {
    if (!this.translationsLoaded$.value) {
      console.warn('[i18n] Traducciones aún no cargadas, retornando key');
      return key;
    }

    // Navegar por el objeto usando la key con puntos
    const keys = key.split('.');
    let value: any = this.uiTranslations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`[i18n] Traducción no encontrada: ${key}`);
        return key; // Retornar key para debugging
      }
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * Verifica si las traducciones de UI están cargadas
   */
  areTranslationsLoaded(): boolean {
    return this.translationsLoaded$.value;
  }

  /**
   * Observable para saber cuándo las traducciones están listas
   */
  onTranslationsLoaded(): Observable<boolean> {
    return this.translationsLoaded$.asObservable();
  }
}
