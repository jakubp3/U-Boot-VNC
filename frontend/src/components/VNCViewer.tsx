import React, { useEffect, useRef, useState } from 'react';
import RFB from 'novnc-core/src/rfb';
import 'novnc-core/src/style.css';
import './VNCViewer.css';

interface VNCViewerProps {
  url: string;
  machineName: string;
  onClose?: () => void;
}

const buildWebSocketUrl = (rawUrl: string): string => {
  let wsProtocol = 'ws';
  let host = '';
  let port = '';

  const trimmedUrl = rawUrl.trim();

  // Case 1: WebSocket URLs provided directly
  if (trimmedUrl.startsWith('ws://') || trimmedUrl.startsWith('wss://')) {
    return trimmedUrl;
  }

  // Case 2: HTTP/HTTPS URLs (e.g. http://localhost:6080/vnc.html?host=...)
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    const urlObj = new URL(trimmedUrl);
    wsProtocol = urlObj.protocol === 'https:' ? 'wss' : 'ws';

    // If query params specify a target host/port, use them (noVNC style)
    const targetHost = urlObj.searchParams.get('host');
    const targetPort = urlObj.searchParams.get('port');

    if (targetHost && targetPort) {
      host = targetHost;
      port = targetPort;
      return `${wsProtocol}://${host}:${port}`;
    }

    host = urlObj.hostname;
    port = urlObj.port || (wsProtocol === 'wss' ? '443' : '80');

    // Common WebSocket endpoints for noVNC/websockify
    return `${wsProtocol}://${host}:${port}/websockify`;
  }

  // Case 3: host:port or just hostname
  if (trimmedUrl.includes(':')) {
    const [parsedHost, parsedPort] = trimmedUrl.split(':');
    host = parsedHost || 'localhost';
    port = parsedPort || '6080';
    return `${wsProtocol}://${host}:${port}/websockify`;
  }

  // Default fallback: assume hostname with VNC default port
  host = trimmedUrl || 'localhost';
  port = '5900';
  return `${wsProtocol}://${host}:${port}`;
};

const VNCViewer: React.FC<VNCViewerProps> = ({ url, machineName, onClose }) => {
  const screenRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<any>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Łączenie...');

  useEffect(() => {
    if (!screenRef.current) return;

    const connectToVNC = async () => {
      try {
        const wsUrl = buildWebSocketUrl(url);
        console.log('Connecting to WebSocket URL:', wsUrl);
        setStatus(`Łączenie z ${wsUrl}...`);
        
        // Create RFB connection
        const rfb = new RFB(screenRef.current, wsUrl, {
          credentials: {
            password: '', // Add if needed
          },
        });

        rfb.addEventListener('connect', () => {
          setConnected(true);
          setStatus('Połączono');
          console.log('VNC connected successfully');
        });

        rfb.addEventListener('disconnect', (e: any) => {
          setConnected(false);
          const reason = e.detail?.reason || 'Nieznany błąd';
          setStatus(`Rozłączono: ${e.detail?.clean ? 'Normalne rozłączenie' : reason}`);
          console.log('VNC disconnected:', e.detail);
        });

        rfb.addEventListener('credentialsrequired', () => {
          setStatus('Wymagane hasło VNC');
          console.log('VNC credentials required');
        });

        rfb.addEventListener('securityfailure', (e: any) => {
          setStatus(`Błąd bezpieczeństwa: ${e.detail?.reason || 'Nieznany błąd'}`);
          console.error('VNC security failure:', e.detail);
        });

        rfbRef.current = rfb;

        return () => {
          if (rfbRef.current) {
            rfbRef.current.disconnect();
          }
        };
      } catch (error: any) {
        console.error('Error connecting to VNC:', error);
        setStatus(`Błąd połączenia: ${error.message || 'Nieznany błąd'}`);
      }
    };

    connectToVNC();

    return () => {
      if (rfbRef.current) {
        rfbRef.current.disconnect();
        rfbRef.current = null;
      }
    };
  }, [url]);

  const handleDisconnect = () => {
    if (rfbRef.current) {
      rfbRef.current.disconnect();
      rfbRef.current = null;
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="vnc-viewer">
      <div className="vnc-header">
        <h3>{machineName}</h3>
        <div className="vnc-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          <span>{status}</span>
        </div>
        {onClose && (
          <button className="btn-close" onClick={handleDisconnect}>
            ✕
          </button>
        )}
      </div>
      <div className="vnc-screen-container">
        <div ref={screenRef} className="vnc-screen"></div>
      </div>
    </div>
  );
};

export default VNCViewer;

