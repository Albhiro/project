import { Component, signal, HostListener, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HeaderVisibilityService } from './services/header-visibility.service';
import { AnalyticsService } from './services/analytics.service';
import { LanguageSelectorComponent } from './shared/components/language-selector/language-selector.component';
import { TranslatePipe } from './shared/pipes/translate.pipe';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, LanguageSelectorComponent, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('TRENDING GHOST');

  // Mobile menu state
  mobileMenuOpen = false;

  // Header scroll state
  headerScrolled = false;

  // Hero logo visibility state (for header logo control)
  heroLogoVisible = true;

  // Lector mode (hide header/footer)
  isLectorMode = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private headerVisibility: HeaderVisibilityService,
    private analytics: AnalyticsService // 📊 Inyectar analytics
  ) {
    // Detectar cuando estamos en el lector
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLectorMode = event.url.includes('/capitulos/') && event.url.split('/').length > 3;

      // Añadir/quitar clase al body para ocultar scroll
      if (isPlatformBrowser(this.platformId)) {
        if (this.isLectorMode) {
          document.body.classList.add('lector-mode');
        } else {
          document.body.classList.remove('lector-mode');
        }

        // 🔥 SCROLL TO TOP en cada navegación
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant' // Sin animación para que sea inmediato
        });
      }

      // Cerrar menú móvil al navegar
      this.mobileMenuOpen = false;
    });
    // Easter Egg mejorado para developers
    if (isPlatformBrowser(this.platformId)) {
      console.clear();
      console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #00ffff; font-weight: bold;');
      console.log('%c║                                                               ║', 'color: #00ffff; font-weight: bold;');
      console.log('%c║              👻 TRENDING GHOST (バズれゴースト)                  ║', 'color: #00ffff; font-size: 18px; font-weight: bold;');
      console.log('%c║                                                               ║', 'color: #00ffff; font-weight: bold;');
      console.log('%c║         "Esse est percipi" — Ser es ser percibido            ║', 'color: #ff00ff; font-style: italic;');
      console.log('%c║                                                               ║', 'color: #00ffff; font-weight: bold;');
      console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #00ffff; font-weight: bold;');
      console.log('%c\n🔍 HOLA, INSPECTOR CURIOSO', 'color: #00ffff; font-size: 16px; font-weight: bold;');
      console.log('%cBienvenido a la consola. Veo que eres de los que miran detrás del telón. 🎭', 'color: #ffffff; font-size: 12px;');
      console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #888888;');
      console.log('%c\n💾 STACK TÉCNICO:', 'color: #00ffff; font-size: 14px; font-weight: bold;');
      console.log('%c  • Framework: Angular 21 (standalone components)', 'color: #ffffff; font-size: 11px;');
      console.log('%c  • Styling: CSS puro (0 frameworks, 0 bloat)', 'color: #ffffff; font-size: 11px;');
      console.log('%c  • Hosting: GitHub Pages (gratis, ético, open source)', 'color: #ffffff; font-size: 11px;');
      console.log('%c  • Analytics: Ninguno (no te rastreamos, lo prometemos)', 'color: #ffffff; font-size: 11px;');
      console.log('%c  • Cookies: Ninguna (ni siquiera funcionales)', 'color: #ffffff; font-size: 11px;');
      console.log('%c\n🎨 FILOSOFÍA DE DISEÑO:', 'color: #ff00ff; font-size: 14px; font-weight: bold;');
      console.log('%c  • Contraste extremo: Cyan (#00ffff) vs Magenta (#ff00ff)', 'color: #ffffff; font-size: 11px;');
      console.log('%c  • Neon effects sin exagerar (sutil pero presente)', 'color: #ffffff; font-size: 11px;');
      console.log('%c  • Responsive desde móvil hasta 4K', 'color: #ffffff; font-size: 11px;');
      console.log('%c  • Dark mode por defecto (tus ojos nos lo agradecerán)', 'color: #ffffff; font-size: 11px;');
      console.log('%c\n🎁 EASTER EGGS DISPONIBLES:', 'color: #00ffff; font-size: 14px; font-weight: bold;');
      console.log('%c  • Navega a "Mundo" → Mensaje especial para hackers', 'color: #888888; font-size: 11px;');
      console.log('%c  • Navega a "Personajes" → Descubre el logro "Curioso Cibernético"', 'color: #888888; font-size: 11px;');
      console.log('%c  • Mira el código fuente → Está en GitHub, no seas tímido', 'color: #888888; font-size: 11px;');
      console.log('%c\n🤝 CONTRIBUCIONES:', 'color: #ff00ff; font-size: 14px; font-weight: bold;');
      console.log('%cEste sitio es open source. Si encuentras bugs o quieres mejorar algo:', 'color: #ffffff; font-size: 11px;');
      console.log('%c  → GitHub: github.com/[tu-usuario]/trending-ghost', 'color: #00ffff; font-size: 11px;');
      console.log('%c\n⚠️ SPOILER WARNING:', 'color: #ff00ff; font-size: 14px; font-weight: bold;');
      console.log('%cSÍ, el contenido bloqueado está en el HTML (blur != seguridad).', 'color: #ffffff; font-size: 11px;');
      console.log('%cNO, no te vamos a juzgar si lo miras.', 'color: #ffffff; font-size: 11px;');
      console.log('%cPERO... ¿dónde está la diversión en eso? La historia se disfruta en orden. 📖', 'color: #888888; font-size: 11px; font-style: italic;');
      console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #888888;');
      console.log('%c\n👻 "En un mundo donde ser viral es ser Dios, los invisibles son los únicos libres."', 'color: #00ffff; font-size: 13px; font-style: italic;');
      console.log('%c\nDisfruta la lectura. Sin presión. Sin tracking. Sin bullshit. 🚀', 'color: #ff00ff; font-size: 12px;');
      console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #888888;');
    }
  }

  ngOnInit() {
    // Suscribirse al estado de visibilidad del hero-logo desde el servicio
    this.headerVisibility.heroLogoVisible$.subscribe(visible => {
      this.heroLogoVisible = visible;
    });
  }

  // Detectar scroll para header sticky mejorado
  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.headerScrolled = window.scrollY > 50;
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;

    // Prevenir scroll del body cuando el menú está abierto
    if (isPlatformBrowser(this.platformId)) {
      if (this.mobileMenuOpen) {
        document.body.classList.add('menu-open');
      } else {
        document.body.classList.remove('menu-open');
      }
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;

    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('menu-open');
    }
  }
}
