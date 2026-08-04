import { io } from 'socket.io-client';
import { getBaseServerUrl } from './apiConfig';

const SOCKET_URL = getBaseServerUrl();

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});
