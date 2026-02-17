import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface CountryStats {
  country: string;
  views: number;
  percentage: number;
}

interface LanguageStats {
  language: string;
  views: number;
  percentage: number;
}

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  topPages: Array<{route: string, views: number}>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  topCountries: CountryStats[];
  topLanguages: LanguageStats[];
  dailyViews: any[];
}

@Component({
  selector: 'app-analytics-map',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './analytics-map.component.html',
  styleUrl: './analytics-map.component.css'
})
export class AnalyticsMapComponent implements OnInit {
  // URLs del repo de analytics (ajustar según privado/público)
  private readonly ANALYTICS_BASE = 'https://worker-analytics.trendingghostofficial.workers.dev/api/stats';

  // Datos
  analytics: AnalyticsData | null = null;
  globalStats: any = null; // Stats globales con todos los períodos
  loading = true;
  error = false;

  // Período seleccionado
  selectedPeriod: 'last24h' | 'last7days' | 'last30days' | 'allTime' = 'last24h';

  // Períodos disponibles para el selector
  availablePeriods: Array<{id: 'last24h' | 'last7days' | 'last30days' | 'allTime', translationKey: string, icon: string}> = [
    { id: 'last24h', translationKey: 'analytics.periods.last24h', icon: '⚡' },
    { id: 'last7days', translationKey: 'analytics.periods.last7days', icon: '📈' },
    { id: 'last30days', translationKey: 'analytics.periods.last30days', icon: '📉' },
    { id: 'allTime', translationKey: 'analytics.periods.allTime', icon: '∞' }
  ];  // Country codes to names (ISO 3166-1 alpha-2)
  private countryNames: { [key: string]: string } = {
    'ES': 'España',
    'MX': 'México',
    'US': 'Estados Unidos',
    'AR': 'Argentina',
    'CO': 'Colombia',
    'CL': 'Chile',
    'PE': 'Perú',
    'VE': 'Venezuela',
    'EC': 'Ecuador',
    'GT': 'Guatemala',
    'CU': 'Cuba',
    'BO': 'Bolivia',
    'DO': 'República Dominicana',
    'HN': 'Honduras',
    'PY': 'Paraguay',
    'SV': 'El Salvador',
    'NI': 'Nicaragua',
    'CR': 'Costa Rica',
    'PA': 'Panamá',
    'UY': 'Uruguay',
    'FR': 'Francia',
    'IT': 'Italia',
    'DE': 'Alemania',
    'GB': 'Reino Unido',
    'PT': 'Portugal',
    'BR': 'Brasil',
    'CA': 'Canadá',
    'JP': 'Japón',
    'CN': 'China',
    'KR': 'Corea del Sur',
    'IN': 'India',
    'AU': 'Australia',
    'NZ': 'Nueva Zelanda',
    'RU': 'Rusia',
    'PL': 'Polonia',
    'NL': 'Países Bajos',
    'BE': 'Bélgica',
    'SE': 'Suecia',
    'NO': 'Noruega',
    'DK': 'Dinamarca',
    'FI': 'Finlandia',
    'IE': 'Irlanda',
    'AT': 'Austria',
    'CH': 'Suiza',
    'GR': 'Grecia',
    'CZ': 'República Checa',
    'RO': 'Rumania',
    'HU': 'Hungría',
    'BG': 'Bulgaria',
    'HR': 'Croacia',
    'SK': 'Eslovaquia',
    'SI': 'Eslovenia',
    'LT': 'Lituania',
    'LV': 'Letonia',
    'EE': 'Estonia',
    'IS': 'Islandia',
    'MT': 'Malta',
    'CY': 'Chipre',
    'LU': 'Luxemburgo',
    'Unknown': 'Desconocido'
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #00ff00; font-weight: bold;');
    console.log('%c║          📊 ANALYTICS MAP - TRENDING GHOST                    ║', 'color: #00ff00; font-size: 16px; font-weight: bold;');
    console.log('%c║          Mostrando estadísticas de lectura global             ║', 'color: #00ff00; font-size: 13px;');
    console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #00ff00; font-weight: bold;');

    this.loadAnalytics();
    this.cdr.detectChanges();
  }

  /**
   * Carga datos de analytics desde el repo
   */
  async loadAnalytics(): Promise<void> {
    try {
      this.loading = true;

      // Cargar stats globales (contiene todos los períodos)
      const globalUrl = `${this.ANALYTICS_BASE}/global`;
      const response = await this.http.get<any>(globalUrl).toPromise();

      // Si no hay datos, mostrar estado vacío sin error
      if (!response) {
        console.warn('[Analytics] No data available yet');
        this.analytics = this.getEmptyAnalytics();
        this.globalStats = null;
        this.loading = false;
        this.error = false;
        return;
      }

      // Guardar stats globales
      this.globalStats = response;

      // Extraer período seleccionado
      this.analytics = this.extractPeriodData(response[this.selectedPeriod]);

      this.loading = false;
      this.error = false;
    } catch (err) {
      console.error('[Analytics] Error loading data:', err);
      // Mostrar datos vacíos en lugar de error
      this.analytics = this.getEmptyAnalytics();
      this.globalStats = null;
      this.loading = false;
      this.error = false; // No mostrar error, solo datos vacíos
    }
  }

  /**
   * Extrae y formatea datos de un período específico
   */
  private extractPeriodData(periodStats: any): AnalyticsData {
    if (!periodStats || periodStats.totalViews === 0) {
      return this.getEmptyAnalytics();
    }

    return {
      totalViews: periodStats.totalViews || 0,
      uniqueVisitors: periodStats.uniqueSessions || 0,
      topPages: periodStats.topPages || [],
      deviceBreakdown: periodStats.deviceBreakdown || {
        desktop: 0,
        mobile: 0,
        tablet: 0
      },
      topCountries: periodStats.topCountries || [],
      topLanguages: periodStats.topLanguages || [],
      dailyViews: periodStats.dailyBreakdown || []
    };
  }

  /**
   * Retorna estructura de analytics vacía
   */
  private getEmptyAnalytics(): AnalyticsData {
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      topPages: [],
      deviceBreakdown: {
        desktop: 0,
        mobile: 0,
        tablet: 0
      },
      topCountries: [],
      topLanguages: [],
      dailyViews: []
    };
  }

  /**
   * Cambia el período seleccionado
   */
  changePeriod(period: 'last24h' | 'last7days' | 'last30days' | 'allTime'): void {
    this.selectedPeriod = period;

    // Si ya tenemos globalStats, solo extraer el período
    if (this.globalStats && this.globalStats[period]) {
      this.analytics = this.extractPeriodData(this.globalStats[period]);
    } else {
      // Si no, recargar todo
      this.loadAnalytics();
    }
  }

  /**
   * Formatea número con separadores de miles
   */
  formatNumber(num: number): string {
    return num.toLocaleString('es-ES');
  }

  /**
   * Formatea fecha
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatea fecha corta para gráficos
   */
  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  /**
   * Calcula altura de barra para gráfico
   */
  getBarHeight(views: number): number {
    if (!this.analytics || !this.analytics.dailyViews || this.analytics.dailyViews.length === 0) return 0;

    const maxViews = Math.max(...this.analytics.dailyViews.map(d => d.views));
    if (maxViews === 0) return 0;

    return (views / maxViews) * 100;
  }

  /**
   * Obtiene nombre legible del país
   */
  getCountryName(countryCode: string): string {
    return this.countryNames[countryCode] || countryCode;
  }

  /**
   * Obtiene bandera emoji del país
   */
  getCountryFlag(countryCode: string): string {
    if (countryCode === 'Unknown') return '🌍';
    // Convertir código ISO a emoji (A=🇦, B=🇧, etc.)
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  /**
   * Obtiene nombre del idioma desde código
   */
  getLanguageName(langCode: string): string {
    const languages: {[key: string]: string} = {
      'es': 'Español',
      'es-ES': 'Español (España)',
      'es-MX': 'Español (México)',
      'es-AR': 'Español (Argentina)',
      'en': 'English',
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'pt': 'Português',
      'pt-BR': 'Português (Brasil)',
      'pt-PT': 'Português (Portugal)',
      'fr': 'Français',
      'fr-FR': 'Français (France)',
      'de': 'Deutsch',
      'it': 'Italiano',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文',
      'zh-CN': '中文 (简体)',
      'zh-TW': '中文 (繁體)',
      'ru': 'Русский',
      'ar': 'العربية',
      'hi': 'हिन्दी',
      'unknown': 'Desconocido'
    };
    return languages[langCode] || langCode;
  }

  /**
   * Obtiene icono de dispositivo
   */
  getDeviceIcon(device: string): string {
    switch (device) {
      case 'desktop': return '🖥️';
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      default: return '💻';
    }
  }

  /**
   * Obtiene icono según dispositivo
   */
  private getDeviceTypeIcon(device: string): string {
    switch (device) {
      case 'mobile': return '📱';
      case 'tablet': return '📲';
      case 'desktop': return '🖥️';
      default: return '💻';
    }
  }
}
