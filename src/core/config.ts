import { readFile } from 'node:fs/promises';
import { ConfigJSON, SSLConfig } from '../types/index';
export enum RunType {
  SERVER = 'server',
  CLIENT = 'client',
}

export class Config {
  runType: RunType;
  localAddr: string;
  localPort: number;
  remoteAddr: string;
  remotePort: number;
  password: Map<string, string> = new Map();
  ssl: SSLConfig = {
    alpn: [],
    verify: true,
  };
  async load(filename: string) {
    const {
      run_type = 'client',
      local_addr = '',
      local_port = 0,
      remote_addr = '',
      remote_port = 0,
      // target_addr = '',
      // target_port = 0,
      password,
      ssl: { alpn = [], verify = true },
    }: ConfigJSON = JSON.parse(await readFile(filename, 'utf8'));
    if (run_type === RunType.SERVER) {
      this.runType = RunType.SERVER;
    } else if (run_type === RunType.CLIENT) {
      this.runType = RunType.CLIENT;
    } else {
      throw new Error('wrong run_type in config file');
    }
    this.ssl.verify = verify;
    this.localAddr = local_addr;
    this.localPort = local_port;
    this.remoteAddr = remote_addr;
    this.remotePort = remote_port;

    for (const pass of password) {
      this.password.set(await Config.SHA224(pass), pass);
    }
    if (alpn.length) {
      this.ssl.alpn = alpn;
    }
  }
  static async SHA224(message: string) {
    const { createHash } = await import('crypto');
    let hash = createHash('sha224');
    let data = hash.update(message, 'utf-8');
    return data.digest('hex');
  }
}
