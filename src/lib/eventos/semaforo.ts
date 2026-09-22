/**
 * semaforo.ts — Lógica compartida del Semáforo de Comprensión (DRY).
 *
 * Fuente única de verdad para el cálculo de estado del semáforo en eventos
 * presenciales. Consumido por server actions y client components.
 * Funciones puras — sin dependencias de runtime (compatible Edge Runtime).
 */

export type EstadoSemaforo = 'VERDE' | 'AMARILLO' | 'ROJO';

export interface SemaforoResultado {
  estado: EstadoSemaforo;
  porcentaje: number;
  votosNegativos: number;
  totalAcreditados: number;
}

/**
 * Calcula el estado del semáforo de comprensión (VERDE, AMARILLO, ROJO)
 * basándose en los votos negativos y la cantidad total de acreditados.
 *
 * Umbrales:
 * - VERDE: < 30% de alertas
 * - AMARILLO: 30% - 49% de alertas
 * - ROJO: >= 50% de alertas
 */
export function calcularEstadoSemaforo(
  votosNegativos: number,
  totalAcreditados: number
): SemaforoResultado {
  // Previene división por cero y maneja el caso de más votos que acreditados
  const denominador = Math.max(totalAcreditados, votosNegativos, 1);
  const porcentaje = Math.round((votosNegativos / denominador) * 100);

  let estado: EstadoSemaforo = 'VERDE';
  if (porcentaje >= 50) {
    estado = 'ROJO';
  } else if (porcentaje >= 30) {
    estado = 'AMARILLO';
  }

  return {
    estado,
    porcentaje,
    votosNegativos,
    totalAcreditados,
  };
}