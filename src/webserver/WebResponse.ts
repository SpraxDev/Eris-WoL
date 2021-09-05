import { OutgoingHttpHeaders, STATUS_CODES } from 'http';
import objectAssignDeep from 'object-assign-deep';
import { CookieOptions, WolToken } from '../global';
import { config } from '../index';
import Signatures from '../Signatures';
import WebRequest from './WebRequest';

export default class WebResponse {
  public static readonly REGEXP_COOKIE_NAME = /^((?!["()<>@,;:\\\/\[\]?={}\t\r])[\x21-\x7E])+$/;
  public static readonly REGEXP_COOKIE_VALUE = /^((?![",;\\\t\r])[\x21-\x7E])*$/;

  private _status: number = 200;
  private _headers: OutgoingHttpHeaders = {};

  private _body?: Buffer;


  constructor() {
    this._headers['X-ZeroPi'] = 1;
    this._headers['Vary'] = 'X-ZeroPi';
    this._headers['Cache-Control'] = 'private, no-store, max-age=0';
  }

  async setWolToken(req: WebRequest): Promise<void> {
    const cookieValue: WolToken = {sub: req.remoteIp, iat: Date.now(), exp: 4 * 60 * 60 /* 4h in Sekunden */};

    this.setCookie('wol_token', await Signatures.signAsPayload(cookieValue), {
      httpOnly: true,
      secure: config.data.cookies.secure,
      maxAge: cookieValue.exp,
      path: '/'
    });
  }

  type(mimeType: string, charset?: 'utf-8' | string): WebResponse {
    let header = `${mimeType}`;

    if (charset != null) {
      header += `; charset=${charset.toUpperCase()}`;
    }

    this._headers['content-type'] = header;

    return this;
  }

  status(status: number): WebResponse {
    if (!STATUS_CODES[status]) throw new Error(`Invalid HTTP-Status-Code: ${status}`);

    this._status = status;

    return this;
  }

  sendStatus(status: number): void {
    this.status(status);
    this.send(`${status} ${STATUS_CODES[status]}`);
    this.type('text/plain', 'utf-8');
  }

  sendMethodNotAllowed(allowed: string[]): void {
    const allowedStr = allowed.join(', ');

    this.status(405);
    this.send(`${405} ${STATUS_CODES[405]} (${allowedStr})`);
    this._headers['allow'] = allowedStr;
  }

  send(body: string | object | Buffer | null): void {
    if (body == null) {
      this._body = undefined;
    } else if (Buffer.isBuffer(body)) {
      this._body = body;
    } else {
      if (typeof body != 'string') {
        body = JSON.stringify(body);
        this.type('application/json', 'utf-8');
      }

      this._body = Buffer.from(body);
    }


    this._headers['content-length'] = this._body?.byteLength ?? 0;
  }

  redirectBack(req: WebRequest, type: 301 | 302 = 302, fallbackUri: string = '/'): void {
    let uri = fallbackUri;

    if (req.headers['referer']) {
      if (Array.isArray(req.headers['referer'])) {
        uri = req.headers['referer'][0];
      } else {
        uri = req.headers['referer'];
      }
    }

    this.redirect(uri, type);
  }

  redirect(uri: string, type: 301 | 302 = 302): void {
    this.send(null);
    this.status(type);
    this._headers['location'] = uri;
  }

  deleteCookie(name: string, options: CookieOptions = {}): WebResponse {
    return this.setCookie(name, '', objectAssignDeep({}, options, {maxAge: -1}));
  }

  setCookie(name: string, value: string | number, options?: CookieOptions): WebResponse {
    if (!WebResponse.REGEXP_COOKIE_NAME.test(name)) throw new Error(`Trying to set a cookie with an invalid name '${name}'`);
    if (typeof value == 'string' && !WebResponse.REGEXP_COOKIE_VALUE.test(value)) throw new Error(`Trying to set a cookie with an invalid value '${value}'`);

    if (this._headers['set-cookie'] != null && !Array.isArray(this._headers['set-cookie'])) {
      this._headers['set-cookie'] = [this._headers['set-cookie'].toString()];
    }

    if (this._headers['set-cookie'] == null) {
      this._headers['set-cookie'] = [];
    }

    let headerValue = `${name}=${value}`;

    if (options != null) {
      if (options.expires != null) {
        headerValue += `; Expires=${options.expires.toUTCString()}`;
      }

      if (options.maxAge != null) {
        headerValue += `; Max-Age=${options.maxAge}`;
      }

      if (options.domain != null) {
        headerValue += `; Domain=${options.domain}`;
      }

      if (options.path != null) {
        headerValue += `; Path=${options.path}`;
      }

      if (options.secure === true) {
        headerValue += `; Secure`;
      }

      if (options.httpOnly === true) {
        headerValue += `; HttpOnly`;
      }

      if (options.sameSite != null) {
        headerValue += `; SameSite=${options.sameSite}`;
      }
    }

    this._headers['set-cookie'].push(headerValue);

    return this;
  }

  getStatus() {
    return this._status;
  }

  getBody() {
    return this._body;
  }

  getHeader() {
    return this._headers;
  }
}
