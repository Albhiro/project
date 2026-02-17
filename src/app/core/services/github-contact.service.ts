import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactFormData {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}

export interface GitHubIssueResponse {
  html_url: string;
  number: number;
}

export interface ContactResponse {
  success: boolean;
  issue_url: string;
  issue_number: number;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GithubContactService {
  // URL del Cloudflare Worker de contacto
  // El worker se encarga de autenticar con GitHub y crear el issue
  private readonly CONTACT_API = environment.contact.workerUrl;

  constructor(private http: HttpClient) { }

  /**
   * Envía el formulario de contacto al Cloudflare Worker
   * que se encarga de crear el GitHub Issue
   */
  createIssue(formData: ContactFormData): Observable<ContactResponse> {
    const url = `${this.CONTACT_API}/api/contact`;
    
    // Enviar datos directamente al worker
    // El worker se encarga de:
    // - Validar campos
    // - Formatear como markdown
    // - Autenticar con GitHub (token privado)
    // - Crear el issue
    // - Retornar la URL del issue
    return this.http.post<ContactResponse>(url, formData);
  }

  /**
   * Obtiene el emoji según la categoría
   */
  private getCategoryEmoji(category: string): string {
    const emojis: { [key: string]: string } = {
      'general': '💬',
      'bug': '🐛',
      'suggestion': '💡',
      'translation': '🌍',
      'legal': '⚖️',
      'collaboration': '🤝'
    };
    return emojis[category] || '📬';
  }

  /**
   * Obtiene los labels según la categoría
   */
  private getCategoryLabels(category: string): string[] {
    const labelMap: { [key: string]: string[] } = {
      'general': ['contact', 'general'],
      'bug': ['contact', 'bug'],
      'suggestion': ['contact', 'enhancement'],
      'translation': ['contact', 'translation'],
      'legal': ['contact', 'legal'],
      'collaboration': ['contact', 'collaboration']
    };
    return labelMap[category] || ['contact'];
  }
}
