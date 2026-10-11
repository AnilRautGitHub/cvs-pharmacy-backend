import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch(HttpException)
export class GraphqlExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const status = exception.getStatus();

    let code: string;

    switch (status) {
      case HttpStatus.NOT_FOUND:
        code = 'NOT_FOUND';
        break;

      case HttpStatus.BAD_REQUEST:
        code = 'BAD_USER_INPUT';
        break;

      case HttpStatus.UNAUTHORIZED:
        code = 'UNAUTHENTICATED';
        break;

      case HttpStatus.FORBIDDEN:
        code = 'FORBIDDEN';
        break;

      case HttpStatus.CONFLICT:
        code = 'CONFLICT';
        break;

      default:
        code = 'INTERNAL_SERVER_ERROR';
    }

    const response = exception.getResponse();

    let message = exception.message;
    let validationErrors: string[] | undefined;

    if (typeof response === 'object' && response !== null) {
      const details = response as {
        message?: string | string[];
      };

      if (Array.isArray(details.message)) {
        validationErrors = details.message;
        message = details.message.join('; ');
      } else if (typeof details.message === 'string') {
        message = details.message;
      }
    }

    return new GraphQLError(message, {
      extensions: {
        code,
        status,
        ...(validationErrors ? { validationErrors } : {}),
      },
    });
  }
}
