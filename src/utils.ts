import { Socket } from 'net';
export const getAddress = (socket: Socket) => {
  return `${socket.remoteAddress}:${socket.remotePort}`;
};
