import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface TranslationFeedbackData {
  capitulo_slug: string;
  idioma: string;
  texto_seleccionado: string;
}

@Component({
  selector: 'app-translation-feedback-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './translation-feedback-dialog.component.html',
  styleUrls: ['./translation-feedback-dialog.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-50px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class TranslationFeedbackDialogComponent {
  @Input() visible = false;
  @Input() data: TranslationFeedbackData | null = null;
  @Output() closed = new EventEmitter<{ success: boolean }>();

  feedbackForm: FormGroup;
  submitting = false;
  submitted = false;
  error: string | null = null;
  issueUrl: string | null = null;

  // URL del worker de analytics
  private readonly ANALYTICS_URL = 'https://worker-analytics.trendingghost.workers.dev';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.feedbackForm = this.fb.group({
      sugerencia: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      razon: ['', [Validators.maxLength(500)]],
      user_email: ['', [Validators.email]],
      user_discord: ['']
    });
  }

  /**
   * Obtiene el idioma en texto legible
   */
  getLanguageName(): string {
    if (!this.data) return '';

    const idiomas: Record<string, string> = {
      'en': 'Inglés',
      'ja': 'Japonés',
      'pt': 'Portugués',
      'fr': 'Francés'
    };
    return idiomas[this.data.idioma] || this.data.idioma.toUpperCase();
  }

  /**
   * Envía la sugerencia de traducción
   */
  async submitFeedback(): Promise<void> {
    if (this.feedbackForm.invalid || !this.data) {
      this.feedbackForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const feedback = {
      capitulo_slug: this.data.capitulo_slug,
      idioma: this.data.idioma,
      texto_seleccionado: this.data.texto_seleccionado,
      sugerencia: this.feedbackForm.value.sugerencia.trim(),
      razon: this.feedbackForm.value.razon?.trim() || undefined,
      user_email: this.feedbackForm.value.user_email?.trim() || undefined,
      user_discord: this.feedbackForm.value.user_discord?.trim() || undefined
    };

    try {
      const response = await this.http.post<any>(
        `${this.ANALYTICS_URL}/api/translation-feedback`,
        feedback
      ).toPromise();

      if (response.success) {
        this.submitted = true;
        this.issueUrl = response.issue_url;

        // Auto-cerrar después de 3 segundos
        setTimeout(() => {
          this.close();
        }, 3000);
      } else {
        this.error = 'Error al enviar la sugerencia. Por favor, intenta de nuevo.';
        this.submitting = false;
      }

    } catch (err: any) {
      console.error('[TranslationFeedback] Error:', err);

      if (err.status === 429) {
        this.error = 'Demasiadas solicitudes. Por favor, espera un momento e intenta de nuevo.';
      } else {
        this.error = 'Error al enviar la sugerencia. Por favor, verifica tu conexión e intenta de nuevo.';
      }

      this.submitting = false;
    }
  }

  /**
   * Cierra el diálogo
   */
  close(): void {
    this.visible = false;
    this.submitted = false;
    this.error = null;
    this.issueUrl = null;
    this.feedbackForm.reset();
    this.closed.emit({ success: this.submitted });
  }

  /**
   * Abre el issue en GitHub (nueva pestaña)
   */
  openIssue(): void {
    if (this.issueUrl) {
      window.open(this.issueUrl, '_blank');
    }
  }

  /**
   * Cierra al hacer click en el overlay
   */
  onOverlayClick(event: MouseEvent): void {
    // Solo cerrar si el click es directamente en el overlay, no en el modal
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }
}
