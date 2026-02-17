import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ScrollToTopComponent } from '../../components/scroll-to-top/scroll-to-top.component';
import { HeaderVisibilityService } from '../../services/header-visibility.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { filter } from 'rxjs/operators';

// Interface para configuración de logos
interface LogoConfig {
  src: string;
  duration?: number; // Duración en ms, si no se especifica se genera aleatoria (400-2000ms)
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ScrollToTopComponent, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  // ViewChild para el elemento hero-logo
  @ViewChild('heroLogo') heroLogoElement!: ElementRef;

  constructor(
    private cdr: ChangeDetectorRef,
    private headerVisibility: HeaderVisibilityService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Detectar cada vez que se navega al home (incluso si el componente ya existe)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Si la URL es exactamente '/' (home), resetear visibilidad
      if (event.url === '/' || event.url === '') {
        this.headerVisibility.setHeroLogoVisibility(true);
      }
    });
  }


  // Array de logos con duración personalizada

 logos = [
    '/assets/logo-sangre.svg',           // Variante 9: Sangre extrema con chorros y gotas
    '/assets/logo-corrupto.svg',          // Variante 1: Glitch RGB corrupto
    '/assets/logo-satira.svg',             // Variante 3: Viral satírica con UI fake
    '/assets/logo-animado.svg',           // Variante 7: Animado con glitch
    '/assets/logo-invisible.svg',                // Variante 5: Invisible (404)
    '/assets/logo-hiper.svg',         // Variante 6: 8K Hiperrealismo saturado
    '/assets/logo-lowres.svg',          // Variante 4: MS Paint Low-Res
    '/assets/logo-live.svg',            // Variante 8: Viral en vivo con contador
    '/assets/logo-original.svg'                  // Original limpio
  ];

  currentLogoIndex = 0;
  currentLogo: string = this.logos[0];
  isGlitching = false;
  private currentTimeout: any;
  private intersectionObserver?: IntersectionObserver;

  ngOnInit(): void {
    // Al entrar al home, ocultar inmediatamente el logo del header
    // (porque el hero-logo está visible al inicio)
    this.headerVisibility.setHeroLogoVisibility(true);

    console.clear();
    console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #00ffff; font-weight: bold;');
    console.log('%c║                    🏠 HOME - INICIO                           ║', 'color: #00ffff; font-size: 16px; font-weight: bold;');
    console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #00ffff; font-weight: bold;');
    console.log('%c\n👻 TRENDING GHOST (バズれゴースト)', 'color: #00ffff; font-size: 14px; font-weight: bold;');
    console.log('%cUna sátira cyberpunk ultraviolenta sobre no ser viral.', 'color: #ff00ff; font-size: 12px; font-style: italic;');
    console.log('%c\n"Esse est percipi" — Ser es ser percibido', 'color: #888888; font-size: 11px; font-style: italic;');
    console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #888888;');

    // Iniciar rotación de logos cada 8 segundos
    this.startLogoRotation();
  }

  ngAfterViewInit(): void {
    // Observar visibilidad del hero-logo para controlar header
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        if (this.heroLogoElement) {
          this.intersectionObserver = new IntersectionObserver(([entry]) => {
            this.headerVisibility.setHeroLogoVisibility(entry.isIntersecting);
          }, {
            threshold: 0.1
          });

          this.intersectionObserver.observe(this.heroLogoElement.nativeElement);
        }
      }, 100);
    }
  }

  ngOnDestroy(): void {
    // Limpiar timeout y observer al destruir componente
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Al salir del home, forzar visibilidad del logo header a TRUE
    this.headerVisibility.setHeroLogoVisibility(false);
  }

  startLogoRotation(): void {
    setInterval(() => {
      this.switchLogoWithGlitch();
    }, 1800); // Cambia cada 3 segundos para testing
  }

  switchLogoWithGlitch(): void {
    // Activar glitch
    this.isGlitching = true;

    // Log para debug
    console.log(`🔄 Cambiando logo... Actual: ${this.currentLogoIndex} -> Siguiente: ${(this.currentLogoIndex + 1) % this.logos.length}`);

    // Después de 300ms (durante el glitch), cambiar el logo
    setTimeout(() => {
      this.currentLogoIndex = (this.currentLogoIndex + 1) % this.logos.length;
      this.currentLogo = this.logos[this.currentLogoIndex];
      console.log(`✅ Logo cambiado a: ${this.currentLogo}`);

      // Forzar detección de cambios
      this.cdr.detectChanges();
    }, 300);

    // Desactivar glitch después de 600ms
    setTimeout(() => {
      this.isGlitching = false;
      this.cdr.detectChanges();
    }, 600);
  }
}
