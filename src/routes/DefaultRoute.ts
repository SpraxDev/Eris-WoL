import fs from 'fs';
import hCaptcha from 'hcaptcha';
import path from 'path';
import { CookieOptions } from '../global';
import { config, erisStatus } from '../index';
import WebRequest from '../webserver/WebRequest';
import WebResponse from '../webserver/WebResponse';
import WebRoute from '../webserver/WebRoute';

export default class DefaultRoute implements WebRoute {
  private static wolAutoCookieOptions: () => CookieOptions = () => ({
    secure: config.data.cookies.secure,
    maxAge: 3 * 30 * 24 * 60 * 60 /* 3 months */,
    path: '/'
  });

  async handle(req: WebRequest, res: WebResponse): Promise<void> {
    if (req.isGET()) {
      await DefaultRoute.handleGET(req, res);
    } else if (req.method == 'POST') {
      await DefaultRoute.handlePOST(req, res);
    } else {
      res.sendMethodNotAllowed(['HEAD', 'GET', 'POST']);
      res.sendStatus(405);
    }
  }

  private static async handleGET(req: WebRequest, res: WebResponse): Promise<void> {
    if (await req.hasValidWolToken()) {
      if (req.getCookie('wol_auto') == '1') {
        erisStatus.wakeUp()
            .catch(console.error);
      }

      res.type('text/html')
          .send(fs.readFileSync(path.join(__dirname, '..', '..', 'html', 'index_auth.html'), 'utf-8'));
      return;
    }

    res.type('text/html')
        .status(401)
        .send(fs.readFileSync(path.join(__dirname, '..', '..', 'html', 'index.html'), 'utf-8'));
  }

  private static async handlePOST(req: WebRequest, res: WebResponse): Promise<void> {
    const jsonBody = await req.getBodyAsJson();

    if (jsonBody == null || jsonBody['action'] == null) {
      res.status(400)
          .send({success: false});
      return;
    }

    if (jsonBody['action'] == 'auth') {
      await DefaultRoute.handleAuthPOST(req, res, jsonBody);
    } else if (jsonBody['action'] == 'eris_status') {
      await DefaultRoute.handleErisStatusPOST(req, res, jsonBody);
    } else {
      res.status(400)
          .send({success: false, error: 'Unknown action'});
    }
  }

  private static async handleErisStatusPOST(req: WebRequest, res: WebResponse, jsonBody: { [key: string]: any }): Promise<void> {
    if (!(await req.hasValidWolToken())) {
      res.status(403)
          .send({success: false});
      return;
    }

    if (jsonBody['auto'] != null) {
      if (jsonBody['auto'] == true) {
        res.setCookie('wol_auto', 1, this.wolAutoCookieOptions());
      } else if (req.getCookie('wol_auto') != null) {
        res.deleteCookie('wol_auto', this.wolAutoCookieOptions());
      }
    }

    if (!(await erisStatus.isOnline())) {
      await erisStatus.wakeUp();
    }

    res.send({
      success: true,

      eris: {
        online: await erisStatus.isOnline(),
        lastOnline: erisStatus.getLastOnlinePing(),

        cooldown: {
          ping: erisStatus.getPingCooldown(),
          wol: erisStatus.getWakeUpCooldown()
        }
      }
    });
  }

  private static async handleAuthPOST(req: WebRequest, res: WebResponse, jsonBody: { [key: string]: any }): Promise<void> {
    if (jsonBody['h-captcha-response'] == null) {
      res.status(400)
          .send('Please fulfill the captcha to temporarily authenticate yourself');
      return;
    }

    const hCaptchaRes = await hCaptcha.verify(config.data.hCaptcha.secret, jsonBody['h-captcha-response'], req.remoteIp, config.data.hCaptcha.siteKey);

    if (hCaptchaRes.success) {
      await res.setWolToken(req);

      res.redirectBack(req);
      return;
    }

    res.status(400)
        .send(`Captcha failed (${hCaptchaRes['error-codes'] ?? 'Unknown reason'})`);
  }
}
