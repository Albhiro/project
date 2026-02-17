import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface AnalyticsEvent {
  timestamp: string;
  sessionId: string; // Session fingerprint (sin cookies)
  route: string;
  country: string | null;
  referrer: string;
  device: 'desktop' | 'mobile' | 'tablet';
  language: string; // Idioma del navegador
  screenSize: string; // Resolución de pantalla (categoría)
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  // Cloudflare Worker URL (sin tokens expuestos)
  private readonly ANALYTICS_WORKER = 'https://worker-analytics.trendingghostofficial.workers.dev/api/analytics';
  private country: string | null = null;
  private sessionId: string = '';
  private isEnabled = environment.analytics.enabled;

  constructor(private router: Router) {
    this.initSession();
    this.detectCountry();
    this.trackNavigation();
  }

  /**
   * Inicializa sessionId usando sessionStorage (solo durante sesión actual)
   * No persiste entre sesiones → 0% tracking persistente
   */
  private initSession(): void {
    // Buscar sessionId existente (solo en esta sesión del navegador)
    let sessionId = sessionStorage.getItem('tg_session');

    if (!sessionId) {
      // Generar nuevo sessionId basado en timestamp + random
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('tg_session', sessionId);
    }

    this.sessionId = sessionId;
  }

  /**
   * Detecta el país del usuario usando API gratuita de IP geolocation
   * Sin guardar IP, solo país ISO code
   */
  private async detectCountry(): Promise<void> {
    try {
      // Opción 1: ipapi.co (gratis, 1000 requests/día)
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      this.country = data.country_code || null; // Ej: "ES", "US", "MX"
    } catch (error) {
      console.warn('[Analytics] No se pudo detectar país:', error);
      this.country = null;
    }
  }

  /**
   * Detecta idioma del navegador
   */
  private getLanguage(): string {
    return navigator.language || 'unknown';
  }

  /**
   * Detecta categoría de resolución de pantalla (sin datos exactos)
   */
  private getScreenSize(): string {
    const width = window.screen.width;
    if (width < 768) return 'small';   // Mobile
    if (width < 1024) return 'medium'; // Tablet
    if (width < 1920) return 'large';  // Desktop HD
    return 'xlarge'; // 4K+
  }

  /**
   * Detecta tipo de dispositivo
   */
  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Escucha cambios de ruta y registra cada navegación
   */
  private trackNavigation(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.logPageView(event.urlAfterRedirects);
      });
  }

  /**
   * Registra una vista de página
   */
  private async logPageView(route: string): Promise<void> {
    if (!this.isEnabled) {
      return; // Skip si analytics deshabilitado
    }

    const event: AnalyticsEvent = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      route: route,
      country: this.country,
      referrer: document.referrer || 'direct',
      device: this.getDeviceType(),
      language: this.getLanguage(),
      screenSize: this.getScreenSize()
    };

    try {
      await this.sendToWorker(event);
    } catch (error) {
      console.warn('[Analytics] Error al enviar evento:', error);
    }
  }

  /**
   * Envía el evento al Worker de Cloudflare
   * El Worker hace el POST a GitHub (tokens ocultos)
   */
  private async sendToWorker(event: AnalyticsEvent): Promise<void> {
    try {
      const response = await fetch(this.ANALYTICS_WORKER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        console.warn('[Analytics] Worker response:', response.status);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Desactiva analytics (respeta user preference)
   */
  public disable(): void {
    this.isEnabled = false;
    localStorage.setItem('tg_analytics_disabled', 'true');
  }

  /**
   * Reactiva analytics
   */
  public enable(): void {
    this.isEnabled = true;
    localStorage.removeItem('tg_analytics_disabled');
  }

  /**
   * Check si analytics está habilitado
   */
  public isAnalyticsEnabled(): boolean {
    return this.isEnabled && localStorage.getItem('tg_analytics_disabled') !== 'true';
  }
}
