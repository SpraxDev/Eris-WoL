import geoIp from 'geoip-country';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import HttpError from '../HttpError';
import DefaultRoute from '../routes/DefaultRoute';
import WebRequest from './WebRequest';
import WebResponse from './WebResponse';

export default class WebServer {
  private readonly server: Server;

  constructor() {
    const defaultRoute = new DefaultRoute();

    this.server = createServer(async (httpReq, httpRes): Promise<void> => {
      httpReq.setTimeout(3000, () => {
        if (!httpRes.headersSent) {
          const webRes = new WebResponse();
          webRes.sendStatus(408);

          httpRes.writeHead(webRes.getStatus(), webRes.getHeader())
              .end(webRes.getBody());
        }
      });

      try {
        const webReq = new WebRequest(httpReq);
        const webRes = new WebResponse();

        if (httpReq.url == null || httpReq.method == null) {
          webRes.sendStatus(500);
        } else if (!this.isIpAllowed(httpReq)) {
          webRes.sendStatus(403);
        } else {
          await defaultRoute.handle(webReq, webRes);
          // await MainRoute(webReq, webRes);
        }

        WebServer.finalizeRequest(httpReq, httpRes, webRes);
      } catch (err) {
        if (!(err instanceof HttpError) || err.isInternalMessage) {
          console.error(err);
        }

        if (!httpRes.headersSent) {
          const webRes = new WebResponse();
          webRes.sendStatus(500);

          if (err instanceof HttpError) {
            webRes.sendStatus(err.httpStatus);

            if (!err.isInternalMessage) {
              webRes.send(err.message);
            }
          }

          WebServer.finalizeRequest(httpReq, httpRes, webRes);
          return;
        }

        httpRes.end();
      }
    });
  }

  isIpAllowed(req: IncomingMessage): boolean {
    const remoteIp = req.socket.remoteAddress ?? '127.0.0.1';

    if (remoteIp == '127.0.0.1' || remoteIp == '::1' || remoteIp.startsWith('192.168.')) {
      return true;
    }

    return geoIp.lookup(remoteIp)?.country == 'DE';
  }

  listen(port: number, hostname: string = '127.0.0.1'): void {
    this.server.listen(port, hostname);
  }

  private static finalizeRequest(req: IncomingMessage, res: ServerResponse, webRes: WebResponse): void {
    const body = webRes.getBody() ?? Buffer.alloc(0);

    res.writeHead(webRes.getStatus(), webRes.getHeader())
        .end(req.method != 'HEAD' ? body : undefined);
  }
}
