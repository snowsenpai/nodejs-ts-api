import HttpException from "./http.exceptions";

export class BadRequest extends HttpException{
  /**
   * A default message is used if none is provided 
   */ 
  constructor(customMessage?: string) {
    const defaultMessage = 'Resource already exist';
    const message = customMessage ?? defaultMessage;
    super(400, message);
  }
}

export class Unauthorized extends HttpException{
  /**
   * A default message is used if none is provided 
   */ 
  constructor(customMessage?: string) {
    const defaultMessage = "You're not authorized";
    const message = customMessage ?? defaultMessage;
    super(401, message);
  }
}

export class Forbidden extends HttpException{
  /**
   * A default message is used if none is provided 
   */ 
  constructor(customMessage?: string) {
    const defaultMessage = "You're not permitted";
    const message = customMessage ?? defaultMessage;
    super(403, message);
  }
}

export class NotFound extends HttpException{
  /**
   * A default message is used if none is provided 
   */ 
  constructor(customMessage?: string) {
    const defaultMessage = 'Resource does not exist';
    const message = customMessage ?? defaultMessage;
    super(404, message);
  }
}