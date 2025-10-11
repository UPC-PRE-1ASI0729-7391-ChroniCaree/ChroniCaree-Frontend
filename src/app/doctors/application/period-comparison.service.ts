import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, forkJoin, Observable, of } from 'rxjs';
import { percentChange, summarize, SummaryStats, TimeSample, Trend } from '../../shared/domain/utils/stats.utils';

export interface Period { from: string; to: string; } // ISO (incluye hora 00:00 si quieres)
export type DataSufficiency = 'sufficient' | 'insufficient';

export interface ComparisonResult {
  sufficiency: DataSufficiency;
  reason?: string;
  metric: string;
  basePeriod: Period;
  comparePeriod: Period;
  base: SummaryStats;
  compare: SummaryStats;
  changeMeanPct: number | null;  // variación porcentual promedio
}

@Injectable({ providedIn: 'root' })
export class PeriodComparisonService {
  private readonly api = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Compara dos periodos del mismo paciente y métrica.
   * Para json-server: GET /measurements?patientId=..&metric=..&timestamp_gte=..&timestamp_lte=..
   */
  comparePatientMetric(
    patientId: number,
    metric: string,
    base: Period,
    compare: Period
  ): Observable<ComparisonResult> {
    const q = (p: Period) =>
      `${this.api}/measurements?patientId=${patientId}&metric=${encodeURIComponent(metric)}&timestamp_gte=${p.from}&timestamp_lte=${p.to}`;

    const base$    = this.http.get<TimeSample[]>(q(base)).pipe(map(this.normalize));
    const compare$ = this.http.get<TimeSample[]>(q(compare)).pipe(map(this.normalize));

    return forkJoin([base$, compare$]).pipe(
      map(([b, c]) => this.buildResult(metric, base, compare, b, c))
    );
  }

  /**
   * Si ya tienes arrays locales (por ejemplo desde un store), usa esto:
   */
  compareFromArrays(
    metric: string,
    base: Period,
    compare: Period,
    baseSamples: TimeSample[],
    compareSamples: TimeSample[]
  ): ComparisonResult {
    return this.buildResult(metric, base, compare, this.normalize(baseSamples), this.normalize(compareSamples));
  }

  // ---------------- private ----------------

  private normalize = (arr: any[]): TimeSample[] =>
    (arr ?? [])
      .map(x => ({
        timestamp: (x.timestamp ?? x.date ?? x.createdAt ?? '').toString(),
        value: Number(x.value)
      }))
      .filter(s => s.timestamp && Number.isFinite(s.value));

  private buildResult(
    metric: string,
    base: Period,
    compare: Period,
    baseSamples: TimeSample[],
    compareSamples: TimeSample[]
  ): ComparisonResult {
    const MIN_POINTS = 3;

    const baseStats = summarize(baseSamples);
    const compStats = summarize(compareSamples);

    // Suficiencia: al menos N puntos en cada periodo
    if ((baseStats.count ?? 0) < MIN_POINTS || (compStats.count ?? 0) < MIN_POINTS) {
      return {
        sufficiency: 'insufficient',
        reason: `Datos insuficientes (se requieren ≥ ${MIN_POINTS} registros por periodo).`,
        metric,
        basePeriod: base,
        comparePeriod: compare,
        base: baseStats,
        compare: compStats,
        changeMeanPct: null
      };
    }

    const change = percentChange(baseStats.mean, compStats.mean);

    return {
      sufficiency: 'sufficient',
      metric,
      basePeriod: base,
      comparePeriod: compare,
      base: baseStats,
      compare: compStats,
      changeMeanPct: change
    };
  }
}
