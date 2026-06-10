import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  CounterConfiguration,
  Histogram,
  HistogramConfiguration,
  register,
} from 'prom-client';

@Injectable()
export class MetricsService {
  // HTTP
  readonly httpRequestsTotal: Counter<'method' | 'handler' | 'status'>;
  readonly httpDurationSeconds: Histogram<'method' | 'handler' | 'status'>;

  // Business
  readonly ordersCreatedTotal: Counter<'payment_method'>;
  readonly ordersRevenueBsTotal: Counter<string>;
  readonly cashSessionsOpenedTotal: Counter<string>;
  readonly cashSessionsClosedTotal: Counter<string>;

  constructor() {
    collectDefaultMetrics();

    this.httpRequestsTotal = this.counter({
      name: 'pos_http_requests_total',
      help: 'Total HTTP requests by handler and status',
      labelNames: ['method', 'handler', 'status'],
    });

    this.httpDurationSeconds = this.histogram({
      name: 'pos_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'handler', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    });

    this.ordersCreatedTotal = this.counter({
      name: 'pos_orders_created_total',
      help: 'Total orders created',
      labelNames: ['payment_method'],
    });

    this.ordersRevenueBsTotal = this.counter({
      name: 'pos_orders_revenue_bs_total',
      help: 'Total revenue in bolivianos',
      labelNames: [],
    });

    this.cashSessionsOpenedTotal = this.counter({
      name: 'pos_cash_sessions_opened_total',
      help: 'Total cash sessions opened',
      labelNames: [],
    });

    this.cashSessionsClosedTotal = this.counter({
      name: 'pos_cash_sessions_closed_total',
      help: 'Total cash sessions closed',
      labelNames: [],
    });
  }

  recordOrderCreated(paymentMethod: string | null, amountBs: number): void {
    this.ordersCreatedTotal.labels(paymentMethod ?? 'deferred').inc();
    this.ordersRevenueBsTotal.inc(amountBs);
  }

  recordCashSessionOpened(): void {
    this.cashSessionsOpenedTotal.inc();
  }

  recordCashSessionClosed(): void {
    this.cashSessionsClosedTotal.inc();
  }

  private counter<T extends string>(config: CounterConfiguration<T>): Counter<T> {
    const existing = register.getSingleMetric(config.name);
    return existing ? (existing as Counter<T>) : new Counter(config);
  }

  private histogram<T extends string>(config: HistogramConfiguration<T>): Histogram<T> {
    const existing = register.getSingleMetric(config.name);
    return existing ? (existing as Histogram<T>) : new Histogram(config);
  }
}
