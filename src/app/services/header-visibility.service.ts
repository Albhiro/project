import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio para controlar la visibilidad del logo del header
 * basado en si el hero-logo está visible en pantalla
 */
@Injectable({
  providedIn: 'root'
})
export class HeaderVisibilityService {
  // Estado interno del hero logo (visible/invisible)
  private heroLogoVisible = new BehaviorSubject<boolean>(true);

  // Observable público para que otros componentes se suscriban
  public heroLogoVisible$: Observable<boolean> = this.heroLogoVisible.asObservable();

  constructor() {}

  /**
   * Actualiza el estado de visibilidad del hero-logo
   * @param visible - true si el hero-logo está visible en viewport
   */
  setHeroLogoVisibility(visible: boolean): void {
    this.heroLogoVisible.next(visible);
  }

  /**
   * Obtiene el estado actual de visibilidad (sync)
   * @returns true si el hero-logo está visible
   */
  getHeroLogoVisibility(): boolean {
    return this.heroLogoVisible.value;
  }
}
