import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export interface SuccessResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T> | T>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T> | T> {
    return next.handle().pipe(
      map((response) => {
        if (this.isFileResponse(context, response)) {
          return response;
        }

        if (response && typeof response === 'object' && 'success' in response) {
          return response;
        }

        if (
          response &&
          typeof response === 'object' &&
          response.data !== undefined &&
          response.meta !== undefined
        ) {
          return {
            success: true,
            data: response.data,
            meta: response.meta,
            message: response.message || undefined,
          };
        }

        return {
          success: true,
          data: response ?? null,
          message: undefined,
        };
      }),
    );
  }

  private isFileResponse(
    context: ExecutionContext,
    response: any,
  ): boolean {
    if (response instanceof Buffer || response instanceof Uint8Array) {
      return true;
    }

    const http = context.switchToHttp();
    const res = http.getResponse();
    const contentType = res.getHeader('Content-Type');

    if (contentType && typeof contentType === 'string') {
      return (
        contentType.startsWith('application/octet-stream') ||
        contentType.startsWith('text/csv') ||
        contentType.startsWith('application/pdf') ||
        contentType.startsWith('image/')
      );
    }

    return false;
  }
}
