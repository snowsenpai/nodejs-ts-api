/**
 * Subclass of JavaScript {@link Error}.
 */
class HttpException extends Error {
  public status: number;
  public message: string;

  /**
   * @param status - A valid {@link HttpStatus}.
   * @param message - The error message.
   */
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

export default HttpException;
