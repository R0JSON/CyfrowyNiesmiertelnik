import { useState, useEffect, useRef, useCallback } from 'react';
import { Telemetry, Beacon, Alert, Building } from '../types';

const WS_URL = 'wss://niesmiertelnik.replit.app/ws';

export function useSimulationData() {
  const [connected, setConnected] = useState(false);
  const [firefighters, setFirefighters] = useState<Map<string, Telemetry>>(new Map());
  const [beacons, setBeacons] = useState<Map<string, Beacon>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [building, setBuilding] = useState<Building | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const sendCommand = useCallback((command: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
    } else {
      console.warn('WebSocket not open. Command not sent:', command);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    console.log('Connecting to WebSocket:', WS_URL);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setConnected(false);
      // Try to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };
  }, []);

  const handleMessage = (data: any) => {
    switch (data.type) {
      case 'welcome':
        console.log('Simulator version:', data.simulator_version);
        break;
      case 'building_config':
        setBuilding(data.building);
        break;
      case 'beacons_config':
        const beaconMap = new Map<string, Beacon>();
        data.beacons.forEach((b: Beacon) => beaconMap.set(b.id, b));
        setBeacons(beaconMap);
        break;
      case 'tag_telemetry':
        setFirefighters(prev => {
          const newMap = new Map(prev);
          // Kluczujemy po ID strażaka dla łatwiejszego dostępu
          newMap.set(data.firefighter.id, data); 
          return newMap;
        });
        break;
      case 'beacons_status':
        setBeacons(prev => {
          const newMap = new Map(prev);
          data.beacons.forEach((b: Beacon) => {
            // Aktualizujemy status istniejących beaconów
            const existing = newMap.get(b.id);
            if (existing) {
              newMap.set(b.id, { ...existing, ...b });
            } else {
              newMap.set(b.id, b);
            }
          });
          return newMap;
        });
        break;
      case 'alert':
        setAlerts(prev => {
          // Unikaj duplikatów (update jeśli istnieje)
          const index = prev.findIndex(a => a.id === data.id);
          if (index >= 0) {
            const newAlerts = [...prev];
            newAlerts[index] = data;
            return newAlerts;
          }
          return [data, ...prev];
        });
        break;
      case 'alert_resolved':
        setAlerts(prev => prev.map(a => 
          a.id === data.alert_id ? { ...a, resolved: true } : a
        ));
        break;
    }
  };

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, resolved: true } : a
    ));
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return {
    connected,
    firefighters: Array.from(firefighters.values()),
    beacons: Array.from(beacons.values()),
    alerts,
    building,
    sendCommand,
    resolveAlert, // Eksportujemy nową funkcję
  };
}
