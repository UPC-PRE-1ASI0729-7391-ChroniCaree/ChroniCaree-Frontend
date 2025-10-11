// Estadísticos básicos y tendencia (regresión lineal)
export type Trend = 'up' | 'down' | 'flat';

export interface TimeSample {
  timestamp: string; // ISO
  value: number;
}

export interface SummaryStats {
  count: number;
  mean: number | null;
  min: number | null;
  max: number | null;
  slope: number | null;   // pendiente (tendencia)
  trend: Trend;           // up/down/flat
}

export function summarize(samples: TimeSample[]): SummaryStats {
  const n = samples.length;
  if (n === 0) {
    return { count: 0, mean: null, min: null, max: null, slope: null, trend: 'flat' };
  }

  const values = samples.map(s => s.value).filter(v => Number.isFinite(v));
  const count = values.length;
  if (count === 0) {
    return { count: 0, mean: null, min: null, max: null, slope: null, trend: 'flat' };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Regresión lineal simple sobre índice temporal (ordenados por fecha)
  const sorted = [...samples].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const xs = sorted.map((_, i) => i + 1);
  const ys = sorted.map(s => s.value);

  const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;

  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;

  // Umbral para “flat”: pendiente muy pequeña
  const eps = Math.abs(yMean) > 1 ? 0.01 * Math.abs(yMean) : 0.01;
  const trend: Trend = Math.abs(slope) <= eps ? 'flat' : (slope > 0 ? 'up' : 'down');

  return { count, mean, min, max, slope, trend };
}

export function percentChange(base: number | null, next: number | null): number | null {
  if (base === null || next === null) return null;
  if (base === 0) {
    if (next === 0) return 0;
    return next > 0 ? Infinity : -Infinity; // manejar fuera en UI
  }
  return ((next - base) / base) * 100;
}
