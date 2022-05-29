export interface ConfigJSON {
  run_type: string;
  local_addr: string;
  local_port: number;
  remote_addr: string;
  remote_port: number;
  password: string[];
  ssl: SSLConfig;
}

export interface SSLConfig {
  alpn: string[];
  verify: boolean;
}

export enum ClientSessionStatus {
  HANDSHAKE,
  REQUEST,
  CONNECT,
  FORWARD,
  UDP_FORWARD,
  INVALID,
  DESTROY,
}
