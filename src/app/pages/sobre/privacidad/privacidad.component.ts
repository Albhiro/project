import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollToTopComponent } from '../../../components/scroll-to-top/scroll-to-top.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-privacidad',
  standalone: true,
  imports: [ScrollToTopComponent, RouterLink, TranslatePipe],
  templateUrl: './privacidad.component.html',
  styleUrl: './privacidad.component.css'
})
export class PrivacidadComponent implements OnInit {

  currentYear = new Date().getFullYear();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.clear();
    console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #00ff00; font-weight: bold;');
    console.log('%c║            🔒 POLÍTICA DE PRIVACIDAD                          ║', 'color: #00ff00; font-size: 16px; font-weight: bold;');
    console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #00ff00; font-weight: bold;');
    console.log('%c\n🚫 0 Cookies · 0 Analytics · 0 Tracking · 0 Data Collection', 'color: #00ff00; font-size: 13px; font-weight: bold;');
    console.log('%cTu privacidad es absoluta. No sabemos quién eres.', 'color: #00ffff; font-size: 12px; font-style: italic;');
    console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #888888;');

    this.cdr.detectChanges();
  }
}
