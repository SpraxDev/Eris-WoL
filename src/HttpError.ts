export default class HttpError extends Error {
  public httpStatus: number;
  public isInternalMessage: boolean;

  constructor(httpStatus: number, message: string, isInternalMessage: boolean = false) {
    super(message);

    this.httpStatus = httpStatus;
    this.isInternalMessage = isInternalMessage;
  }
}
