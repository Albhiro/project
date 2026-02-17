import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { GithubContactService, ContactFormData } from '../../core/services/github-contact.service';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, timeout } from 'rxjs/operators';

interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'length' | 'invalid';
}

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.scss']
})
export class ContactoComponent implements OnInit, OnDestroy {
  formData: ContactFormData = {
    name: '',
    email: '',
    category: '',
    subject: '',
    message: ''
  };

  submitted = false;
  isSubmitting = false;
  error = false;
  errorMessage = '';
  issueUrl = '';
  issueNumber = 0;
  submissionTimestamp = '';
  copied = false;

  // Validación en tiempo real
  validationErrors: Map<string, string> = new Map();
  touchedFields: { [key: string]: boolean } = {};
  
  private destroy$ = new Subject<void>();

  constructor(
    private githubService: GithubContactService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Cualquier inicialización necesaria
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Validar campo específico
   */
  validateField(fieldName: string): void {
    this.validationErrors.delete(fieldName);

    switch (fieldName) {
      case 'name':
        this.validateName();
        break;
      case 'email':
        this.validateEmail();
        break;
      case 'category':
        this.validateCategory();
        break;
      case 'subject':
        this.validateSubject();
        break;
      case 'message':
        this.validateMessage();
        break;
    }
  }

  /**
   * Validaciones específicas
   */
  private validateName(): void {
    const name = this.formData.name.trim();
    
    if (!name) {
      this.validationErrors.set('name', 'contact.form.error_name_required');
      return;
    }

    if (name.length < 2) {
      this.validationErrors.set('name', 'contact.form.error_name_short');
      return;
    }

    // No permitir solo números
    if (/^\d+$/.test(name)) {
      this.validationErrors.set('name', 'contact.form.error_name_numbers');
      return;
    }

    // No permitir caracteres raros
    if (!/^[a-zA-ZÀ-ÿ\s\-\.]+$/.test(name)) {
      this.validationErrors.set('name', 'contact.form.error_name_invalid');
      return;
    }
  }

  private validateEmail(): void {
    const email = this.formData.email.trim();
    
    if (!email) {
      this.validationErrors.set('email', 'contact.form.error_email_required');
      return;
    }

    // Regex robusto para email
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
      this.validationErrors.set('email', 'contact.form.error_email_invalid');
      return;
    }

    // Validar dominio básico
    const domain = email.split('@')[1];
    if (!domain || !domain.includes('.')) {
      this.validationErrors.set('email', 'contact.form.error_email_domain');
      return;
    }
  }

  private validateCategory(): void {
    if (!this.formData.category) {
      this.validationErrors.set('category', 'contact.form.error_category_required');
      return;
    }

    const validCategories = ['general', 'bug', 'enhancement', 'translation', 'legal', 'collaboration'];
    if (!validCategories.includes(this.formData.category)) {
      this.validationErrors.set('category', 'contact.form.error_category_invalid');
      return;
    }
  }

  private validateSubject(): void {
    const subject = this.formData.subject.trim();
    
    if (!subject) {
      this.validationErrors.set('subject', 'contact.form.error_subject_required');
      return;
    }

    if (subject.length < 5) {
      this.validationErrors.set('subject', 'contact.form.error_subject_short');
      return;
    }
  }

  private validateMessage(): void {
    const message = this.formData.message.trim();
    
    if (!message) {
      this.validationErrors.set('message', 'contact.form.error_message_required');
      return;
    }

    if (message.length < 20) {
      this.validationErrors.set('message', 'contact.form.error_message_short');
      return;
    }

    if (message.length > 2000) {
      this.validationErrors.set('message', 'contact.form.error_message_long');
      return;
    }
  }

  /**
   * Marcar campo como tocado
   */
  onFieldBlur(fieldName: string): void {
    this.touchedFields[fieldName] = true;
    this.validateField(fieldName);
  }

  /**
   * Obtener error de campo
   */
  getFieldError(fieldName: string): string | null {
    if (!this.touchedFields[fieldName]) {
      return null;
    }
    return this.validationErrors.get(fieldName) || null;
  }

  /**
   * Verificar si campo tiene error (para clases CSS)
   */
  hasFieldError(fieldName: string): boolean {
    return this.getFieldError(fieldName) !== null;
  }

  /**
   * Verificar si campo es válido
   */
  isFieldValid(fieldName: string): boolean {
    if (!this.touchedFields[fieldName]) {
      return false;
    }

    // Verificar que el campo tenga valor y no tenga errores
    const hasValue = this.formData[fieldName as keyof ContactFormData]?.toString().trim().length > 0;
    const hasNoError = !this.validationErrors.has(fieldName);
    
    return hasValue && hasNoError;
  }

  /**
   * Verificar si todo el formulario es válido
   */
  isFormValid(): boolean {
    // Validar todos los campos
    this.validateField('name');
    this.validateField('email');
    this.validateField('category');
    this.validateField('subject');
    this.validateField('message');

    return this.validationErrors.size === 0;
  }

  /**
   * Obtener porcentaje de completitud del formulario
   */
  getFormCompletionPercentage(): number {
    const fields = ['name', 'email', 'category', 'subject', 'message'];
    const completedFields = fields.filter(field => {
      const value = this.formData[field as keyof ContactFormData];
      return value && value.toString().trim().length > 0;
    }).length;

    return (completedFields / fields.length) * 100;
  }

  /**
   * Obtener nivel de advertencia del contador de caracteres
   */
  getCharWarningLevel(): string {
    const length = this.formData.message.length;
    if (length >= 1900) return 'danger';
    if (length >= 1700) return 'warning';
    return 'normal';
  }

  /**
   * Enviar formulario
   */
  onSubmit(): void {
    // Marcar todos los campos como tocados
    Object.keys(this.formData).forEach(key => {
      this.touchedFields[key] = true;
    });

    if (!this.isFormValid() || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.error = false;

    // Timeout de 30 segundos
    this.githubService.createIssue(this.formData)
      .pipe(
        timeout(30000),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Issue creada:', response);
          this.issueUrl = response.issue_url;
          this.issueNumber = response.issue_number || 0;
          this.submissionTimestamp = new Date().toISOString();
          this.submitted = true;
          this.isSubmitting = false;
          
          // Forzar detección de cambios para mostrar el modal inmediatamente
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error al crear issue:', error);
          console.error('❌ Error completo:', JSON.stringify(error, null, 2));
          this.error = true;
          this.isSubmitting = false;
          
          // Detectar tipo de error
          if (error.name === 'TimeoutError') {
            this.errorMessage = 'contact.form.error_timeout';
            console.error('⏱️ Timeout: El servidor tardó más de 30 segundos');
          } else if (error.status === 0) {
            // Error CORS o red
            this.errorMessage = 'contact.form.error_cors';
            console.error('🚫 Error CORS o de red. Verifica:');
            console.error('1. Que el worker esté desplegado');
            console.error('2. Que la URL sea correcta:', this.githubService['CONTACT_API']);
            console.error('3. Que CORS esté configurado en el worker');
          } else if (error.error && error.error.error) {
            const errorType = error.error.error;
            
            if (errorType.includes('Rate limit')) {
              this.errorMessage = 'contact.form.error_ratelimit';
            } else if (errorType.includes('Invalid')) {
              this.errorMessage = 'contact.form.error_invalid_data';
            } else if (errorType.includes('Network')) {
              this.errorMessage = 'contact.form.error_network';
            } else {
              this.errorMessage = error.error.details || error.error.error || 'contact.form.error_unknown';
            }
          } else if (error.status === 404) {
            this.errorMessage = 'contact.form.error_worker_not_found';
            console.error('❌ Worker no encontrado (404). URL:', this.githubService['CONTACT_API']);
          } else if (error.status >= 500) {
            this.errorMessage = 'contact.form.error_server';
            console.error('❌ Error del servidor (5xx)');
          } else {
            this.errorMessage = 'contact.form.error_generic';
          }
        }
      });
  }

  /**
   * Resetear formulario
   */
  resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      category: '',
      subject: '',
      message: ''
    };
    this.submitted = false;
    this.error = false;
    this.issueUrl = '';
    this.issueNumber = 0;
    this.submissionTimestamp = '';
    this.copied = false;
    this.validationErrors.clear();
    this.touchedFields = {};
  }

  /**
   * Cerrar modal (alias de resetForm)
   */
  closeModal(): void {
    this.resetForm();
  }

  /**
   * Copiar detalles al portapapeles
   */
  copySubmissionDetails(): void {
    const details = `TRENDING GHOST - Consulta Registrada

ID de Issue: #${this.issueNumber}
URL: ${this.issueUrl}
Fecha: ${this.getFormattedDate()}
Categoría: ${this.formData.category}
Asunto: ${this.formData.subject}

Tu mensaje fue registrado correctamente. 
Recibirás respuesta a: ${this.formData.email}`;

    navigator.clipboard.writeText(details).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 3000);
    });
  }

  /**
   * Obtener fecha formateada
   */
  getFormattedDate(): string {
    if (!this.submissionTimestamp) return '';
    const date = new Date(this.submissionTimestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
