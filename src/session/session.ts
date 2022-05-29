import { Config } from '../core/config';

export abstract class Session {
  inEndpoint: string;
  outWriteBuf: Buffer;
  config: Config;
  sentLen: number;
  recvLen: number;
  constructor(config: Config) {
    this.config = config;
    this.sentLen = 0;
    this.recvLen = 0;
  }
  abstract start(): void;
}
