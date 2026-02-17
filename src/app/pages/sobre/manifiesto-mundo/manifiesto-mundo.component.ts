import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollToTopComponent } from '../../../components/scroll-to-top/scroll-to-top.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-manifiesto-mundo',
  standalone: true,
  imports: [ScrollToTopComponent, RouterLink, TranslatePipe],
  templateUrl: './manifiesto-mundo.component.html',
  styleUrl: './manifiesto-mundo.component.css'
})
export class ManifiestoMundoComponent implements OnInit {

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.clear();
    console.log('%c╔═══════════════════════════════════════════════════════════════╗', 'color: #00ffff; font-weight: bold;');
    console.log('%c║          📜 CÓDIGO DEL MUNDO - TRENDING GHOST                 ║', 'color: #00ffff; font-size: 16px; font-weight: bold;');
    console.log('%c╚═══════════════════════════════════════════════════════════════╝', 'color: #00ffff; font-weight: bold;');
    console.log('%c\n⚖️ SISTEMA ALGORÍTMICO 2.0 · Vigente desde 01/01/2024 00:00:00 UTC', 'color: #00ffff; font-size: 13px; font-weight: bold;');
    console.log('%c"Esse est percipi" — Ser es ser percibido', 'color: #ff00ff; font-size: 12px; font-style: italic;');
    console.log('%c\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'color: #888888;');

    this.cdr.detectChanges();
  }
}
