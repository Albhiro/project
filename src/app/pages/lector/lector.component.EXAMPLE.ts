import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { I18nService, Chapter, IdiomaInfo } from '@core/services/i18n.service';
import { TextSelection } from '@shared/directives/selectable-translation.directive';
import { TranslationFeedbackData } from '@shared/components/translation-feedback-dialog/translation-feedback-dialog.component';

@Component({
  selector: 'app-lector',
  templateUrl: './lector.component.html',
  styleUrls: ['./lector.component.scss']
})
export class LectorComponent implements OnInit {
  chapter: Chapter | null = null;
  currentLanguage: string = 'es';
  idiomas: IdiomaInfo[] = [];
  loading = true;
  error: string | null = null;

  // Modal de feedback
  showFeedbackModal = false;
  feedbackData: TranslationFeedbackData | null = null;

  constructor(
    private i18n: I18nService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Cargar idiomas disponibles
    this.i18n.getIdiomasDisponibles().subscribe(idiomas => {
      this.idiomas = idiomas;
    });

    // Suscribirse a cambios de idioma
    this.i18n.getCurrentLanguage().subscribe(lang => {
      this.currentLanguage = lang;
      this.loadChapter();
    });
  }

  /**
   * Carga el capítulo actual en el idioma seleccionado
   */
  loadChapter(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error = 'Capítulo no encontrado';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.i18n.loadChapter(slug).subscribe(
      chapter => {
        this.chapter = chapter;
        this.loading = false;
      },
      error => {
        console.error('Error cargando capítulo:', error);
        this.error = 'No se pudo cargar el capítulo. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    );
  }

  /**
   * Cambia el idioma actual
   */
  changeLanguage(lang: string): void {
    this.i18n.setLanguage(lang);
  }

  /**
   * Maneja la selección de texto para sugerir traducción
   */
  onTextSelected(selection: TextSelection): void {
    if (!this.chapter) return;

    this.feedbackData = {
      capitulo_slug: this.chapter.slug,
      idioma: this.chapter.idioma,
      texto_seleccionado: selection.text
    };

    this.showFeedbackModal = true;
  }

  /**
   * Maneja el cierre del modal
   */
  onModalClosed(result: { success: boolean }): void {
    this.showFeedbackModal = false;
    
    if (result.success) {
      // Opcional: Mostrar mensaje de éxito (toast, snackbar, etc.)
      console.log('✅ Sugerencia enviada con éxito');
    }
  }

  /**
   * Verifica si la traducción actual necesita revisión
   */
  needsReview(): boolean {
    return this.chapter ? this.i18n.needsReview(this.chapter) : false;
  }

  /**
   * Obtiene el método de traducción usado
   */
  getTranslationMethod(): string {
    return this.chapter ? this.i18n.getTranslationMethod(this.chapter) : '';
  }

  /**
   * Obtiene la calidad de la traducción como porcentaje
   */
  getQualityScore(): number {
    if (!this.chapter?.traduccion_info?.calidad_score) return 0;
    return Math.round(this.chapter.traduccion_info.calidad_score * 100);
  }
}
