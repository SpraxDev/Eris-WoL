import crypto from 'crypto';
import { IConfig } from '../global';
import { File } from './File';

export class Config extends File {
  readonly data: IConfig;

  // I don't care about it being hardcoded, but storing the private key with a passphrase just feels better
  public static readonly RSA_PASS = 'spPwKsF3DLUh8juD8Pfu';

  constructor() {
    super(File.getPath('config.json'));

    this.data = Object.freeze(super.load() as IConfig);

    // Write current config (+ missing default values) into file
    this.save();
  }

  protected getData(): object {
    return this.data;
  }

  protected getDefaults(): IConfig {
    const rsaPrivateKey = crypto.generateKeyPairSync('rsa', {modulusLength: 1024}).privateKey.export({
      format: 'pem',
      type: 'pkcs1',
      passphrase: Config.RSA_PASS,
      cipher: 'des'
    });

    return {
      // web: {
      //   listen: {
      //     usePath: false,
      //     path: '/tmp/.node-unix-sockets/NasWeb.socket',
      //     host: 'localhost',
      //     port: 8092
      //   },
      //
      //   serveStatic: true,
      //   trustProxy: false,
      //
      //   urlPrefix: {
      //     https: false,
      //     dynamicContentHost: 'auto',
      //     staticContentHost: 'auto'
      //   }
      // },

      eris: {
        host: '',
        macAddress: '00:00:00:00:00:00'
      },

      hCaptcha: {
        siteKey: '',
        secret: ''
      },

      cookies: {
        secure: false
      },

      rsaKey: Buffer.isBuffer(rsaPrivateKey) ? rsaPrivateKey.toString('base64') : Buffer.from(rsaPrivateKey).toString('base64')
    };
  }
}
