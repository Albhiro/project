import { 
  Directive, 
  ElementRef, 
  HostListener, 
  OnInit, 
  OnDestroy, 
  Output, 
  EventEmitter,
  Renderer2,
  Input
} from '@angular/core';

export interface TextSelection {
  text: string;
  x: number;
  y: number;
}

@Directive({
  selector: '[appSelectableTranslation]'
})
export class SelectableTranslationDirective implements OnInit, OnDestroy {
  @Input() enabledLanguages: string[] = ['en', 'ja', 'pt', 'fr']; // No permitir en español (original)
  @Input() currentLanguage: string = 'es';
  
  @Output() textSelected = new EventEmitter<TextSelection>();

  private tooltip: HTMLElement | null = null;
  private selectedText: string = '';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // Añadir clase CSS para indicar que el texto es seleccionable
    if (this.isEnabled()) {
      this.renderer.addClass(this.el.nativeElement, 'selectable-translation');
    }
  }

  ngOnDestroy(): void {
    this.removeTooltip();
  }

  /**
   * Verifica si la directiva debe estar activa
   * Solo funciona en idiomas traducidos, no en el original
   */
  private isEnabled(): boolean {
    return this.enabledLanguages.includes(this.currentLanguage);
  }

  /**
   * Detecta cuando el usuario selecciona texto
   */
  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (!this.isEnabled()) {
      return;
    }

    // Pequeño delay para asegurar que la selección se completó
    setTimeout(() => {
      const selection = window.getSelection();
      
      if (!selection || selection.rangeCount === 0) {
        this.removeTooltip();
        return;
      }

      const text = selection.toString().trim();
      
      // Validar selección
      if (!text || text.length < 3) {
        this.removeTooltip();
        return;
      }

      // Limitar longitud
      if (text.length > 500) {
        console.warn('[SelectableTranslation] Texto seleccionado demasiado largo, truncando');
        this.selectedText = text.substring(0, 500);
      } else {
        this.selectedText = text;
      }

      // Obtener posición de la selección
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Mostrar tooltip
      this.showTooltip(rect.left + rect.width / 2, rect.top - 10);
      
    }, 10);
  }

  /**
   * Ocultar tooltip al hacer clic fuera
   */
  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Si el clic es en el tooltip, no hacer nada
    if (this.tooltip && this.tooltip.contains(event.target as Node)) {
      return;
    }

    // Si hay tooltip visible y el clic no es en el área de texto, ocultar
    if (this.tooltip && !this.el.nativeElement.contains(event.target)) {
      this.removeTooltip();
    }
  }

  /**
   * Muestra tooltip con botón para sugerir traducción
   */
  private showTooltip(x: number, y: number): void {
    // Remover tooltip anterior si existe
    this.removeTooltip();

    // Crear tooltip
    this.tooltip = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltip, 'translation-tooltip');
    
    // Contenido del tooltip
    const button = this.renderer.createElement('button');
    this.renderer.addClass(button, 'btn-suggest-translation');
    
    const icon = this.renderer.createElement('span');
    this.renderer.addClass(icon, 'icon');
    icon.innerHTML = '✏️';
    
    const text = this.renderer.createText(' Sugerir traducción');
    
    this.renderer.appendChild(button, icon);
    this.renderer.appendChild(button, text);
    this.renderer.appendChild(this.tooltip, button);

    // Posicionar tooltip
    this.renderer.setStyle(this.tooltip, 'position', 'fixed');
    this.renderer.setStyle(this.tooltip, 'left', `${x}px`);
    this.renderer.setStyle(this.tooltip, 'top', `${y}px`);
    this.renderer.setStyle(this.tooltip, 'transform', 'translate(-50%, -100%)');
    this.renderer.setStyle(this.tooltip, 'z-index', '9999');

    // Evento click en el botón
    this.renderer.listen(button, 'click', () => {
      this.emitSelection(x, y);
    });

    // Añadir al DOM
    this.renderer.appendChild(document.body, this.tooltip);
  }

  /**
   * Emite evento con el texto seleccionado
   */
  private emitSelection(x: number, y: number): void {
    if (this.selectedText) {
      this.textSelected.emit({
        text: this.selectedText,
        x,
        y
      });
      
      // Limpiar selección
      window.getSelection()?.removeAllRanges();
      this.removeTooltip();
    }
  }

  /**
   * Remueve el tooltip del DOM
   */
  private removeTooltip(): void {
    if (this.tooltip) {
      this.renderer.removeChild(document.body, this.tooltip);
      this.tooltip = null;
    }
    this.selectedText = '';
  }
}
