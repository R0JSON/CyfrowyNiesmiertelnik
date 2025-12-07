import { useState, useEffect } from 'react';
import { Position } from '../types';

const API_BASE = 'https://niesmiertelnik.replit.app/api/v1';

export function useFirefighterHistory(firefighterId: string | null) {
  const [history, setHistory] = useState<Position[]>([]);

  useEffect(() => {
    if (!firefighterId) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        // Pobieramy ostatnie 100 punktów, żeby narysować ładną ścieżkę
        const res = await fetch(`${API_BASE}/firefighters/${firefighterId}/history?limit=100`);
        
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        
        // API zwraca strukturę { firefighter_id, records: [ { position: {...}, timestamp: ... } ] }
        if (data.records && Array.isArray(data.records)) {
          // Sortujemy chronologicznie (od najstarszych do najnowszych)
          const sortedRecords = data.records.sort((a: any, b: any) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          const positions = sortedRecords.map((r: any) => r.position);
          setHistory(positions);
        }
      } catch (err) {
        console.error('Failed to fetch firefighter history:', err);
        setHistory([]);
      }
    };

    fetchHistory();
    
    // Opcjonalnie: Można tu dodać interwał odświeżania, ale przy zaznaczeniu
    // zazwyczaj wystarczy pobrać historię raz, a bieżąca pozycja jest aktualizowana przez WebSocket.
  }, [firefighterId]);

  return history;
}
