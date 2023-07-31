import HttpException from "./http.exception";

class CustomHttpException extends HttpException{
  /**
   * The default message is used if none is passed.
   * To override the default message, pass a custom message as the third parameter.
  */
  constructor(status: number, defaultMessage: string, customMessage?: string) {
    const message = customMessage ?? defaultMessage;
    super(status, message);
  }
}

export default CustomHttpException;