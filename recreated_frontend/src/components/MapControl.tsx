import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

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
  firefighters: any[];
  beacons: any[];
  floor: number;
  selectedFirefighterId: string | null;
  isSidebarOpen: boolean;
}

// Komponent pomocniczy do odświeżania rozmiaru mapy
const MapResizer = ({ isSidebarOpen }: { isSidebarOpen: boolean }) => {
  const map = useMap();

  useEffect(() => {
    // Czekamy na koniec animacji CSS (300ms)
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [isSidebarOpen, map]);

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

export function MapControl({ firefighters, beacons, floor, selectedFirefighterId, isSidebarOpen }: Props) {
  return (
    <MapContainer 
      center={[CENTER_LAT, CENTER_LNG]} 
      zoom={19} 
      style={{ width: '100%', height: '100%', background: '#0d1117' }}
      zoomControl={false}
    >
      <MapResizer isSidebarOpen={isSidebarOpen} />
      
      {/* Monochromatyczna mapa OSM (wymóg z promptu) */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
        className="monochromatic-tile-layer"
      />

      {/* Beacony */}
      {beacons.filter(b => b.floor === floor).map((b, idx) => {
        // Symulacja pozycji w oparciu o index
        const pos = metersToLatLng((idx * 15) - 20, (idx * 10) - 10);
        
        return (
          <React.Fragment key={b.id}>
             {/* Zasięg beacona */}
             <Circle 
                center={pos} 
                radius={15} 
                pathOptions={{ 
                  color: b.type === 'entry' ? '#58a6ff' : '#3fb950', 
                  fillOpacity: 0.05, 
                  dashArray: '4, 4', 
                  weight: 1 
                }} 
             />
             {/* Marker beacona */}
             <Marker position={pos} icon={createBeaconIcon(b.type, b.status)}>
               <Tooltip direction="top" offset={[0, -14]} className="custom-tooltip">
                 <div className="font-sans text-xs">
                   <strong>{b.name}</strong><br/>
                   <span className="text-gray-400">{b.id}</span>
                 </div>
               </Tooltip>
             </Marker>
          </React.Fragment>
        );
      })}

      {/* Strażacy */}
      {firefighters.filter(f => f.floor === floor).map((ff, idx) => {
        // Symulacja pozycji
        const offset = idx * 5; 
        const pos = metersToLatLng(offset, offset * -1);
        const rotation = (idx * 45) % 360;
        const initials = ff.name.split(' ').map((n: string) => n[0]).join('');

        return (
          <React.Fragment key={ff.id}>
            {/* Linie triangulacji (tylko dla zaznaczonego) */}
            {selectedFirefighterId === ff.id && (
               beacons.filter(b => b.floor === floor).slice(0, 3).map((b, bIdx) => {
                 const bPos = metersToLatLng((bIdx * 15) - 20, (bIdx * 10) - 10);
                 return (
                   <Polyline 
                     key={b.id} 
                     positions={[pos, bPos]} 
                     pathOptions={{ color: '#3fb950', weight: 1, opacity: 0.6 }} 
                   />
                 )
               })
            )}

            <Marker 
              position={pos} 
              icon={createFirefighterIcon(initials, rotation, selectedFirefighterId === ff.id)}
            >
              <Tooltip direction="top" offset={[0, -22]} opacity={1}>
                 <div className="text-xs min-w-[140px]">
                   <strong className="block text-sm mb-1">{ff.name}</strong>
                   <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-300">
                     <span>Tętno: <span className="text-psp-warning font-bold">{ff.hr}</span></span>
                     <span>Bat: {ff.battery}%</span>
                     <span>Ruch: {ff.motion}</span>
                     <span>Ciśnienie: {ff.pressure}</span>
                   </div>
                 </div>
              </Tooltip>
            </Marker>
          </React.Fragment>
        );
      })}

    </MapContainer>
  );
}