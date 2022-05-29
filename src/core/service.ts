import { SecureContext, TlsOptions } from 'tls';
import { createServer, Server } from 'net';
import { Config, RunType } from './config';
import { Session } from '../session/session';
import { ClientSession } from '../session/clientSession';
import { info } from './logger';
import { getAddress } from '../utils';

export class Service {
  config: Config;
  plainHttpResponse: string;
  sslContext: SecureContext;
  server: Server;
  constructor(config: Config) {
    this.config = config;
    let options: TlsOptions = {};
    if (config.runType === RunType.CLIENT) {
      if (this.config.ssl.alpn.length) {
        options.ALPNProtocols = this.config.ssl.alpn;
      }
    }
    this.server = createServer();
  }
  run() {
    this.asyncAccept();
    this.server.listen(this.config.localPort, this.config.localAddr);
  }
  asyncAccept() {
    let session: Session;

    this.server.on('connection', (socket) => {
      if (this.config.runType === RunType.CLIENT) {
        session = new ClientSession(socket, this.config);
      }
      const remoteEndpoint = getAddress(socket);
      info(`${remoteEndpoint} incoming connection`);
      session.start();
    });
  }
}
