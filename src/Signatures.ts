import crypto from 'crypto';
import { Config } from './files/Config';
import { WolToken } from './global';
import { config } from './index';

export default class Signatures {
  public static ALGORITHM = 'sha256';

  private static publicKey?: crypto.KeyObject;
  private static privateKey?: crypto.KeyObject;

  static getData(payload: string): WolToken {
    this.checkPayloadSyntax(payload);

    const wolToken = JSON.parse(Buffer.from(payload.split('.')[0], 'base64').toString());

    if (wolToken.sub != null && wolToken.iat != null && wolToken.exp != null) {
      return wolToken;
    }

    throw new Error(`The given payload is missing some properties (expected: [sub, iat, exp], got:[${Object.keys(wolToken)}])`);
  }

  static async verifyPayload(payload: string): Promise<boolean> {
    this.checkPayloadSyntax(payload);

    const payloadArgs = payload.split('.');

    return new Promise((resolve, reject) => {
      crypto.verify(Signatures.ALGORITHM,
          Buffer.from(payloadArgs[0], 'base64'),
          this.getPublicKey(),
          Buffer.from(payloadArgs[1], 'base64'),
          (err, result) => {
            if (err) return reject(err);

            return resolve(result);
          });
    });
  }

  static async signAsPayload(data: WolToken): Promise<string> {
    return new Promise((resolve, reject) => {
      const dataBuffer = Buffer.from(JSON.stringify(data));

      crypto.sign(Signatures.ALGORITHM, dataBuffer, this.getPrivateKey(), (err, signature) => {
        if (err) return reject(err);

        resolve(`${dataBuffer.toString('base64')}.${signature.toString('base64')}`);
      });
    });
  }

  private static checkPayloadSyntax(payload: string) {
    const dotIndex = payload.indexOf('.');

    if (dotIndex == -1 || dotIndex != payload.lastIndexOf('.')) {
      throw new Error(`Invalid payload syntax, expected '<Data-Base64>.<Signature.Base64>'`);
    }
  }

  private static getPublicKey(): crypto.KeyObject {
    if (this.publicKey == null) {
      this.publicKey = crypto.createPublicKey(this.getPrivateKey());
    }

    return this.publicKey;
  }

  private static getPrivateKey(): crypto.KeyObject {
    if (this.privateKey == null) {
      this.privateKey = crypto.createPrivateKey({
        key: Buffer.from(config.data.rsaKey, 'base64'),
        passphrase: Config.RSA_PASS
      });
    }

    return this.privateKey;
  }
}
