import { Socket } from 'net';
import { Config } from '../core/config';
import { error, info } from '../core/logger';
import { ClientSessionStatus } from '../types';
import { getAddress } from '../utils';
import { Session } from './session';
import { Command, TrojanRequest } from '../proto/TrojanRequest';
import { lookup } from 'dns/promises';
import { connect, TLSSocket } from 'tls';
export class ClientSession extends Session {
  status: ClientSessionStatus = ClientSessionStatus.HANDSHAKE;
  socket: Socket;
  isUDP: boolean;
  outSocket: TLSSocket;
  firstPacketRecv: boolean;
  constructor(socket: Socket, config: Config) {
    super(config);
    this.socket = socket;
    this.status = ClientSessionStatus.HANDSHAKE;
    console.log(this.status);
  }
  start() {
    this.inEndpoint = getAddress(this.socket);
    this.socket.on('data', async (data) => await this.inRead(data));
  }
  async inRead(data: Buffer) {
    switch (this.status) {
      case ClientSessionStatus.HANDSHAKE: {
        if (data.length < 2 || data[0] !== 5 || data.length !== data[1] + 2) {
          error(`${this.inEndpoint} unknown protocol`);
          throw new Error('unknown protocol');
        }
        let hasMethod = false;
        for (let i = 2; i < data[1] + 2; ++i) {
          if (data[i] === 0) {
            hasMethod = true;
            break;
          }
        }
        if (!hasMethod) {
          error(`${this.inEndpoint} unsupported auth method`);
          await this.inWrite(Buffer.from([0x05, 0xff]));
          this.status = ClientSessionStatus.INVALID;
          return;
        }
        await this.inWrite(Buffer.from([0x05, 0x00]));
        break;
      }
      case ClientSessionStatus.REQUEST: {
        if (data.length < 7 || data[0] !== 5 || data[2] !== 0) {
          error(`${this.inEndpoint} bad request`);
          throw new Error('bad request');
        }
        // password null ?
        this.outWriteBuf = Buffer.concat([
          Buffer.from(this.config.password.keys().next().value),
          Buffer.from('\r\n'),
          // command: connect/udp associate
          Buffer.from([data[1]]),
          // address type + destination + port
          data.subarray(3),
          Buffer.from('\r\n'),
        ]);

        console.log('outwritebuffer', this.outWriteBuf);
        let req: TrojanRequest = new TrojanRequest();
        if (req.parse(this.outWriteBuf) === -1) {
          error(`${this.inEndpoint} unsuppoted command`);
          await this.inWrite(
            Buffer.from('\x05\x07\x00\x01\x00\x00\x00\x00\x00\x00'),
          );
          this.status = ClientSessionStatus.INVALID;
          return;
        }
        this.isUDP = req.command === Command.UDP_ASSOCIATE;
        if (this.isUDP) {
        } else {
          info(
            `${this.inEndpoint} requested connection to ${req.address.address}:${req.address.port}`,
          );
          await this.inWrite(
            Buffer.from('\x05\x00\x00\x01\x00\x00\x00\x00\x00\x00'),
          );
        }
        break;
      }
      case ClientSessionStatus.CONNECT: {
        this.sentLen += data.length;
        this.firstPacketRecv = true;
        this.outWriteBuf = Buffer.concat([this.outWriteBuf, data]);
        break;
      }
    }
  }
  async inWrite(data: Buffer) {
    switch (this.status) {
      case ClientSessionStatus.HANDSHAKE: {
        this.socket.write(data, () => {
          this.status = ClientSessionStatus.REQUEST;
        });
        break;
      }
      case ClientSessionStatus.REQUEST: {
        this.socket.write(data, async () => {
          this.status = ClientSessionStatus.CONNECT;
          const { address } = await lookup(this.config.remoteAddr);
          console.log(address);
          info(
            `${this.inEndpoint} ${this.config.remoteAddr} is resolved to ${address}`,
          );
          this.outSocket = connect(
            {
              host: this.config.remoteAddr,
              port: this.config.remotePort,
              // 根据是否skip决定是否reject
              rejectUnauthorized: this.config.ssl.verify,
              ALPNProtocols: ['http/1.1'],
            },
            () => {
              console.log('secure connected');
              if (this.isUDP) {
              } else {
                this.status = ClientSessionStatus.FORWARD;
              }
            },
          );
          this.outSocket.on('data', async (data) => await this.outRead(data));
          // this.outSocket.pipe(this.socket);
          this.outWrite(this.outWriteBuf);
        });
        break;
      }
      case ClientSessionStatus.FORWARD: {
        console.log('forward');
        info(data.toString());
        this.socket.write(data);
      }
    }
  }
  async outRead(data: Buffer) {
    console.log('outread', data);
    console.log(this.status === ClientSessionStatus.FORWARD);
    if (this.status === ClientSessionStatus.FORWARD) {
      this.recvLen += data.length;
      this.inWrite(data);
    } else if (this.status === ClientSessionStatus.UDP_FORWARD) {
    }
  }
  async outWrite(data: Buffer) {
    this.outSocket.write(data, async () => {
      if (this.status === ClientSessionStatus.FORWARD) {
      }
    });
  }
}
