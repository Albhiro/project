import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { Subscription } from 'rxjs';

/**
 * 🌐 PIPE DE TRADUCCIÓN - TRENDING GHOST
 *
 * Pipe para acceder a las traducciones de UI desde templates
 *
 * USO:
 * {{ 'translation.feedback.title' | translate }}
 * {{ 'common.loading' | translate }}
 * {{ 'nav.home' | translate }}
 *
 * ESTRUCTURA DE KEYS:
 * - common.*       → Textos comunes (loading, error, success, etc.)
 * - nav.*          → Navegación (home, chapters, characters, etc.)
 * - reader.*       → Lector de capítulos (controls, navigation)
 * - translation.*  → Sistema de traducción (feedback modal, warnings)
 * - chapters.*     → Lista de capítulos (volume, chapter, published)
 * - characters.*   → Sección de personajes (faction, power, bio)
 * - world.*        → Sección de mundo (lore, locations, timeline)
 * - footer.*       → Footer del sitio (copyright, social, support)
 *
 * FALLBACK:
 * Si no encuentra la traducción, devuelve la key original para debugging
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Impure para reaccionar a cambios de idioma en tiempo real
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private lastLang: string = '';
  private langSubscription?: Subscription;
  private translationsSubscription?: Subscription;

  constructor(
    private i18n: I18nService,
    private cdr: ChangeDetectorRef
  ) {
    // Suscribirse a cambios de idioma para forzar actualización
    this.langSubscription = this.i18n.getCurrentLanguage().subscribe(lang => {
      if (this.lastLang !== lang) {
        this.lastLang = lang;
        this.cdr.markForCheck(); // Forzar actualización del template
      }
    });

    // Suscribirse a cuando las traducciones se cargan
    this.translationsSubscription = this.i18n.onTranslationsLoaded().subscribe(loaded => {
      if (loaded) {
        this.cdr.markForCheck(); // Forzar actualización cuando se cargan
      }
    });
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
    this.translationsSubscription?.unsubscribe();
  }

  /**
   * Transforma una key de traducción en el texto traducido
   *
   * @param key - Clave de traducción (ej: 'translation.feedback.title')
   * @param params - Parámetros opcionales para interpolación {nombre: 'valor'}
   * @returns Texto traducido o la key si no se encuentra
   *
   * EJEMPLOS:
   *
   * Básico:
   * {{ 'common.loading' | translate }}
   * → "Cargando..." (es) / "Loading..." (en)
   *
   * Con parámetros (futuro):
   * {{ 'reader.reading_time' | translate: {minutes: 5} }}
   * → "5 min de lectura" (es) / "5 min read" (en)
   */
  transform(key: string, params?: Record<string, any>): string {
    // Obtener la traducción del servicio
    let translation = this.i18n.getTranslation(key);

    // Si se proporcionan parámetros, interpolar valores
    if (params && translation) {
      Object.keys(params).forEach(paramKey => {
        const regex = new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g');
        translation = translation.replace(regex, params[paramKey]);
      });
    }

    return translation;
  }
}
