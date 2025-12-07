import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapControl } from './components/MapControl';
import { Users, Radio, AlertTriangle, Layers, Menu, ChevronLeft } from 'lucide-react';
import { useSimulationData } from './hooks/useSimulationData';

export default function App() {
  const [selectedTab, setSelectedTab] = useState<'firefighters' | 'beacons' | 'alerts'>('alerts'); // Zmiana na 'alerts' jako domyślny
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [selectedFirefighterId, setSelectedFirefighterId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Pobieramy dane z zewnętrznego serwera
  const { firefighters, beacons, alerts, connected, sendCommand } = useSimulationData();

  // Oblicz liczbę strażaków na piętrach
  const floorCounts = new Map<number, number>();
  firefighters.forEach(t => {
    const floor = t.position.floor;
    floorCounts.set(floor, (floorCounts.get(floor) || 0) + 1);
  });

  const onAcknowledgeAlert = (alertId: string) => {
    // Tutaj możesz poprosić o nazwę użytkownika, który potwierdza alert
    const acknowledgedBy = "CLI-User"; // Można dodać input, aby to było dynamiczne
    sendCommand({
      command: "acknowledge_alert",
      alert_id: alertId,
      acknowledged_by: acknowledgedBy
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans">
      {/* SIDEBAR */}
      <aside 
        className={`flex-shrink-0 bg-[#0d1117] border-r border-border flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[380px]' : 'w-0 border-r-0'}`}
      >
        {/* Header */}
        <header className="p-4 bg-muted/30 border-b border-border min-w-[380px]">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-psp-critical" />
              Cyfrowy Nieśmiertelnik PSP
            </h1>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded border border-border hover:bg-muted transition-colors"
              title="Zwiń panel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className={`mt-2 text-xs flex items-center gap-2 ${connected ? 'text-psp-success bg-psp-success/10' : 'text-psp-critical bg-psp-critical/10'} p-1.5 rounded`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-psp-success animate-pulse' : 'bg-psp-critical'}`}></span>
            {connected ? 'System Online (niesmiertelnik.replit.app)' : 'Rozłączono'}
          </div>
        </header>

        {/* Tabs */}
        <div className="p-4 grid grid-cols-3 gap-1 bg-muted/50 min-w-[380px]">
          {/* Alerty jako pierwsze */}
          <button 
            onClick={() => setSelectedTab('alerts')}
            className={`flex items-center justify-center gap-2 p-2 text-xs font-medium rounded transition-all relative ${selectedTab === 'alerts' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
          >
            <AlertTriangle className="w-4 h-4 text-psp-critical" /> Alerty {/* Kolor czerwony dla ikony */}
            {alerts.filter(a => !a.resolved).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] bg-psp-critical text-white rounded-full flex items-center justify-center">
                {alerts.filter(a => !a.resolved).length}
              </span>
            )}
          </button>
          {/* Strażacy */}
          <button 
            onClick={() => setSelectedTab('firefighters')}
            className={`flex items-center justify-center gap-2 p-2 text-xs font-medium rounded transition-all ${selectedTab === 'firefighters' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
          >
            <Users className="w-4 h-4" /> Strażacy
          </button>
          {/* Beacony */}
          <button 
            onClick={() => setSelectedTab('beacons')}
            className={`flex items-center justify-center gap-2 p-2 text-xs font-medium rounded transition-all ${selectedTab === 'beacons' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
          >
            <Radio className="w-4 h-4" /> Beacony
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto min-w-[380px]">
          <Sidebar 
            tab={selectedTab} 
            firefighters={firefighters} 
            beacons={beacons}
            alerts={alerts}
            onSelectFirefighter={setSelectedFirefighterId}
            selectedId={selectedFirefighterId}
            onAcknowledgeAlert={onAcknowledgeAlert} // Przekazujemy funkcję do potwierdzania alertów
          />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <header className="absolute top-4 left-4 right-4 z-[1000] flex justify-between pointer-events-none">
           <div className="flex gap-2 pointer-events-auto">
             {/* Toggle Button (visible when sidebar closed) */}
             {!isSidebarOpen && (
               <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className="bg-[#0d1117]/90 backdrop-blur border border-border rounded-lg p-2 text-foreground hover:bg-muted/50 shadow-xl h-full flex items-center"
                 title="Rozwiń panel"
               >
                 <Menu className="w-5 h-5" />
               </button>
             )}

             <div className="bg-[#0d1117]/90 backdrop-blur border border-border rounded-lg p-2 flex gap-1 shadow-xl">
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
            firefighters={firefighters} 
            beacons={beacons} 
            floor={selectedFloor}
            selectedFirefighterId={selectedFirefighterId}
            isSidebarOpen={isSidebarOpen}
          />
        </div>
      </main>
    </div>
  )
}
