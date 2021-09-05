import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { URL } from 'url';
import HttpError from '../HttpError';
import Signatures from '../Signatures';

export default class WebRequest {
  public readonly method: string;
  public readonly path: string;
  public readonly remoteIp: string;

  public readonly headers: IncomingHttpHeaders;

  private cookies?: { [key: string]: string };
  private body?: Buffer | null;

  private request: IncomingMessage;

  constructor(req: IncomingMessage) {
    this.request = req;

    this.method = req.method as string;

    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    this.path = url.pathname.toLowerCase();

    this.remoteIp = req.socket.remoteAddress as string;

    this.headers = req.headers;
  }

  async hasValidWolToken(): Promise<boolean> {
    const wolTokenPayload = this.getCookie('wol_token');

    if (wolTokenPayload != null && await Signatures.verifyPayload(wolTokenPayload)) {
      const token = Signatures.getData(wolTokenPayload);

      if (Date.now() >= token.iat &&
          token.exp >= 0 &&
          Date.now() < (token.iat + token.exp * 1000)) {
        return true;
      }
    }

    return false;
  }

  isGET(): boolean {
    return this.method == 'GET' || this.method == 'HEAD';
  }

  getCookies(): { [key: string]: string } {
    if (this.cookies == null) {
      this.cookies = {};

      if (this.headers['cookie'] != null) {
        for (const keyValuePair of this.headers['cookie']?.split(';')) {
          const equalsIndex = keyValuePair.indexOf('=');

          if (equalsIndex == -1) {
            throw new HttpError(400, 'Client sent invalid cookie header');
          }

          this.cookies[keyValuePair.substring(0, equalsIndex).trimLeft()] = keyValuePair.substring(equalsIndex + 1);
        }
      }
    }

    return this.cookies;
  }

  getCookie(name: string): string | null {
    return this.getCookies()[name];
  }

  async getBodyAsJson(): Promise<{ [key: string]: any } | null> {
    const body = await this.getBody();

    if (body == null) return null;

    if (this.headers['content-type'] == 'application/x-www-form-urlencoded') {
      const result: { [key: string]: string } = {};

      const keyValuePairs = body.toString().split('&');

      for (const keyValuePair of keyValuePairs) {
        const pairArgs = keyValuePair.split('=');

        result[decodeURI(pairArgs[0])] = decodeURI(pairArgs[1]);
      }

      return result;
    } else if (this.headers['content-type'] == 'application/json') {
      return JSON.parse(body.toString());
    }

    throw new HttpError(400, `Unsupported Content-Type '${this.headers['content-type']}'`);
  }

  async getBody(): Promise<Buffer | null> {
    if (this.body !== undefined) {
      return this.body;
    }

    if (this.method == 'GET' || this.method == 'HEAD' || this.headers['content-length'] == null) {
      return null;
    }

    if (typeof this.headers['content-length'] != 'string' ||
        !/^[0-9]+$/.test(this.headers['content-length'])) {
      throw new HttpError(400, `Client sent invalid Content-Length with value '${this.headers['content-length']}'`);
    }

    const contentLength = parseInt(this.headers['content-length']);

    if (contentLength > 12 * 1024) {
      throw new HttpError(413, `Client exceeded body size limit of 12 MiB`);
    }

    if (contentLength <= 0) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const buffer = Buffer.alloc(contentLength);
      let index = 0;

      this.request.on('data', (chunk) => {
        if (!Buffer.isBuffer(chunk)) {
          chunk = Buffer.from(chunk);
        }

        chunk.copy(buffer, index);
        index += chunk.length;
      });

      this.request.on('end', () => {
        this.body = buffer;

        return resolve(this.body);
      });

      this.request.on('error', reject);
    });
  }
}
