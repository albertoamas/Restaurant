import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const method = req.method;
    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    const endTimer = this.metrics.httpDurationSeconds.startTimer({ method, handler });

    return next.handle().pipe(
      tap({
        next: () => {
          const status = String(http.getResponse<Response>().statusCode);
          endTimer({ status });
          this.metrics.httpRequestsTotal.inc({ method, handler, status });
        },
        error: (err: { status?: number }) => {
          const status = String(err?.status ?? 500);
          endTimer({ status });
          this.metrics.httpRequestsTotal.inc({ method, handler, status });
        },
      }),
    );
  }
}
