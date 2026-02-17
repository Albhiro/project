import { Component, OnInit, OnDestroy, HostListener, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CapituloComponent } from '../../components/capitulo/capitulo.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-lector',
  standalone: true,
  imports: [CommonModule, CapituloComponent, TranslatePipe],
  templateUrl: './lector.component.html',
  styleUrl: './lector.component.css'
})
export class LectorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CapituloComponent) capituloComponent!: CapituloComponent;

  volumen: number = 1;
  numeroCapitulo: number = 1;
  tituloCapitulo: string = '';
  cargando: boolean = true;

  // Sistema de Auto-Scroll con Slider
  modoEnfocado: boolean = false;
  autoScrollActivo: boolean = false;
  velocidadScroll: number = 2; // Rango: 0.5 (lento) a 4 (ultra rápido)
  velocidadWPM: number = 400; // WPM calculado
  tiempoInicio: number = 0;
  tiempoTotal: number = 0; // en segundos
  private intervalId: any;
  private autoScrollInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.calcularWPM(); // Inicializar WPM
  }

  ngOnInit() {
    // Obtener parámetros de la ruta
    this.route.params.subscribe(params => {
      this.volumen = +params['volumen'] || 1;
      this.numeroCapitulo = +params['numero'] || 1;
      this.cargarDatosCapitulo();
    });

    // Iniciar cronómetro
    this.iniciarCronometro();

    // Log inicial
    console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ffff; font-weight: bold;');
    console.log('%c   TRENDING GHOST - LECTOR REFACTORIZADO', 'color: #00ffff; font-size: 16px; font-weight: bold;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ffff; font-weight: bold;');
    console.log('%c\n🎬 Auto-Scroll Cinematográfico', 'color: #ff00ff; font-size: 14px; font-weight: bold;');
    console.log('%c   • Space Bar = Play/Pause', 'color: #888888;');
    console.log('%c   • Slider = 0.5x - 4.0x (188-800 WPM)', 'color: #888888;');
    console.log('%c   • Progreso en tiempo real\n', 'color: #888888;');
  }

  ngAfterViewInit() {
    // Componente de capítulo ya cargado
    console.log('%c✓ Componente de capítulo listo', 'color: #00ff00; font-size: 11px;');
  }

  ngOnDestroy() {
    this.detenerAutoScroll();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CARGA DE DATOS
  // ═══════════════════════════════════════════════════════════════

  cargarDatosCapitulo() {
    // Aquí solo cargamos metadatos, el contenido lo maneja CapituloComponent
    this.cargando = true;

    const titulos: { [key: number]: string } = {
      1: 'El Invisible',
      2: 'La Eterna',
      3: 'El Simulacro'
    };

    this.tituloCapitulo = titulos[this.numeroCapitulo] || 'Capítulo sin título';
    this.cargando = false;

    // Forzar detección de cambios
    this.cdr.detectChanges();

    console.log(`%c📖 Capítulo ${this.numeroCapitulo}: ${this.tituloCapitulo}`, 'color: #00ffff; font-size: 12px;');
  }

  // ═══════════════════════════════════════════════════════════════
  // SISTEMA DE AUTO-SCROLL REFACTORIZADO
  // ═══════════════════════════════════════════════════════════════

  iniciarCronometro() {
    this.tiempoInicio = Date.now();

    // Actualizar tiempo cada segundo
    this.intervalId = setInterval(() => {
      this.tiempoTotal = Math.floor((Date.now() - this.tiempoInicio) / 1000);
    }, 1000);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Barra espaciadora = toggle play/pause
    if (event.code === 'Space' && !this.modoEnfocado) {
      event.preventDefault();
      this.toggleAutoScroll();
    }
  }

  toggleAutoScroll() {
    this.autoScrollActivo = !this.autoScrollActivo;

    if (this.autoScrollActivo) {
      this.iniciarAutoScroll();
      console.log('%c▶ AUTO-SCROLL ACTIVADO', 'color: #00ffff; font-size: 12px; font-weight: bold;');
    } else {
      this.detenerAutoScroll();
      console.log('%c⏸ AUTO-SCROLL PAUSADO', 'color: #ff00ff; font-size: 12px; font-weight: bold;');
    }
  }

  iniciarAutoScroll() {
    if (!this.capituloComponent) {
      console.error('%c⚠ Componente de capítulo no disponible', 'color: #ff0000;');
      return;
    }

    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }

    const baseSpeed = 0.8; // píxeles por tick
    const speed = baseSpeed * this.velocidadScroll;

    const container = this.capituloComponent.getScrollContainer();
    if (!container) {
      console.error('%c⚠ Contenedor de scroll no encontrado', 'color: #ff0000;');
      return;
    }

    // Log solo la primera vez que se inicia
    if (!this.autoScrollActivo) {
      console.log('%c📦 Contenedor encontrado:', 'color: #00ff00;', container);
      console.log('%c📏 scrollHeight:', 'color: #00ffff;', container.scrollHeight);
      console.log('%c📏 clientHeight:', 'color: #00ffff;', container.clientHeight);
      console.log('%c📏 scrollTop inicial:', 'color: #00ffff;', container.scrollTop);
    }

    // Variables de seguridad
    let ultimaPosicion = container.scrollTop;
    let contadorAtascado = 0;

    // Añadir clase para animación de scrollbar
    container.classList.add('auto-scrolling');

    this.autoScrollInterval = setInterval(() => {
      const posicionActual = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const progresoActual = this.getScrollProgreso();

      // DETECCIÓN DE FINAL: Parar al 95%
      if (progresoActual >= 95) {
        console.log('%c✓ Auto-scroll completado (95%)', 'color: #00ff00; font-size: 11px;');
        this.detenerAutoScroll();
        return;
      }

      // DETECCIÓN DE FINAL POR POSICIÓN
      if (posicionActual + clientHeight >= scrollHeight - 50) {
        console.log('%c✓ Final del documento alcanzado', 'color: #00ff00; font-size: 11px;');
        this.detenerAutoScroll();
        return;
      }

      // DETECCIÓN DE ATASCO
      if (Math.abs(posicionActual - ultimaPosicion) < 0.5) {
        contadorAtascado++;

        if (contadorAtascado > 30) {
          console.log('%c⚠ Auto-scroll detenido: atascado en', 'color: #ff9900;', posicionActual);
          this.detenerAutoScroll();
          return;
        }
      } else {
        contadorAtascado = 0;
      }

      // Realizar scroll
      container.scrollTop += speed;
      ultimaPosicion = posicionActual;
    }, 16); // ~60fps
  }

  detenerAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
    this.autoScrollActivo = false;

    // Quitar clase de animación
    if (this.capituloComponent) {
      const container = this.capituloComponent.getScrollContainer();
      if (container) {
        container.classList.remove('auto-scrolling');
      }
    }
  }

  cambiarVelocidad(velocidad: number) {
    this.velocidadScroll = velocidad;
    this.calcularWPM();

    // Si ya está activo, reiniciar con nueva velocidad SIN cambiar el estado
    if (this.autoScrollActivo) {
      // Solo limpiar el intervalo, NO cambiar autoScrollActivo
      if (this.autoScrollInterval) {
        clearInterval(this.autoScrollInterval);
        this.autoScrollInterval = null;
      }

      // Reiniciar inmediatamente con nueva velocidad
      this.iniciarAutoScroll();
    }

    console.log(`%c⚡ Velocidad actualizada: ${this.velocidadWPM} WPM`, 'color: #ff00ff; font-size: 11px;');
  }

  onSliderChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.cambiarVelocidad(parseFloat(input.value));
  }

  calcularWPM() {
    const wpmBase = 100;
    const wpmPorUnidad = 175;
    this.velocidadWPM = Math.round(wpmBase + (this.velocidadScroll * wpmPorUnidad));
  }

  getScrollProgreso(): number {
    if (!this.capituloComponent) return 0;

    const container = this.capituloComponent.getScrollContainer();
    if (!container) return 0;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  }

  toggleModoEnfocado() {
    this.modoEnfocado = !this.modoEnfocado;

    if (this.modoEnfocado) {
      console.log('%c🎯 MODO ENFOCADO ACTIVADO', 'color: #00ffff; font-size: 14px; font-weight: bold;');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GETTERS PARA EL TEMPLATE
  // ═══════════════════════════════════════════════════════════════

  get progreso(): number {
    return Math.round(this.getScrollProgreso());
  }

  get tiempoLectura(): string {
    const minutos = Math.floor(this.tiempoTotal / 60);
    const segundos = this.tiempoTotal % 60;

    if (minutos === 0) return `${segundos}s`;
    return `${minutos}min ${segundos}s`;
  }

  get velocidadTexto(): string {
    return `${this.velocidadWPM} WPM`;
  }

  get velocidadLabel(): string {
    if (this.velocidadScroll < 1) return '🐢 Muy Lento';
    if (this.velocidadScroll < 1.5) return '🚶 Lento';
    if (this.velocidadScroll < 2.5) return '🏃 Normal';
    if (this.velocidadScroll < 3.5) return '⚡ Rápido';
    return '🚀 Ultra Rápido';
  }

  get estadoTexto(): string {
    if (this.autoScrollActivo) return '▶ Reproduciendo';
    return '⏸ Pausado';
  }

  // ═══════════════════════════════════════════════════════════════
  // NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════════

  volverAlIndice() {
    this.router.navigate(['/capitulos']);
  }

  capituloAnterior() {
    if (this.numeroCapitulo > 1) {
      this.router.navigate(['/capitulos', this.volumen, this.numeroCapitulo - 1]);
    }
  }

  capituloSiguiente() {
    // Solo hay capítulo 1 por ahora
    if (this.numeroCapitulo < 1) {
      this.router.navigate(['/capitulos', this.volumen, this.numeroCapitulo + 1]);
    }
  }

  get hayAnterior(): boolean {
    return this.numeroCapitulo > 1;
  }

  get haySiguiente(): boolean {
    return false; // Solo hay capítulo 1 por ahora
  }
}
