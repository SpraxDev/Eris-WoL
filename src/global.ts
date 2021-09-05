export interface CookieOptions {
  expires?: Date;
  /** In seconds */
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface IConfig {
  // readonly web: {
  //   readonly listen: {
  //     readonly usePath: boolean;
  //     readonly path: string;
  //     readonly host: string;
  //     readonly port: number;
  //   };
  //
  //   readonly serveStatic: boolean;
  //   readonly trustProxy: boolean;
  //
  //   readonly urlPrefix: {
  //     readonly https: boolean;
  //     readonly dynamicContentHost: string;
  //     readonly staticContentHost: string;
  //   };
  // };

  readonly eris: {
    readonly host: string;
    readonly macAddress: string;
  };

  readonly hCaptcha: {
    readonly secret: string;
    readonly siteKey: string;
  };

  readonly cookies: {
    readonly secure: boolean;
  };

  readonly rsaKey: string;
}

export interface WolToken {
  /** IP of User-Agent */
  sub: string;
  /** Unix timestamp in millis */
  iat: number;
  /** In seconds */
  exp: number;
}
