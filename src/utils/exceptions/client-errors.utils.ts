import CustomHttpException from "./custom.exception";
import { HttpStatus } from "./http-status.enum";

export class BadRequest extends CustomHttpException{
  constructor(customMessage?: string) {
    const defaultMessage = 'Cannot process the request due to a possible client error';
    super(HttpStatus.BAD_REQUEST, defaultMessage, customMessage);
  }
}

export class Unauthorized extends CustomHttpException{
  constructor(customMessage?: string) {
    const defaultMessage = "You are not authorized";
    super(HttpStatus.UNAUTHORIZED, defaultMessage, customMessage);
  }
}

export class Forbidden extends CustomHttpException{
  constructor(customMessage?: string) {
    const defaultMessage = "You are not permitted";
    super(HttpStatus.FORBIDDEN, defaultMessage, customMessage);
  }
}

export class NotFound extends CustomHttpException{
  constructor(customMessage?: string) {
    const defaultMessage = 'Resource does not exist';
    super(HttpStatus.NOT_FOUND, defaultMessage, customMessage);
  }
}