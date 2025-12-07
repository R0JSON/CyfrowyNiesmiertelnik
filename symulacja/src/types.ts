// Typy odwzorowujące dokumentację API v2.7.0

export interface Position {
  x: number;
  y: number;
  z: number;
  floor: number;
}

export interface Firefighter {
  id: string;
  name: string;
  role: string;
  team: string;
  rank?: string;
}

export interface Vitals {
  heart_rate_bpm: number;
  motion_state: 'walking' | 'running' | 'stationary' | 'crawling' | 'fallen' | 'climbing';
  stress_level?: string;
  stationary_duration_s?: number;
}

export interface SCBA {
  id: string;
  cylinder_pressure_bar: number;
  remaining_time_min: number;
  battery_percent: number;
  alarms: {
    low_pressure: boolean;
    very_low_pressure: boolean;
    motion: boolean;
  };
}

export interface Device {
  battery_percent: number;
  uptime_s?: number;
}

export interface Telemetry {
  tag_id: string;
  timestamp: string; // Dodano pole timestamp
  firefighter: Firefighter;
  position: Position;
  heading_deg?: number;
  vitals: Vitals;
  scba?: SCBA;
  device: Device;
  uwb_measurements?: any[];
}

export interface Beacon {
  id: string;
  name: string;
  type: 'entry' | 'anchor' | 'stairs' | 'hazard';
  position: Position;
  floor: number;
  status: 'active' | 'offline' | 'error';
  battery_percent: number;
  range_m?: number;
  tags_in_range?: string[];
}

export interface Alert {
  id: string;
  type: 'alert';
  alert_type: 'man_down' | 'sos_pressed' | 'high_heart_rate' | 'low_battery' | 'scba_low_pressure' | 'scba_critical' | 'beacon_offline' | 'tag_offline' | 'high_temperature' | 'high_co' | 'low_oxygen' | 'explosive_gas';
  severity: 'critical' | 'warning' | 'info';
  firefighter: Firefighter;
  position: Position;
  timestamp: string;
  resolved: boolean;
}

export interface Building {
  dimensions: {
    width_m: number;
    depth_m: number;
    height_m: number;
  };
  floors: {
    number: number;
    name: string;
    height_m: number;
  }[];
  entry_points?: {
    id: string;
    position: { x: number; y: number };
    floor: number;
    name: string;
  }[];
}
