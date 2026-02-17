import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollToTopComponent } from '../../../components/scroll-to-top/scroll-to-top.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [ScrollToTopComponent, RouterLink, TranslatePipe],
  templateUrl: './terminos.component.html',
  styleUrl: './terminos.component.css'
})
export class TerminosComponent implements OnInit {

  currentYear = new Date().getFullYear();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.clear();
    console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #ff9900; font-weight: bold;');
    console.log('%c║            📜 TÉRMINOS DE USO                                 ║', 'color: #ff9900; font-size: 16px; font-weight: bold;');
    console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #ff9900; font-weight: bold;');
    console.log('%c\n🆓 Acceso gratuito perpetuo · Sin restricciones abusivas', 'color: #ff9900; font-size: 13px; font-weight: bold;');
    console.log('%cLee, disfruta, respeta. Es así de simple.', 'color: #00ffff; font-size: 12px; font-style: italic;');
    console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #888888;');

    this.cdr.detectChanges();
  }
}
