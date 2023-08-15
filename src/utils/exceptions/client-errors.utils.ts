import CustomHttpException from "./custom.exception";

export class BadRequest extends CustomHttpException{
  constructor(customMessage?: string) {
    const defaultMessage = 'Cannot process the request due to a possible client error';
    super(400, defaultMessage, customMessage);
  }
}

export class Unauthorized extends CustomHttpException{
  constructor(customMessage?: string) {
    const defaultMessage = "You are not authorized";
    super(401, defaultMessage, customMessage);
  }
}

export class Forbidden extends CustomHttpException{
  constructor(customMessage?: string) {
    const defaultMessage = "You are not permitted";
    super(403, defaultMessage, customMessage);
  }
}

export class NotFound extends CustomHttpException{
  constructor(customMessage?: string) {
    const defaultMessage = 'Resource does not exist';
    super(404, defaultMessage, customMessage);
  }
}