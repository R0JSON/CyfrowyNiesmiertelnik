import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Telemetry, Beacon, Position } from '../types';

// Ustawienie współrzędnych "Centrum" (Przykładowo Warszawa, żeby pasowało do OSM)
const CENTER_LAT = 52.2320;
const CENTER_LNG = 21.0063;

// Helper do konwersji metrów na LatLng (bardzo uproszczony, lokalny)
const metersToLatLng = (x: number, y: number) => {
  // 1 stopień szerokości ~ 111km
  const lat = CENTER_LAT + (y / 111139);
  // 1 stopień długości zależy od szerokości
  const lng = CENTER_LNG + (x / (111139 * Math.cos(CENTER_LAT * Math.PI / 180)));
  return [lat, lng] as [number, number];
};

interface Props {
  firefighters: Telemetry[];
  beacons: Beacon[];
  floor: number;
  selectedFirefighterId: string | null;
  onSelectFirefighter: (id: string | null) => void;
  isSidebarOpen: boolean;
  showBeaconRanges: boolean;
  showBeacons: boolean;
  history: Map<string, Position[]>; // Nowy prop
}

// Komponent pomocniczy do odświeżania rozmiaru mapy
const MapResizer = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [isSidebarOpen, map]);

  return null;
};

// Komponent do obsługi kliknięć na mapie (aby odznaczyć strażaka)
const MapClickHandler = ({ onSelectFirefighter }: { onSelectFirefighter: (id: string | null) => void }) => {
  useMapEvents({
    click: () => {
      // Kliknięcie w tło mapy zawsze odznacza strażaka
      onSelectFirefighter(null);
    },
  });
  return null;
};

// Tworzenie customowej ikony dla strażaka (HTML/CSS DivIcon)
const createFirefighterIcon = (initials: string, rotation: number, isSelected: boolean) => {
  const color = '#3fb950'; // Bieg (running) - zielony z configu
  
  const html = `
    <div style="position: relative; width: 44px; height: 44px;">
      <div style="
        position: absolute;
        top: 6px;
        left: 6px;
        width: 32px;
        height: 32px;
        background: #f85149; 
        border: ${isSelected ? '3px solid #58a6ff' : '2px solid white'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: all 0.3s ease-out;
      ">${initials}</div>
      <div style="
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%) rotate(${rotation}deg);
        transform-origin: center 22px;
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 10px solid ${color};
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
      "></div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'firefighter-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
};

const createBeaconIcon = (type: string, status: string) => {
  let color = '#3fb950';
  let letter = 'A';
  
  if (type === 'entry') { color = '#58a6ff'; letter = 'E'; }
  if (type === 'stairs') { color = '#d29922'; letter = 'S'; }
  if (status === 'offline') { color = '#f85149'; }

  const html = `
    <div style="
      width: 24px;
      height: 24px;
      background: ${color};
      border: 2px solid white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: bold;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      opacity: ${status === 'offline' ? 0.5 : 1};
    ">${letter}</div>
  `;

  return L.divIcon({
    html: html,
    className: 'beacon-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export function MapControl({ firefighters, beacons, floor, selectedFirefighterId, onSelectFirefighter, isSidebarOpen, showBeaconRanges, showBeacons, history }: Props) {
  // Pobieramy historię z propsów
  const selectedHistory = selectedFirefighterId ? history.get(selectedFirefighterId) || [] : [];

  return (
    <MapContainer 
      center={[CENTER_LAT, CENTER_LNG]} 
      zoom={17}
      maxZoom={22} /* Zwiększamy maksymalny zoom */
      style={{ width: '100%', height: '100%', background: '#0d1117' }}
      zoomControl={false}
    >
      <MapResizer isSidebarOpen={isSidebarOpen} />
      <MapClickHandler onSelectFirefighter={onSelectFirefighter} />
      
      {/* Monochromatyczna mapa OSM (wymóg z promptu) */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
        className="monochromatic-tile-layer"
      />

      {/* Ścieżka historii (tylko dla zaznaczonego strażaka) */}
      {selectedFirefighterId && selectedHistory.length > 0 && (
        <Polyline
          positions={selectedHistory
            .map(p => metersToLatLng(p.x, p.y))}
          pathOptions={{ 
            color: '#f85149', 
            weight: 3, 
            opacity: 0.6, 
            dashArray: '5, 10',
            lineCap: 'round'
          }}
        />
      )}

      {/* Beacony */}
      {!selectedFirefighterId && showBeacons && beacons.filter(b => b.floor === floor).map((b) => { // Warunkowe renderowanie beaconów: tylko gdy brak zaznaczenia strażaka
        const pos = metersToLatLng(b.position.x, b.position.y);
        
        return (
          <>
             {/* Zasięg beacona */}
             {showBeaconRanges && (
               <Circle 
                  center={pos} 
                  radius={b.range_m || 15} 
                  pathOptions={{ 
                    stroke: false, // Wyłączamy obrys
                    color: b.type === 'entry' ? '#58a6ff' : '#3fb950', 
                    fillOpacity: 0.05, 
                    fillColor: b.type === 'entry' ? '#58a6ff' : '#3fb950',
                  }} 
               />
             )}
             {/* Marker beacona */}
             <Marker position={pos} icon={createBeaconIcon(b.type, b.status)}>
               <Tooltip direction="top" offset={[0, -14]} className="custom-tooltip">
                 <div className="font-sans text-xs">
                   <strong>{b.name}</strong><br/>
                   <span className="text-gray-400">{b.id}</span>
                 </div>
               </Tooltip>
             </Marker>
          </>
        );
      })}

      {/* Strażacy */}
      {(selectedFirefighterId 
        ? firefighters.filter(t => t.firefighter.id === selectedFirefighterId) // Pokaż tylko wybranego strażaka (niezależnie od piętra)
        : firefighters.filter(t => t.position.floor === floor) // Pokaż wszystkich na wybranym piętrze
      ).map((t) => {
        const pos = metersToLatLng(t.position.x, t.position.y);
        const rotation = t.heading_deg || 0;
        const initials = t.firefighter.name.split(' ').map((n: string) => n[0]).join('');

        return (
          <>
            <Marker 
              position={pos} 
              icon={createFirefighterIcon(initials, rotation, selectedFirefighterId === t.firefighter.id)}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e.originalEvent); // Zapobiegaj propagacji do mapy
                  onSelectFirefighter(selectedFirefighterId === t.firefighter.id ? null : t.firefighter.id);
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -22]} opacity={1}>
                 <div className="text-xs min-w-[140px]">
                   <strong className="block text-sm mb-1">{t.firefighter.name}</strong>
                   <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-300">
                     <span>Tętno: <span className="text-psp-warning font-bold">{t.vitals.heart_rate_bpm}</span></span>
                     <span>Bat: {t.device.battery_percent}%</span>
                     <span>Ruch: {t.vitals.motion_state}</span>
                     <span>Ciśnienie: {t.scba ? Math.round(t.scba.cylinder_pressure_bar) : '-'}</span>
                   </div>
                 </div>
              </Tooltip>
            </Marker>
          </>
        );
      })}

    </MapContainer>
  );
}
