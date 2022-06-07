import { SOCKS5Address } from './socks5Address';

export enum Command {
  CONNECT = 1,
  UDP_ASSOCIATE = 3,
}

export class TrojanRequest {
  password: string;
  payload: Buffer;
  command: Command;
  address: SOCKS5Address = new SOCKS5Address();
  parse(data: Buffer) {
    const first = data.indexOf('\r\n');
    if (first === -1) return -1;
    this.password = data.subarray(0, first).toString();
    this.payload = data.subarray(first + 2);
    if (
      this.payload.length === 0 ||
      (Number(this.payload[0]) !== Command.CONNECT &&
        Number(this.payload[0]) !== Command.UDP_ASSOCIATE)
    ) {
      return -1;
    }
    this.command = this.payload[0];
    // atyp + address + port
    const { isValid, addressLen } = this.address.parse(
      this.payload.subarray(1),
    );
    if (
      !isValid ||
      this.payload.length < addressLen + 3 ||
      this.payload.subarray(addressLen + 1, addressLen + 3).toString() != '\r\n'
    ) {
      return -1;
    }
    this.payload = this.payload.subarray(addressLen + 3);
    return data.length;
  }
}
