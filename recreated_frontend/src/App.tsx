import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapControl } from './components/MapControl';
import { Users, Radio, AlertTriangle, Layers } from 'lucide-react';

// Mock Data (żeby to nie była pusta wydmuszka)
const MOCK_FIREFIGHTERS = [
  { id: 'FF-001', name: 'Marek Kamiński', role: 'Kierowca-operator', floor: 0, hr: 142, motion: 'running', battery: 84, pressure: 240, time: 32 },
  { id: 'FF-002', name: 'Adam Nowak', role: 'Rota 1', floor: 0, hr: 110, motion: 'walking', battery: 92, pressure: 280, time: 45 },
  { id: 'FF-003', name: 'Piotr Wiśniewski', role: 'Rota 1', floor: 1, hr: 85, motion: 'stationary', battery: 45, pressure: 180, time: 20 },
];

const MOCK_BEACONS = [
  { id: 'B-01', name: 'Wejście Główne', type: 'entry', status: 'active', floor: 0, battery: 100 },
  { id: 'B-02', name: 'Klatka A P0', type: 'stairs', status: 'active', floor: 0, battery: 98 },
  { id: 'B-03', name: 'Korytarz Północ', type: 'anchor', status: 'active', floor: 0, battery: 85 },
  { id: 'B-04', name: 'Klatka A P1', type: 'stairs', status: 'offline', floor: 1, battery: 0 },
];

export default function App() {
  const [selectedTab, setSelectedTab] = useState<'firefighters' | 'beacons' | 'alerts'>('firefighters');
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [selectedFirefighterId, setSelectedFirefighterId] = useState<string | null>(null);

  // Oblicz liczbę strażaków na piętrach
  const floorCounts = new Map<number, number>();
  MOCK_FIREFIGHTERS.forEach(f => {
    floorCounts.set(f.floor, (floorCounts.get(f.floor) || 0) + 1);
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans">
      {/* SIDEBAR */}
      <aside className="w-[380px] flex-shrink-0 bg-[#0d1117] border-r border-border flex flex-col overflow-hidden">
        {/* Header */}
        <header className="p-4 bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-psp-critical" />
              Cyfrowy Nieśmiertelnik PSP
            </h1>
            <button className="text-xs px-3 py-1 rounded border border-border hover:bg-muted transition-colors">
              API Docs
            </button>
          </div>
          <div className="mt-2 text-xs flex items-center gap-2 text-psp-success bg-psp-success/10 p-1.5 rounded">
            <span className="w-2 h-2 rounded-full bg-psp-success animate-pulse"></span>
            System Online
          </div>
        </header>

        {/* Tabs */}
        <div className="p-4 grid grid-cols-3 gap-1 bg-muted/50">
          <button 
            onClick={() => setSelectedTab('firefighters')}
            className={`flex items-center justify-center gap-2 p-2 text-xs font-medium rounded transition-all ${selectedTab === 'firefighters' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
          >
            <Users className="w-4 h-4" /> Strażacy
          </button>
          <button 
            onClick={() => setSelectedTab('beacons')}
            className={`flex items-center justify-center gap-2 p-2 text-xs font-medium rounded transition-all ${selectedTab === 'beacons' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
          >
            <Radio className="w-4 h-4" /> Beacony
          </button>
          <button 
            onClick={() => setSelectedTab('alerts')}
            className={`flex items-center justify-center gap-2 p-2 text-xs font-medium rounded transition-all ${selectedTab === 'alerts' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
          >
            <AlertTriangle className="w-4 h-4" /> Alerty
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto">
          <Sidebar 
            tab={selectedTab} 
            firefighters={MOCK_FIREFIGHTERS} 
            beacons={MOCK_BEACONS}
            onSelectFirefighter={setSelectedFirefighterId}
            selectedId={selectedFirefighterId}
          />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <header className="absolute top-4 left-4 right-4 z-[1000] flex justify-between pointer-events-none">
           <div className="bg-[#0d1117]/90 backdrop-blur border border-border rounded-lg p-2 flex gap-1 pointer-events-auto shadow-xl">
              <span className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center gap-1">
                <Layers className="w-3 h-3"/> Piętro:
              </span>
              {[-1, 0, 1, 2].map(floor => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`
                    relative min-w-[40px] h-8 text-sm font-semibold rounded transition-colors
                    ${selectedFloor === floor 
                      ? 'bg-psp-critical text-white' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                  `}
                >
                  {floor === -1 ? 'P' : floor}
                  {(floorCounts.get(floor) || 0) > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 text-[10px] rounded-full flex items-center justify-center ${selectedFloor === floor ? 'bg-white text-psp-critical' : 'bg-psp-critical text-white'}`}>
                      {floorCounts.get(floor)}
                    </span>
                  )}
                </button>
              ))}
           </div>

           <div className="bg-[#0d1117]/90 backdrop-blur border border-border rounded-lg p-3 pointer-events-auto shadow-xl">
             <div className="text-xs font-semibold mb-2">Wizualizacja UWB</div>
             <div className="flex items-center justify-between gap-4 text-xs">
               <span className="text-muted-foreground">Zasięgi beaconów</span>
               <div className="w-8 h-4 bg-psp-success rounded-full relative cursor-pointer">
                 <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow"></div>
               </div>
             </div>
           </div>
        </header>

        {/* Map */}
        <div className="flex-1 bg-[#0d1117]">
          <MapControl 
            firefighters={MOCK_FIREFIGHTERS} 
            beacons={MOCK_BEACONS} 
            floor={selectedFloor}
            selectedFirefighterId={selectedFirefighterId}
          />
        </div>
      </main>
    </div>
  )
}
