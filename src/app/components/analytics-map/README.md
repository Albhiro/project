# 📊 Analytics Map Component

Componente Angular standalone que muestra estadísticas globales de lectura de TRENDING GHOST.

## 🎯 Propósito

Visualizar en tiempo real:
- **Países donde se lee TRENDING GHOST** (mapa interactivo con flags)
- **Capítulos más leídos** (ranking con barras de progreso)
- **Dispositivos usados** (Desktop / Mobile / Tablet)
- **Estadísticas generales** (views totales, países únicos, etc.)

## 📦 Estructura

```
analytics-map/
├── analytics-map.component.ts     # Lógica (fetch stats, agregación)
├── analytics-map.component.html   # Template (mapa, listas, cards)
└── analytics-map.component.css    # Estilos (cyberpunk theme)
```

## 🔌 Uso

### Importar en Página Sobre

```typescript
import { AnalyticsMapComponent } from '../../components/analytics-map/analytics-map.component';

@Component({
  imports: [AnalyticsMapComponent],
  // ...
})
```

### Usar en Template

```html
<app-analytics-map></app-analytics-map>
```

## 📡 Fuente de Datos

### URL Base
```typescript
private readonly ANALYTICS_BASE = 'https://raw.githubusercontent.com/trendingghostofficial/trending-ghost-analytics/main';
```

### Archivo Consumido
```
/stats/daily.json
```

### Formato de Datos

```json
[
  {
    "date": "2026-02-12",
    "totalViews": 1250,
    "uniqueCountries": 12,
    "byCountry": [
      { "country": "ES", "count": 450, "routes": [...] },
      { "country": "MX", "count": 320, "routes": [...] }
    ],
    "byRoute": [
      { "route": "/leer/cap-1", "count": 280, "countries": [...] },
      { "route": "/leer/cap-2", "count": 195, "countries": [...] }
    ],
    "byDevice": {
      "desktop": 800,
      "mobile": 400,
      "tablet": 50
    },
    "generatedAt": "2026-02-12T12:00:00Z"
  }
]
```

## ⚙️ Funcionalidades

### 1. Selector de Período

```html
<button (click)="changePeriod('24h')">Últimas 24h</button>
<button (click)="changePeriod('7d')">7 días</button>
<button (click)="changePeriod('30d')">30 días</button>
<button (click)="changePeriod('all')">Todo el tiempo</button>
```

Filtra datos por rango temporal.

### 2. Lista de Países

```html
<div class="country-item" *ngFor="let country of analytics.topCountries">
  <div class="country-flag">{{ getCountryFlag(country.country) }}</div>
  <div class="country-name">{{ country.countryName }}</div>
  <div class="country-stats">
    <div class="country-views">{{ formatNumber(country.count) }} views</div>
    <div class="country-bar">
      <div class="country-bar-fill" [style.width.%]="country.percentage"></div>
    </div>
    <div class="country-percentage">{{ country.percentage.toFixed(1) }}%</div>
  </div>
</div>
```

Renderiza top 15 países con:
- **Flag emoji** (ISO code → Unicode flag)
- **Nombre del país** (traducido al español)
- **Número de views** (con separadores de miles)
- **Barra de progreso** (porcentaje relativo)

### 3. Top Capítulos

```html
<div class="route-item" *ngFor="let route of analytics.topRoutes">
  <div class="route-rank">#{{ i + 1 }}</div>
  <div class="route-path">{{ route.route }}</div>
  <div class="route-views">{{ formatNumber(route.count) }} lecturas</div>
  <div class="route-bar">
    <div class="route-bar-fill" [style.width.%]="percentage"></div>
  </div>
</div>
```

Top 10 rutas más visitadas.

### 4. Dispositivos

```html
<div class="device-card">
  <div class="device-icon">🖥️</div>
  <div class="device-label">Desktop</div>
  <div class="device-count">{{ formatNumber(analytics.byDevice.desktop) }}</div>
  <div class="device-percentage">{{ percentage }}%</div>
</div>
```

Distribución de dispositivos con iconos.

## 🎨 Estilos

### Variables CSS

```css
--green-intense: #00ff00;
--green-medium: #00cc00;
--green-low: #009900;
--dark-bg: #0a0a0f;
--dark-panel: #1a1a2e;
```

### Efectos

- **Hover animations** en todos los items
- **Glow effects** en títulos y valores
- **Progress bars** con gradientes
- **Responsive grid** para mobile

## 🔧 Métodos Principales

### `loadAnalytics()`
Fetch de datos desde GitHub raw URL.

```typescript
async loadAnalytics(): Promise<void> {
  const dailyUrl = `${this.ANALYTICS_BASE}/stats/daily.json`;
  const response = await this.http.get<any[]>(dailyUrl).toPromise();
  const filtered = this.filterByPeriod(response);
  this.analytics = this.aggregateData(filtered);
}
```

### `filterByPeriod(data)`
Filtra array de días por rango temporal.

```typescript
private filterByPeriod(data: any[]): any[] {
  const cutoffDate = new Date();
  switch (this.selectedPeriod) {
    case '24h': cutoffDate.setDate(cutoffDate.getDate() - 1); break;
    case '7d': cutoffDate.setDate(cutoffDate.getDate() - 7); break;
    case '30d': cutoffDate.setDate(cutoffDate.getDate() - 30); break;
  }
  return data.filter(day => new Date(day.date) >= cutoffDate);
}
```

### `aggregateData(days)`
Suma datos de múltiples días en un único objeto agregado.

```typescript
private aggregateData(days: any[]): AnalyticsData {
  let totalViews = 0;
  const countriesMap = new Map<string, number>();
  const routesMap = new Map<string, number>();
  
  days.forEach(day => {
    totalViews += day.totalViews;
    day.byCountry.forEach(c => {
      countriesMap.set(c.country, (countriesMap.get(c.country) || 0) + c.count);
    });
  });
  
  return { totalViews, topCountries: [...], topRoutes: [...] };
}
```

### `getCountryFlag(code)`
Convierte ISO code a emoji flag.

```typescript
getCountryFlag(countryCode: string): string {
  if (countryCode === 'Unknown') return '🌍';
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
```

Ejemplo: `"ES"` → 🇪🇸

## 📱 Responsive

```css
@media (max-width: 768px) {
  .stats-summary {
    grid-template-columns: repeat(2, 1fr); /* 4 → 2 columnas */
  }
  
  .country-item {
    grid-template-columns: 30px 40px 1fr; /* Stats en nueva fila */
  }
  
  .devices-grid {
    grid-template-columns: 1fr; /* 3 → 1 columna */
  }
}
```

## 🐛 Estados de Error

### Loading State
```html
<div *ngIf="loading" class="loading-state">
  <div class="spinner"></div>
  <p>Cargando estadísticas...</p>
</div>
```

### Error State
```html
<div *ngIf="error && !loading" class="error-state">
  <p>⚠️ Error al cargar estadísticas</p>
  <p class="hint">El sistema aún no ha recopilado datos suficientes</p>
</div>
```

## 🔐 Privacidad

**Footer con transparencia:**

```html
<footer class="analytics-footer">
  <p class="transparency-note">
    📊 Sistema de analytics minimalista | Sin cookies | Sin tracking personal | 
    <a href="/sobre/privacidad">Ver Política de Privacidad</a>
  </p>
</footer>
```

## 🚀 Próximas Mejoras

- [ ] **Mapa SVG interactivo** (en lugar de lista de países)
- [ ] **Gráficos temporales** (Chart.js: views por día)
- [ ] **Heatmap de horas** (cuándo se lee más)
- [ ] **Retención de lectores** (returning vs new - requiere cookies opt-in)
- [ ] **Tiempo promedio de lectura** por capítulo
- [ ] **Referrer tracking** (de dónde vienen los lectores)
- [ ] **Exportar stats** como CSV/PNG

## 📚 Dependencias

```json
{
  "@angular/common": "^18.x",
  "@angular/core": "^18.x",
  "@angular/common/http": "^18.x"
}
```

No requiere librerías externas (100% vanilla Angular).

## 🎯 Filosofía

> **"Contar personas en una sala ≠ Seguir individuos con GPS 24/7"**

Este componente muestra agregados estadísticos sin comprometer la privacidad individual. No hay tracking cross-session, no hay perfiles de usuario, no hay cookies.

Solo mostramos:
- ✅ Cuántas personas leen (número)
- ✅ Desde dónde leen (país)
- ✅ Qué leen (ruta)
- ✅ Cómo leen (dispositivo)

**NO mostramos:**
- ❌ Quién lee (identidad)
- ❌ Cuándo lee cada persona (timeline individual)
- ❌ Por dónde navega cada persona (path completo)
- ❌ Cuánto tiempo pasa cada persona (sesión)

## 📖 Ejemplo de Uso

```typescript
// sobre.component.ts
import { AnalyticsMapComponent } from '../../components/analytics-map/analytics-map.component';

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [AnalyticsMapComponent],
  template: `
    <section class="sobre-page">
      <h1>Sobre TRENDING GHOST</h1>
      
      <!-- Mapa de analytics -->
      <article class="analytics-section">
        <app-analytics-map></app-analytics-map>
      </article>
    </section>
  `
})
export class SobreComponent {}
```

---

**Creado por:** Sistema de Analytics Minimalista de TRENDING GHOST  
**Licencia:** Parte del proyecto TRENDING GHOST (All Rights Reserved)  
**Contacto:** [GitHub Issues](https://github.com/trendingghostofficial/building/issues)
