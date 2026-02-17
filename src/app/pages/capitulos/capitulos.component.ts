import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ScrollToTopComponent } from '../../components/scroll-to-top/scroll-to-top.component';
import { CapitulosDataService, Volumen, CapituloMeta } from '../../services/capitulos-data.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-capitulos',
  standalone: true,
  imports: [RouterLink, ScrollToTopComponent, CommonModule, TranslatePipe],
  templateUrl: './capitulos.component.html',
  styleUrl: './capitulos.component.css'
})
export class CapitulosComponent implements OnInit {
  // Estado del componente
  selectedVolumen: number = 1;
  volumenes: Volumen[] = [];
  capitulosPublicados: number = 0;
  totalCapitulos: number = 100;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private capitulosData: CapitulosDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Log de bienvenida
    console.clear();
    console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #00ffff; font-weight: bold;');
    console.log('%c║                📚 CAPÍTULOS - ÍNDICE                          ║', 'color: #00ffff; font-size: 16px; font-weight: bold;');
    console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #00ffff; font-weight: bold;');
    console.log('%c\n📖 Cargando capítulos desde JSON...', 'color: #ff00ff; font-size: 13px; font-weight: bold;');

    // Cargar índice desde el servicio
    this.capitulosData.getIndex().subscribe({
      next: (index) => {
        this.volumenes = index.volumenes;
        this.capitulosPublicados = index.publicados;
        this.totalCapitulos = 100;
        this.loading = false;

        // Forzar detección de cambios
        this.cdr.detectChanges();

        // Log de éxito
        console.log('%c✅ Índice cargado exitosamente', 'color: #00ff00; font-weight: bold;');
        console.log(`%c📖 ${index.total} capítulos · ${index.volumenes.length} volúmenes`, 'color: #ff00ff; font-size: 13px;');
        console.log(`%c✅ ${index.publicados} publicados · 📅 Próximo: ${index.proximo_publicacion || 'TBD'}`, 'color: #00ffff; font-size: 12px;');
        console.log('%c\n💡 TIP: Los capítulos se desbloquean progresivamente al publicarse.', 'color: #ff00ff; font-size: 11px;');
        console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #888888;');
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error cargando capítulos. Por favor, recarga la página.';
        this.cdr.detectChanges();
        console.error('❌ Error cargando índice:', err);
      }
    });
  }

  // Getter para progreso global
  get progreso(): number {
    if (this.totalCapitulos === 0) return 0;
    return (this.capitulosPublicados / this.totalCapitulos) * 100;
  }

  // Seleccionar volumen activo
  selectVolumen(numero: number): void {
    this.selectedVolumen = numero;
  }

  // Obtener capítulos de un volumen específico
  getCapitulosDelVolumen(volumen: number): CapituloMeta[] {
    const vol = this.volumenes.find(v => v.numero === volumen);
    return vol ? vol.capitulos : [];
  }

  // Calcular progreso de un volumen
  getProgresoVolumen(volumen: number): number {
    const caps = this.getCapitulosDelVolumen(volumen);
    if (caps.length === 0) return 0;
    const publicados = caps.filter(c => c.publicado).length;
    return (publicados / caps.length) * 100;
  }
}
