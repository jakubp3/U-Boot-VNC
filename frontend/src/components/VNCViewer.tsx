import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore - noVNC doesn't have perfect TypeScript types
import RFB from '@novnc/novnc/core/rfb';
import '@novnc/novnc/core/styles/base.css';
import './VNCViewer.css';

interface VNCViewerProps {
  url: string;
  machineName: string;
  onClose?: () => void;
}

const VNCViewer: React.FC<VNCViewerProps> = ({ url, machineName, onClose }) => {
  const screenRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Łączenie...');

  useEffect(() => {
    if (!screenRef.current) return;

    try {
      // Parse VNC URL - support both noVNC URLs and direct VNC URLs
      let wsUrl = url;
      
      // If it's an HTTP/HTTPS URL, try to convert to WebSocket
      if (url.startsWith('http://')) {
        wsUrl = url.replace(/^http:\/\//, 'ws://');
      } else if (url.startsWith('https://')) {
        wsUrl = url.replace(/^https:\/\//, 'wss://');
      }
      
      // Extract WebSocket URL from noVNC URLs
      // Format: http://host:port/path?host=target&port=5900
      if (wsUrl.includes('noVNC') || wsUrl.includes('?')) {
        try {
          const urlObj = new URL(url);
          const host = urlObj.searchParams.get('host') || urlObj.hostname;
          const port = urlObj.searchParams.get('port') || '5900';
          const wsProtocol = url.startsWith('https://') ? 'wss' : 'ws';
          wsUrl = `${wsProtocol}://${host}:${port}`;
        } catch (e) {
          // If URL parsing fails, use original URL
          console.warn('Could not parse VNC URL, using as-is:', url);
        }
      }
      
      // Create RFB connection
      const rfb = new RFB(screenRef.current, wsUrl, {
        credentials: {
          password: '', // Add if needed
        },
      });

      rfb.addEventListener('connect', () => {
        setConnected(true);
        setStatus('Połączono');
      });

      rfb.addEventListener('disconnect', (e: any) => {
        setConnected(false);
        setStatus(`Rozłączono: ${e.detail.clean ? 'Normalne rozłączenie' : e.detail.reason}`);
      });

      rfb.addEventListener('credentialsrequired', () => {
        setStatus('Wymagane dane uwierzytelniające');
      });

      rfbRef.current = rfb;

      return () => {
        if (rfbRef.current) {
          rfbRef.current.disconnect();
        }
      };
    } catch (error) {
      console.error('Error connecting to VNC:', error);
      setStatus('Błąd połączenia');
    }
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

