import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollToTopComponent } from '../../components/scroll-to-top/scroll-to-top.component';
import { AnalyticsMapComponent } from '../../components/analytics-map/analytics-map.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [ScrollToTopComponent, RouterLink, AnalyticsMapComponent, TranslatePipe],
  templateUrl: './sobre.component.html',
  styleUrl: './sobre.component.css'
})
export class SobreComponent implements OnInit {

  stats = {
    capitulos: 0,
    total: 100,
    proximaFecha: '14 Jun 2026'
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.clear();
    console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #ff00ff; font-weight: bold;');
    console.log('%c║                 📖 SOBRE EL PROYECTO                          ║', 'color: #ff00ff; font-size: 16px; font-weight: bold;');
    console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #ff00ff; font-weight: bold;');
    console.log('%c\n💾 100% Open Source · 0% Analytics · 0% Paywalls', 'color: #00ffff; font-size: 13px; font-weight: bold;');
    console.log('%cFilosofía: Calidad sobre viralidad', 'color: #ff00ff; font-size: 12px; font-style: italic;');
    console.log('%c\n🚀 Publicación: Días 14 y 23 · Jun 2026 - Ago 2030', 'color: #888888; font-size: 11px;');
    console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #888888;');

    this.cdr.detectChanges();
  }
}
