import { Injectable } from '@angular/core';

/**
 * Servicio que gestiona qué contenido está desbloqueado según capítulos publicados
 * Evita spoilers mostrando solo información revelada hasta el cap actual
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  // ACTUALIZAR ESTO MANUALMENTE AL PUBLICAR CADA CAPÍTULO
  private capituloActual = 0; // 0 = antes del lanzamiento, 1 = después del 14 Jun 2026, etc.

  /**
   * Obtiene el número del último capítulo publicado
   */
  getCapituloActual(): number {
    return this.capituloActual;
  }

  /**
   * Verifica si un capítulo específico está publicado
   */
  isCapituloPublicado(numero: number): boolean {
    return numero <= this.capituloActual;
  }

  /**
   * Verifica si una sección de "Mundo" está desbloqueada
   * Mapeo: cap N desbloquea sección X
   */
  isMundoSeccionDesbloqueada(seccionId: string): { desbloqueada: boolean; requiereCap: number } {
    const unlockMap: { [key: string]: number } = {
      'colapso': 1,        // Cap 1: Bazure despierta, contexto del Colapso
      'ciudad': 1,         // Cap 1: Descripción inicial de Ciudad de Neón
      'algoritmo': 1,      // Cap 1: Introducción al Algoritmo 2.0
      'poderes': 1,        // Cap 1: Sistema básico de poder (views = invisibilidad)
      'desierto': 5,       // Cap 5: Primera mención del Desierto del Lag
      'mar': 10,           // Cap 10: Descubrimiento del Mar de Datos
      'gacha': 15,         // Cap 15: Introducción al Archipiélago Gacha
      'deepweb': 25,       // Cap 25: Final Volumen 1 - Revelación de la Deep Web
      'nube': 40,          // Cap 40: Volumen 2 - Cielo de la Nube y la élite
      'servidor-cero': 75  // Cap 75: Volumen 3 - Revelación del Servidor Cero
    };

    const requiereCap = unlockMap[seccionId] || 999;
    return {
      desbloqueada: this.capituloActual >= requiereCap,
      requiereCap
    };
  }

  /**
   * Verifica si un personaje está desbloqueado
   * Mapeo: cap N introduce al personaje X
   */
  isPersonajeDesbloqueado(nombre: string): { desbloqueado: boolean; requiereCap: number } {
    const unlockMap: { [key: string]: number } = {
      // PROTAGONISTAS
      'Bazure': 1,         // Cap 1: Protagonista desde el inicio
      'Shiva': 2,          // Cap 2: "La Eterna" - Primera aliada
      'Bitaru': 3,         // Cap 3: Admin hacker se une al equipo

      // ANTAGONISTAS
      'Rex Chrome': 5,     // Cap 5: Primer antagonista principal
      'Mara': 8,           // Cap 8: Antagonista secundaria
      'Kronos': 20,        // Cap 20: Antagonista God-Tier revelado
      'Los 12 Administradores': 25, // Cap 25: Final Vol 1 - Revelación

      // ALIADOS/SECUNDARIOS
      'Lucy': 4,           // Cap 4: Líder de la Resistencia
      'Milo': 4,           // Cap 4: Estratega se une junto a Lucy
      'John Offline': 6,   // Cap 6: Sabio analógico aparece
      'Abuela Cassette': 7, // Cap 7: Guardiana de memorias

      // SECUNDARIOS (Por defecto todos desbloqueados)
      'Los Alto-Res': 1,
      'Los Mid-Res': 1,
      'Los Low-Res': 1,
      'Los Glitch': 1,
      'El Servidor Cero': 75
    };

    const requiereCap = unlockMap[nombre] || 1; // Default: desbloqueado
    return {
      desbloqueado: this.capituloActual >= requiereCap,
      requiereCap
    };
  }

  /**
   * Obtiene mensaje de "contenido bloqueado"
   */
  getMensajeBloqueado(tipo: 'seccion' | 'personaje', nombre: string, requiereCap: number): string {
    if (tipo === 'seccion') {
      return `🔒 Esta sección se desbloqueará con el Capítulo ${requiereCap}`;
    } else {
      return `🔒 Este personaje aparece en el Capítulo ${requiereCap}`;
    }
  }

  /**
   * Calcula el progreso total de la historia (0-100%)
   */
  getProgresoTotal(): number {
    const totalCapitulos = 100;
    return (this.capituloActual / totalCapitulos) * 100;
  }

  /**
   * Obtiene el volumen actual basado en el capítulo
   */
  getVolumenActual(): number {
    if (this.capituloActual === 0) return 0;
    return Math.floor((this.capituloActual - 1) / 25) + 1;
  }

  /**
   * Actualiza el capítulo actual (solo para testing o actualización manual)
   * En producción, esto debería actualizarse con cada release
   */
  setCapituloActual(numero: number): void {
    this.capituloActual = numero;
    console.log(`📚 Progreso actualizado: Capítulo ${numero} desbloqueado`);
  }
}
