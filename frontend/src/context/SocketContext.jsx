import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, accessToken } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // Avoid duplicate connections
    if (socketRef.current?.connected) return;

    const s = io(SOCKET_URL, {
      auth:       { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection:       true,
      reconnectionDelay:  1000,
      reconnectionAttempts: 5,
    });

    s.on('connect',       () => console.log('🔌 Socket connected'));
    s.on('disconnect',    () => console.log('🔌 Socket disconnected'));
    s.on('connect_error', (err) => console.warn('Socket connect error:', err.message));

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [isAuthenticated, accessToken]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
