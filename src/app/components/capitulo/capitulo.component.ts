import { Component, Input, OnInit, ElementRef, ViewChild, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SanitizeHtmlPipe } from '../../pipes/sanitize-html.pipe';
import { CapitulosDataService, Capitulo } from '../../services/capitulos-data.service';

@Component({
  selector: 'app-capitulo',
  standalone: true,
  imports: [CommonModule, SanitizeHtmlPipe],
  templateUrl: './capitulo.component.html',
  styleUrls: ['./capitulo.component.css']
})
export class CapituloComponent implements OnInit, OnChanges {
  @Input() numeroCapitulo: number = 1;
  @Input() volumen: number = 1;
  @ViewChild('capituloContainer', { static: false }) capituloContainer!: ElementRef;

  capitulo: Capitulo | null = null;
  cargando: boolean = true;
  error: string = '';

  constructor(
    private capitulosDataService: CapitulosDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarCapitulo();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Si cambia el número de capítulo, recargar
    if (changes['numeroCapitulo'] || changes['volumen']) {
      this.cargarCapitulo();
    }
  }

  cargarCapitulo() {
    this.cargando = true;
    this.error = '';

    this.capitulosDataService.getCapituloPorNumero(this.volumen, this.numeroCapitulo).subscribe({
      next: (capitulo) => {
        if (capitulo) {
          this.capitulo = capitulo;
          console.log('%c✓ Capítulo cargado desde JSON:', 'color: #00ff00;', capitulo.titulo);
          console.log('  📄 Contenido HTML:', capitulo.contenido_html ? 'SÍ' : 'NO');
          console.log('  📝 Contenido MD:', capitulo.contenido_markdown ? 'SÍ' : 'NO');
        } else {
          this.error = 'Capítulo no encontrado';
        }
        this.cargando = false;
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando capítulo:', err);
        this.error = 'Error al cargar el capítulo';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Método público para acceder al contenedor (usado por el auto-scroll)
  getScrollContainer(): HTMLElement {
    return this.capituloContainer?.nativeElement;
  }

  scrollTo(position: number) {
    if (this.capituloContainer) {
      this.capituloContainer.nativeElement.scrollTop = position;
    }
  }

  getScrollPosition(): number {
    return this.capituloContainer?.nativeElement.scrollTop || 0;
  }

  getScrollHeight(): number {
    return this.capituloContainer?.nativeElement.scrollHeight || 0;
  }

  getClientHeight(): number {
    return this.capituloContainer?.nativeElement.clientHeight || 0;
  }
}
