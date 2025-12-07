import { Heart, Battery, Activity, Gauge, User, Radio, AlertTriangle, CheckSquare } from 'lucide-react'; // Dodaj CheckSquare
import { Telemetry, Beacon, Alert } from '../types';

interface Props {
  tab: 'firefighters' | 'beacons' | 'alerts';
  firefighters: Telemetry[];
  beacons: Beacon[];
  alerts: Alert[];
  onSelectFirefighter: (id: string) => void;
  selectedId: string | null;
  onAcknowledgeAlert: (alertId: string) => void; // Nowy prop do potwierdzania alertów
}

export function Sidebar({ tab, firefighters, beacons, alerts, onSelectFirefighter, selectedId, onAcknowledgeAlert }: Props) {
  if (tab === 'firefighters') {
    return (
      <div className="divide-y divide-border">
        {firefighters.map(t => {
          const ff = t.firefighter;
          const vitals = t.vitals;
          const scba = t.scba;
          const device = t.device;
          
          return (
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
                  <div className={`flex items-center justify-center gap-1 font-bold ${vitals.heart_rate_bpm > 120 ? 'text-psp-warning' : 'text-psp-success'}`}>
                    <Heart className="w-3 h-3" /> {vitals.heart_rate_bpm}
                  </div>
                  <div className="text-[10px] text-muted-foreground">BPM</div>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <div className="flex items-center justify-center gap-1 font-bold text-psp-info">
                    <Activity className="w-3 h-3" /> {vitals.motion_state === 'running' ? 'Bieg' : vitals.motion_state === 'walking' ? 'Chód' : 'Stop'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Ruch</div>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <div className={`flex items-center justify-center gap-1 font-bold ${device.battery_percent < 30 ? 'text-psp-critical' : 'text-foreground'}`}>
                    <Battery className="w-3 h-3" /> {device.battery_percent}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">Bat</div>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <div className="flex items-center justify-center gap-1 font-bold text-psp-info">
                    {t.position.floor}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Piętro</div>
                </div>
              </div>
              
              {scba && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                   <div className="bg-muted/30 p-1.5 rounded flex items-center justify-center gap-2 text-xs font-medium text-psp-info">
                     <Gauge className="w-3 h-3" /> {Math.round(scba.cylinder_pressure_bar)} bar
                   </div>
                   <div className={`bg-muted/30 p-1.5 rounded flex items-center justify-center gap-2 text-xs font-medium ${scba.remaining_time_min < 15 ? 'text-psp-critical' : 'text-psp-success'}`}>
                     {scba.remaining_time_min} min
                   </div>
                </div>
              )}
            </div>
          );
        })}
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
                  <Battery className="w-3 h-3" /> {b.battery_percent}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'alerts') {
    const activeAlerts = alerts.filter(a => !a.resolved);
    
    if (activeAlerts.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Brak aktywnych alarmów</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-border">
        {activeAlerts.map(a => (
          <div key={a.id} className="p-3 bg-psp-critical/10 border-l-4 border-l-psp-critical animate-pulse-critical"> {/* Zmienione na psp-critical */}
             <div className="flex justify-between items-center"> {/* Dodano items-center */}
               <div className="font-bold text-sm text-psp-critical uppercase">{a.alert_type.replace('_', ' ')}</div>
               <div className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleTimeString()}</div>
             </div>
             <div className="mt-1 text-sm font-medium">{a.firefighter.name}</div>
             <div className="text-xs text-muted-foreground">
               Piętro: {a.position.floor} • ({a.position.x.toFixed(1)}, {a.position.y.toFixed(1)})
             </div>
             <button
               onClick={() => onAcknowledgeAlert(a.id)}
               className="mt-3 px-3 py-1 bg-psp-success/20 text-psp-success rounded-md text-xs flex items-center gap-1 hover:bg-psp-success/30 transition-colors"
             >
               <CheckSquare className="w-3 h-3" /> Potwierdź
             </button>
          </div>
        ))}
      </div>
    );
  }

  return null;
}