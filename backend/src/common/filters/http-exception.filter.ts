import { randomUUID } from 'node:crypto';
import { STATUS_CODES } from 'node:http';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  instance: string;
  traceId: string;
  errors?: string[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const traceId = randomUUID();
    const problem: ProblemDetails = {
      type: 'about:blank',
      title:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'An unexpected error occurred.'
          : (STATUS_CODES[status] ?? 'Request failed.'),
      status,
      instance: request.originalUrl.split('?')[0] ?? request.path,
      traceId,
    };

    if (
      exception instanceof HttpException &&
      status === HttpStatus.BAD_REQUEST
    ) {
      const payload = exception.getResponse();
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload
      ) {
        const messages: unknown = payload.message;
        if (Array.isArray(messages)) {
          problem.errors = messages.filter(
            (message): message is string => typeof message === 'string',
          );
        }
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unexpected request failure. TraceId: ${traceId}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response
      .status(status)
      .setHeader('X-Request-Id', traceId)
      .type('application/problem+json')
      .json(problem);
  }
}
