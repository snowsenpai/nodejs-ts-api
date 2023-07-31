import CustomHttpException from "./custom.exception";

export class BadRequest extends CustomHttpException{
  constructor(customMessage?: string) {
    const defaultMessage = 'Resource already exist';
    super(400, defaultMessage, customMessage);
  }
}

export class Unauthorized extends CustomHttpException{
  constructor(customMessage?: string) {
    const defaultMessage = "You're not authorized";
    super(401, defaultMessage, customMessage);
  }
}

export class Forbidden extends CustomHttpException{
  constructor(customMessage?: string) {
    const defaultMessage = "You're not permitted";
    super(403, defaultMessage, customMessage);
  }
}

export class NotFound extends CustomHttpException{
  constructor(customMessage?: string) {
    const defaultMessage = 'Resource does not exist';
    super(404, defaultMessage, customMessage);
  }
}