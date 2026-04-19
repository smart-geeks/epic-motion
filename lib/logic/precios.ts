/**
 * Calcula la mensualidad proporcional según las disciplinas seleccionadas.
 * Si la alumna toma todas las disciplinas paga la tarifa completa;
 * si toma un subconjunto paga proporcional (redondeado al peso entero).
 */
export function calcularMonto(tarifa: number, totalDisciplinas: number, seleccionadas: number): number {
  if (totalDisciplinas === 0 || seleccionadas === 0) return 0;
  if (seleccionadas >= totalDisciplinas) return tarifa;
  return Math.round((tarifa * seleccionadas) / totalDisciplinas);
}
