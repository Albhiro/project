import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I18nService, IdiomaInfo } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="language-selector-global" [class.expanded]="isExpanded">
      <button
        class="current-language"
        (click)="toggleDropdown()"
        [title]="'Cambiar idioma / Change language'">
        <img class="flag-img" [src]="getFlagUrl(currentLanguage)" [alt]="currentIdioma?.nombre_nativo || 'Flag'" />
        <span class="code">{{ (currentIdioma?.codigo || 'es').toUpperCase() }}</span>
        <span class="arrow">{{ isExpanded ? '▲' : '▼' }}</span>
      </button>

      <div class="language-dropdown" *ngIf="isExpanded">
        <!-- IDIOMA ACTUAL SELECCIONADO -->
        <div class="current-selection">
          <button
            class="language-option selected"
            [class.active]="true">
            <img class="flag-img" [src]="getFlagUrl(currentLanguage)" [alt]="currentIdioma?.nombre_nativo || 'Flag'" />
            <span class="name">{{ currentIdioma?.nombre_nativo || 'Español' }}</span>
            <span class="check">✓</span>
          </button>
        </div>

        <!-- SEPARADOR -->
        <div class="dropdown-separator"></div>

        <!-- CAJA DE FILTRADO -->
        <div class="filter-box">
          <input
            #filterInput
            type="text"
            class="filter-input"
            [(ngModel)]="filterText"
            (input)="onFilterChange()"
            placeholder="🔍 Buscar idioma..."
            autocomplete="off"
            spellcheck="false">
          <button
            *ngIf="filterText"
            class="clear-filter"
            (click)="clearFilter(); filterInput.focus()"
            title="Limpiar búsqueda">
            ✕
          </button>
        </div>

        <!-- CONTADOR DE RESULTADOS -->
        <div class="filter-results" *ngIf="filterText">
          <span class="count">{{ idiomasFiltrados.length }} de {{ idiomasDisponibles.length }}</span>
        </div>

        <!-- TODAS LAS OPCIONES DISPONIBLES EN GRID 2 COLUMNAS - SOLO BANDERAS -->
        <div class="languages-grid">
          <button
            *ngFor="let idioma of idiomasFiltrados"
            class="language-option"
            [class.active]="idioma.codigo === currentLanguage"
            [title]="idioma.nombre_nativo"
            (click)="selectLanguage(idioma.codigo)">

            <img class="flag-img" [src]="getFlagUrl(idioma.codigo)" [alt]="idioma.nombre_nativo" />
            <span class="check" *ngIf="idioma.codigo === currentLanguage">✓</span>
          </button>
        </div>

        <!-- MENSAJE SI NO HAY RESULTADOS -->
        <div class="no-results" *ngIf="filterText && idiomasFiltrados.length === 0">
          <span class="icon">🔍</span>
          <span class="text">No se encontraron idiomas</span>
        </div>
      </div>

      <!-- Overlay para cerrar al hacer click fuera -->
      <div
        class="dropdown-overlay"
        *ngIf="isExpanded"
        (click)="closeDropdown()">
      </div>
    </div>
  `,
  styles: [`
    .language-selector-global {
      position: relative;
      z-index: 9999;
    }

    .current-language {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.5rem;
      background: #0a0a0a;
      border: 1px solid #00ff00;
      border-radius: 4px;
      color: #e0e0e0;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .current-language:hover {
      background: #1a1a1a;
      box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
    }

    .current-language .flag-img {
      width: 20px;
      height: 15px;
      object-fit: cover;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .current-language .code {
      font-weight: bold;
      color: #00ff00;
      font-size: 0.75rem;
    }

    .current-language .arrow {
      font-size: 0.6rem;
      color: #888;
      transition: transform 0.2s ease;
    }

    .expanded .current-language .arrow {
      transform: rotate(180deg);
    }

    .language-dropdown {
      position: absolute;
      top: calc(100% + 0.4rem);
      right: 0;
      min-width: 120px;
      max-width: 140px;
      background: #0a0a0a;
      border: 1px solid #00ff00;
      border-radius: 6px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 255, 0, 0.2);
      overflow: hidden;
      animation: slideDown 0.2s ease;
      z-index: 10000;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* SECCIÓN DE IDIOMA SELECCIONADO */
    .current-selection {
      padding: 0.5rem;
      background: rgba(0, 255, 0, 0.05);
      border-bottom: 1px solid #1a1a1a;
    }

    .current-selection .language-option {
      background: rgba(0, 255, 0, 0.15);
      border: 1px solid #00ff00;
      border-radius: 4px;
      pointer-events: none;
    }

    .current-selection .language-option .check {
      color: #00ff00;
      font-size: 1.1rem;
      font-weight: bold;
    }

    /* SEPARADOR VISUAL */
    .dropdown-separator {
      height: 1px;
      background: linear-gradient(
        to right,
        transparent,
        #00ff00 20%,
        #00ff00 80%,
        transparent
      );
      margin: 0.3rem 0;
      opacity: 0.5;
    }

    /* CAJA DE FILTRADO */
    .filter-box {
      position: relative;
      padding: 0.5rem;
      background: #0a0a0a;
      border-bottom: 1px solid #1a1a1a;
    }

    .filter-input {
      width: 100%;
      padding: 0.5rem 2rem 0.5rem 0.7rem;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #e0e0e0;
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      outline: none;
      transition: all 0.2s ease;
    }

    .filter-input::placeholder {
      color: #666;
    }

    .filter-input:focus {
      border-color: #00ff00;
      box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
      background: #0f0f0f;
    }

    .clear-filter {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: #888;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.2rem 0.4rem;
      transition: color 0.2s ease;
    }

    .clear-filter:hover {
      color: #ff0000;
    }

    /* CONTADOR DE RESULTADOS */
    .filter-results {
      padding: 0.3rem 0.7rem;
      background: rgba(0, 255, 0, 0.05);
      border-bottom: 1px solid #1a1a1a;
      font-family: 'Courier New', monospace;
      font-size: 0.7rem;
      color: #00ff00;
      text-align: center;
    }

    .filter-results .count {
      font-weight: bold;
    }

    /* MENSAJE SIN RESULTADOS */
    .no-results {
      padding: 2rem;
      text-align: center;
      color: #666;
      font-family: 'Courier New', monospace;
    }

    .no-results .icon {
      display: block;
      font-size: 2rem;
      margin-bottom: 0.5rem;
      opacity: 0.5;
    }

    .no-results .text {
      font-size: 0.85rem;
    }

    /* GRID DE 2 COLUMNAS PARA OPCIONES - MÁS COMPACTO */
    .languages-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.25rem;
      padding: 0.4rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .languages-grid::-webkit-scrollbar {
      width: 6px;
    }

    .languages-grid::-webkit-scrollbar-track {
      background: #0a0a0a;
    }

    .languages-grid::-webkit-scrollbar-thumb {
      background: #00ff00;
      border-radius: 3px;
    }

    .languages-grid::-webkit-scrollbar-thumb:hover {
      background: #00cc00;
    }

    .language-option {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      width: 100%;
      padding: 0.5rem 0.6rem;
      background: transparent;
      border: 1px solid #1a1a1a;
      border-radius: 4px;
      color: #e0e0e0;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .language-option:hover {
      background: #1a1a1a;
      border-color: #333;
    }

    .language-option.active {
      background: rgba(0, 255, 0, 0.1);
      border-color: #00ff00;
    }

    .language-option .flag-img {
      width: 20px;
      height: 15px;
      object-fit: cover;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .language-option .name {
      flex: 1;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .language-option .check {
      color: #00ff00;
      font-size: 0.85rem;
      margin-left: auto;
      flex-shrink: 0;
    }

    .dropdown-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9998;
      background: transparent;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .language-dropdown {
        min-width: 340px;
        max-width: 90vw;
      }

      .languages-grid {
        grid-template-columns: repeat(2, 1fr);
        max-height: 300px;
      }

      .filter-input {
        font-size: 0.75rem;
        padding: 0.45rem 1.8rem 0.45rem 0.6rem;
      }

      .clear-filter {
        right: 0.9rem;
        font-size: 0.9rem;
      }

      .current-language {
        padding: 0.25rem 0.4rem;
        font-size: 0.7rem;
      }

      .current-language .emoji {
        font-size: 0.9rem;
      }

      .language-option {
        padding: 0.4rem 0.5rem;
        font-size: 0.7rem;
      }

      .language-option .name {
        font-size: 0.7rem;
      }
    }

    @media (max-width: 480px) {
      .language-dropdown {
        min-width: 280px;
        right: -20px;
      }

      .languages-grid {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }

      .filter-input {
        font-size: 0.7rem;
      }

      .language-option {
        padding: 0.5rem;
      }

      .no-results {
        padding: 1.5rem 1rem;
      }

      .no-results .icon {
        font-size: 1.5rem;
      }
    }
  `]
})
export class LanguageSelectorComponent implements OnInit {
  currentLanguage: string = 'es';
  currentIdioma: IdiomaInfo | null = null;
  idiomasDisponibles: IdiomaInfo[] = [];
  idiomasFiltrados: IdiomaInfo[] = [];
  isExpanded: boolean = false;
  filterText: string = '';

  constructor(private i18n: I18nService) {}

  ngOnInit(): void {
    // Suscribirse a cambios de idioma PRIMERO
    this.i18n.getCurrentLanguage().subscribe(lang => {
      this.currentLanguage = lang;
      this.updateCurrentIdioma();
    });

    // Cargar idiomas disponibles
    this.i18n.getIdiomasDisponibles().subscribe(idiomas => {
      console.log('[LanguageSelector] Idiomas cargados:', idiomas);
      this.idiomasDisponibles = idiomas;
      this.idiomasFiltrados = idiomas;
      this.updateCurrentIdioma();
    });
  }

  private updateCurrentIdioma(): void {
    this.currentIdioma = this.idiomasDisponibles.find(
      i => i.codigo === this.currentLanguage
    ) || null;
    console.log('[LanguageSelector] Current idioma actualizado:', {
      currentLanguage: this.currentLanguage,
      currentIdioma: this.currentIdioma,
      icono_emoji: this.currentIdioma?.icono_emoji
    });
  }

  toggleDropdown(): void {
    this.isExpanded = !this.isExpanded;
    if (!this.isExpanded) {
      this.clearFilter();
    }
  }

  closeDropdown(): void {
    this.isExpanded = false;
    this.clearFilter();
  }

  selectLanguage(codigo: string): void {
    this.i18n.setLanguage(codigo);
    this.closeDropdown();
  }

  /**
   * Obtiene el emoji del idioma actual
   * Método helper para asegurar que siempre se muestre el emoji correcto
   */
  getCurrentEmoji(): string {
    if (this.currentIdioma?.icono_emoji) {
      return this.currentIdioma.icono_emoji;
    }

    // Fallback: buscar el emoji en la lista de idiomas disponibles
    const idioma = this.idiomasDisponibles.find(i => i.codigo === this.currentLanguage);
    if (idioma?.icono_emoji) {
      return idioma.icono_emoji;
    }

    // Fallback final: emoji global
    return '🌐';
  }

  onFilterChange(): void {
    const filter = this.filterText.toLowerCase().trim();

    if (!filter) {
      this.idiomasFiltrados = this.idiomasDisponibles;
      return;
    }

    this.idiomasFiltrados = this.idiomasDisponibles.filter(idioma =>
      idioma.nombre_nativo.toLowerCase().includes(filter) ||
      idioma.nombre_ingles.toLowerCase().includes(filter) ||
      idioma.codigo.toLowerCase().includes(filter)
    );
  }

  clearFilter(): void {
    this.filterText = '';
    this.idiomasFiltrados = this.idiomasDisponibles;
  }

  /**
   * Obtiene URL de bandera desde Flagcdn.com
   * Mapea códigos de idioma a códigos de país ISO-3166-1-alpha-2
   */
  getFlagUrl(langCode: string): string {
    // Mapeo de códigos de idioma a códigos de país
    const langToCountry: { [key: string]: string } = {
      'es': 'es',      // Español → España
      'en': 'gb',      // English → Reino Unido
      'ja': 'jp',      // 日本語 → Japón
      'pt': 'br',      // Português → Brasil
      'fr': 'fr',      // Français → Francia
      'de': 'de',      // Deutsch → Alemania
      'it': 'it',      // Italiano → Italia
      'ko': 'kr',      // 한국어 → Corea del Sur
      'zh-CN': 'cn',   // 简体中文 → China
      'zh-TW': 'tw',   // 繁體中文 → Taiwán
      'ru': 'ru',      // Русский → Rusia
      'pl': 'pl',      // Polski → Polonia
      'tr': 'tr',      // Türkçe → Turquía
      'hi': 'in',      // हिन्दी → India
      'ar': 'sa'       // العربية → Arabia Saudita
    };

    const countryCode = langToCountry[langCode] || 'xx';
    return `https://flagcdn.com/w40/${countryCode}.png`;
  }
}
