import { ErisStatus } from './eris/ErisStatus';
import { Config } from './files/Config';
import WebServer from './webserver/WebServer';

export const config = new Config();

export const erisStatus = new ErisStatus(config.data.eris);
const webServer = new WebServer();

webServer.listen(10010, '0.0.0.0');
console.log('Server running on port 10010');
