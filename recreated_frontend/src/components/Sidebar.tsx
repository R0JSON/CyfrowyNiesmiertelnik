import { Heart, Battery, Activity, Gauge, User, Radio, AlertTriangle } from 'lucide-react';

interface Props {
  tab: 'firefighters' | 'beacons' | 'alerts';
  firefighters: any[];
  beacons: any[];
  onSelectFirefighter: (id: string) => void;
  selectedId: string | null;
}

export function Sidebar({ tab, firefighters, beacons, onSelectFirefighter, selectedId }: Props) {
  if (tab === 'firefighters') {
    return (
      <div className="divide-y divide-border">
        {firefighters.map(ff => (
          <div 
            key={ff.id} 
            onClick={() => onSelectFirefighter(ff.id)}
            className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-2 ${selectedId === ff.id ? 'bg-muted/30 border-l-psp-critical' : 'border-l-transparent'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{ff.name}</div>
                  <div className="text-xs text-muted-foreground">{ff.role}</div>
                </div>
              </div>
              <div className="text-xs px-2 py-1 bg-muted rounded">{ff.id}</div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="flex items-center justify-center gap-1 font-bold text-psp-warning">
                  <Heart className="w-3 h-3" /> {ff.hr}
                </div>
                <div className="text-[10px] text-muted-foreground">BPM</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="flex items-center justify-center gap-1 font-bold text-psp-info">
                  <Activity className="w-3 h-3" /> {ff.motion === 'running' ? 'Bieg' : ff.motion === 'walking' ? 'Chód' : 'Stop'}
                </div>
                <div className="text-[10px] text-muted-foreground">Ruch</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="flex items-center justify-center gap-1 font-bold text-foreground">
                  <Battery className="w-3 h-3" /> {ff.battery}%
                </div>
                <div className="text-[10px] text-muted-foreground">Bat</div>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded">
                <div className="flex items-center justify-center gap-1 font-bold text-psp-info">
                  {ff.floor}
                </div>
                <div className="text-[10px] text-muted-foreground">Piętro</div>
              </div>
            </div>
            
            <div className="mt-2 grid grid-cols-2 gap-2">
               <div className="bg-muted/30 p-1.5 rounded flex items-center justify-center gap-2 text-xs font-medium text-psp-info">
                 <Gauge className="w-3 h-3" /> {ff.pressure} bar
               </div>
               <div className="bg-muted/30 p-1.5 rounded flex items-center justify-center gap-2 text-xs font-medium text-psp-success">
                 {ff.time} min
               </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'beacons') {
    return (
      <div className="divide-y divide-border">
        {beacons.map(b => (
          <div key={b.id} className="p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded flex items-center justify-center ${
                b.status === 'offline' ? 'bg-psp-critical/20 text-psp-critical' :
                b.type === 'entry' ? 'bg-psp-info/20 text-psp-info' :
                'bg-psp-success/20 text-psp-success'
              }`}>
                <Radio className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{b.name}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{b.floor === 0 ? 'Parter' : `${b.floor}. piętro`}</span>
                  <span>•</span>
                  <span className={b.status === 'active' ? 'text-psp-success' : 'text-psp-critical'}>
                    {b.status === 'active' ? 'Aktywny' : 'Offline'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-xs font-medium">
                  <Battery className="w-3 h-3" /> {b.battery}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 text-center text-muted-foreground">
      <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
      <p>Brak aktywnych alarmów</p>
    </div>
  );
}
