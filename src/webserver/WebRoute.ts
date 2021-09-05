import WebRequest from './WebRequest';
import WebResponse from './WebResponse';

export default interface WebRoute {
  handle(req: WebRequest, res: WebResponse): void | Promise<void>;
}
