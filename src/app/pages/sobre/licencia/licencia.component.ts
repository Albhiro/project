import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollToTopComponent } from '../../../components/scroll-to-top/scroll-to-top.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-licencia',
  standalone: true,
  imports: [ScrollToTopComponent, RouterLink, TranslatePipe],
  templateUrl: './licencia.component.html',
  styleUrl: './licencia.component.css'
})
export class LicenciaComponent implements OnInit {

  currentYear = new Date().getFullYear();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.clear();
    console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #ff0000; font-weight: bold;');
    console.log('%c║              ⚖️ LICENCIA Y COPYRIGHT                          ║', 'color: #ff0000; font-size: 16px; font-weight: bold;');
    console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #ff0000; font-weight: bold;');
    console.log('%c\n© 2024-' + this.currentYear + ' TRENDING GHOST · Todos los derechos reservados', 'color: #ff0000; font-size: 13px; font-weight: bold;');
    console.log('%cContenido: All Rights Reserved · Código: MIT License', 'color: #ff00ff; font-size: 12px; font-style: italic;');
    console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #888888;');

    this.cdr.detectChanges();
  }
}
