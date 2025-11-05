import React, { useEffect, useRef, useState } from 'react';
import './VNCViewer.css';

interface VNCViewerProps {
  url: string;
  machineName: string;
  onClose?: () => void;
}

const VNCViewer: React.FC<VNCViewerProps> = ({ url, machineName, onClose }) => {
  const screenRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<any>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Łączenie...');
  const [RFB, setRFB] = useState<any>(null);

  // Load noVNC dynamically
  useEffect(() => {
    const loadNoVNC = async () => {
      try {
        console.log('Loading noVNC library...');
        // @ts-ignore
        const novnc = await import('@novnc/novnc/core/rfb');
        // Import styles
        try {
          await import('@novnc/novnc/core/styles/base.css');
        } catch (cssError) {
          console.warn('Could not load noVNC styles:', cssError);
        }
        const RFBClass = novnc.default || novnc.RFB || novnc;
        console.log('noVNC loaded successfully:', RFBClass);
        setRFB(RFBClass);
        setStatus('Gotowe do połączenia');
      } catch (error: any) {
        console.error('Error loading noVNC:', error);
        setStatus(`Błąd ładowania noVNC: ${error.message || 'Nieznany błąd'}`);
      }
    };
    loadNoVNC();
  }, []);

  useEffect(() => {
    if (!screenRef.current || !RFB) return;

    const connectToVNC = async () => {
      try {
        // Parse VNC URL - support multiple formats
        let wsUrl = url;
        let host = '';
        let port = '';
        let protocol = 'ws';
        
        console.log('Parsing VNC URL:', url);
        
        // Case 1: Full HTTP/HTTPS URL (e.g., http://localhost:6080/vnc.html)
        if (url.startsWith('http://') || url.startsWith('https://')) {
          try {
            const urlObj = new URL(url);
            host = urlObj.hostname;
            port = urlObj.port || (url.startsWith('https://') ? '443' : '80');
            protocol = url.startsWith('https://') ? 'wss' : 'ws';
            
            // If URL contains /vnc.html or similar, it's likely noVNC
            // WebSocket endpoint is usually /websockify on the same host:port
            if (urlObj.pathname.includes('/vnc') || urlObj.pathname.includes('/novnc')) {
              // Check for query params that might specify target host/port
              const targetHost = urlObj.searchParams.get('host');
              const targetPort = urlObj.searchParams.get('port');
              
              if (targetHost && targetPort) {
                // Remote VNC server specified in query params
                host = targetHost;
                port = targetPort;
                wsUrl = `${protocol}://${host}:${port}`;
              } else {
                // Local noVNC server - use /websockify endpoint
                // Common noVNC WebSocket paths: /websockify, /websocket, /ws
                wsUrl = `${protocol}://${host}:${port}/websockify`;
              }
            } else {
              // Direct conversion from HTTP to WS
              wsUrl = url.replace(/^https?:\/\//, `${protocol}://`);
            }
          } catch (e) {
            console.error('Error parsing HTTP URL:', e);
            setStatus('Błąd parsowania URL');
            return;
          }
        }
        // Case 2: Just host:port (e.g., localhost:6080)
        else if (url.includes(':') && !url.startsWith('ws://') && !url.startsWith('wss://')) {
          const parts = url.split(':');
          if (parts.length === 2) {
            host = parts[0];
            port = parts[1];
            // Try common WebSocket paths
            wsUrl = `ws://${host}:${port}/websockify`;
          } else {
            wsUrl = `ws://${url}`;
          }
        }
        // Case 3: Already a WebSocket URL
        else if (url.startsWith('ws://') || url.startsWith('wss://')) {
          wsUrl = url;
        }
        // Case 4: Just hostname (default to common VNC port 5900)
        else {
          host = url;
          port = '5900';
          wsUrl = `ws://${host}:${port}`;
        }
        
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
  }, [url, RFB]);

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

