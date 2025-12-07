# API Symulatora Nieśmiertelnik PSP
## Dokumentacja v2.7.0 - Tryb Hackathonowy HackNation 2025 – Zaprogramuj przyszłość Polski | Pula nagród: 25 000 PLN

> **„Ratują innych, ryzykując własne życie. Czas, by technologia pomogła im w tym zadaniu. Stwórz rozwiązanie, które zwiększy bezpieczeństwo strażaków – nawet tam, gdzie nie ma sieci ani sygnału GPS."**

**Strona wydarzenia:** https://hacknation.pl/ | **Mentor:** Michał Kłosiński - KG PSP

**Symulator jest gotowy do użycia!** Generuje realistyczne dane telemetryczne z 6 strażaków, 18 beaconów UWB (zasięg 15m), bramki NIB, aparatów SCBA, czujników środowiskowych i systemu RECCO.

---

## 📋 Podsumowanie API

| Komponent | Ilość | Częstotliwość | Opis |
|-----------|-------|---------------|------|
| **Strażacy** | 6 | - | Pełne wyposażenie: tag, HR band, SCBA, RECCO |
| **Beacony UWB** | 18 | 5s status | Zasięg 15m, min. 3 do trilateracji |
| **Bramka NIB** | 1 | 10s status | LoRa + LTE + WiFi + GPS |
| **Telemetria** | 6 strumieni | 1 Hz | Pozycja, vitals, SCBA, środowisko |
| **Alerty** | event-driven | - | 12 typów (man-down, SOS, CO, O2...) |
| **Pogoda** | 1 stacja | 30s | Temperatura, wiatr, ciśnienie |

### Endpointy

| Typ | URL | Opis |
|-----|-----|------|
| **WebSocket** | `wss://niesmiertelnik.replit.app/ws` | Real-time telemetria i alerty |
| **REST API** | `https://niesmiertelnik.replit.app/api/v1/` | On-demand queries i sterowanie |
| **Frontend** | `https://niesmiertelnik.replit.app` | Wizualizacja mapy i statusów |

---

## 🔌 Połączenie

### Publiczny serwer (zalecany)
```
Frontend:   https://niesmiertelnik.replit.app
WebSocket:  wss://niesmiertelnik.replit.app/ws
REST API:   https://niesmiertelnik.replit.app/api/v1/
```

### Lokalnie (opcjonalnie)
```
Frontend:   http://localhost:5000
WebSocket:  ws://localhost:5000/ws
REST API:   http://localhost:5000/api/v1/
```

> **Uwaga:** Możesz używać publicznego serwera bez instalacji lub uruchomić lokalnie przez `npm run dev`.

---

## 👨‍🚒 Strażacy w symulacji

System symuluje **6 strażaków** z pełnym wyposażeniem:

| ID | Tag | Imię | Stopień | Rola | Zespół | HR Band | SCBA | RECCO |
|----|-----|------|---------|------|--------|---------|------|-------|
| FF-001 | TAG-001 | Jan Kowalski | asp. sztab. | Dowódca roty | Rota 1 | HR-001 | SCBA-001 | RECCO-001 |
| FF-002 | TAG-002 | Piotr Nowak | ogn. | Przodownik | Rota 1 | HR-002 | SCBA-002 | RECCO-002 |
| FF-003 | TAG-003 | Anna Wiśniewska | st. ogn. | Ratownik | Rota 1 | HR-003 | SCBA-003 | RECCO-003 |
| FF-004 | TAG-004 | Tomasz Zieliński | mł. ogn. | Ratownik | Rota 1 | HR-004 | SCBA-004 | RECCO-004 |
| FF-005 | TAG-005 | Marek Kamiński | sekc. | Kierowca-operator | Rota 1 | HR-005 | SCBA-005 | RECCO-005 |
| FF-006 | TAG-006 | Katarzyna Dąbrowska | asp. | Dowódca sekcji RIT | RIT | HR-006 | SCBA-006 | RECCO-006 |

---

## 🏢 Budynek szkoleniowy

```
Wymiary: 40m × 25m × 12m (szerokość × głębokość × wysokość)
GPS Origin: 52.2297°N, 21.0122°E (Warszawa)
Wysokość n.p.m.: 110m

Piętra:
  -1: Piwnica     (z = -3.0m) - STREFA WYSOKA NIEBEZPIECZEŃSTWO
   0: Parter      (z =  0.0m) - STREFA ŚREDNIA
   1: 1. piętro   (z =  3.2m) - STREFA NISKA
   2: 2. piętro   (z =  6.4m) - STREFA NISKA

Wejścia:
  • Główne:      (x=0,  y=5)   - parter
  • Boczne:      (x=40, y=20)  - parter
  • Techniczne:  (x=20, y=25)  - piwnica

Strefy zagrożenia:
  • Kotłownia:         piętro -1, x: 5-15m, y: 3-10m  (fire_risk)
  • Magazyn chemiczny: piętro 0,  x: 25-35m, y: 15-22m (chemical)

Klatka schodowa: (x=35, y=20) - łączy piętra -1 do 2
```

### Przeliczanie współrzędnych lokalnych → GPS

```javascript
// Stałe dla Warszawy
const GPS_ORIGIN = { lat: 52.2297, lon: 21.0122 };
const SCALE_LAT = 111320;  // metrów na stopień szerokości
const SCALE_LON = 71695;   // metrów na stopień długości (dla 52°N)

// Konwersja lokalnych (x, y) na GPS
function localToGPS(x, y) {
  return {
    lat: GPS_ORIGIN.lat + (y / SCALE_LAT),
    lon: GPS_ORIGIN.lon + (x / SCALE_LON)
  };
}

// Przykład: strażak na pozycji (12.5, 8.3)
const gps = localToGPS(12.5, 8.3);
// gps = { lat: 52.229774, lon: 21.012374 }
```

---

## 📥 WebSocket - Wiadomości przychodzące

### 1. Powitanie (welcome)
Wysyłane jednokrotnie po połączeniu.

```json
{
  "type": "welcome",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "message": "Połączono z symulatorem Nieśmiertelnik PSP v2.7.0",
  "simulator_version": "2.7.0",
  "capabilities": ["uwb", "imu", "barometer", "gps", "scba", "recco", "environment", "weather", "recording"]
}
```

### 2. Konfiguracja budynku (building_config)
Wysyłane jednokrotnie po połączeniu.

```json
{
  "type": "building_config",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "building": {
    "id": "BLD-TRAINING-01",
    "name": "Obiekt szkoleniowy PSP Warszawa",
    "address": "ul. Ćwiczebna 1, 00-001 Warszawa",
    "type": "industrial",
    "dimensions": { "width_m": 40, "depth_m": 25, "height_m": 12 },
    "gps_reference": {
      "origin": { "lat": 52.2297, "lon": 21.0122, "altitude_m": 110 },
      "rotation_deg": 0,
      "scale_lat_m_per_deg": 111320,
      "scale_lon_m_per_deg": 71695
    },
    "floors": [
      { "number": -1, "name": "Piwnica", "height_m": -3.0, "hazard_level": "high" },
      { "number": 0, "name": "Parter", "height_m": 0, "hazard_level": "medium" },
      { "number": 1, "name": "1. piętro", "height_m": 3.2, "hazard_level": "low" },
      { "number": 2, "name": "2. piętro", "height_m": 6.4, "hazard_level": "low" }
    ],
    "entry_points": [
      { "id": "ENTRY-01", "name": "Wejście główne", "position": { "x": 0, "y": 5 }, "floor": 0 },
      { "id": "ENTRY-02", "name": "Wejście boczne", "position": { "x": 40, "y": 20 }, "floor": 0 },
      { "id": "ENTRY-03", "name": "Wejście techniczne", "position": { "x": 20, "y": 25 }, "floor": -1 }
    ],
    "hazard_zones": [
      { "id": "HAZ-01", "name": "Kotłownia", "floor": -1, "bounds": { "x1": 5, "y1": 3, "x2": 15, "y2": 10 }, "type": "fire_risk" },
      { "id": "HAZ-02", "name": "Magazyn chemiczny", "floor": 0, "bounds": { "x1": 25, "y1": 15, "x2": 35, "y2": 22 }, "type": "chemical" }
    ],
    "stairwells": [
      { "id": "STAIR-01", "name": "Klatka główna", "position": { "x": 35, "y": 20 }, "floors": [-1, 0, 1, 2] }
    ]
  }
}
```

### 3. Konfiguracja beaconów (beacons_config)
Wysyłane jednokrotnie po połączeniu.

```json
{
  "type": "beacons_config",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "beacons": [
    {
      "id": "BCN-001",
      "name": "Wejście główne",
      "position": { "x": 2, "y": 5, "z": 0 },
      "floor": 0,
      "type": "entry",
      "battery_percent": 95,
      "battery_voltage_mv": 3850,
      "status": "active",
      "firmware_version": "1.2.0",
      "hardware_version": "2.0",
      "gps": { "lat": 52.2297, "lon": 21.0122, "altitude_m": 110 }
    }
  ]
}
```

### 4. Lista strażaków (firefighters_list)
Wysyłana jednokrotnie po połączeniu.

```json
{
  "type": "firefighters_list",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "firefighters": [
    {
      "id": "FF-001",
      "tag_id": "TAG-001",
      "name": "Jan Kowalski",
      "rank": "asp. sztab.",
      "role": "Dowódca roty",
      "team": "Rota 1",
      "hr_band_id": "HR-001",
      "scba_id": "SCBA-001",
      "recco_id": "RECCO-001"
    }
  ]
}
```

### 5. Telemetria z tagów (tag_telemetry) - GŁÓWNE DANE
Wysyłana co 1 sekundę dla każdego tagu. **Rozszerzona struktura** z pełnymi danymi sensorycznymi.

```json
{
  "type": "tag_telemetry",
  "timestamp": "2025-01-15T14:32:01.234Z",
  "sequence": 121,
  "tag_id": "TAG-001",

  "firefighter": {
    "id": "FF-001",
    "name": "Jan Kowalski",
    "rank": "asp. sztab.",
    "role": "Dowódca roty",
    "team": "Rota 1"
  },

  "position": {
    "x": 12.45,
    "y": 8.32,
    "z": 0.15,
    "floor": 0,
    "confidence": 0.92,
    "source": "uwb_fusion",
    "beacons_used": 4,
    "accuracy_m": 0.25,
    "trilateration": {
      "raw_position": { "x": 12.48, "y": 8.30, "z": 0.12 },
      "filtered_position": { "x": 12.45, "y": 8.32, "z": 0.15 },
      "residual_error_m": 0.18,
      "gdop": 1.8,
      "hdop": 1.2,
      "vdop": 1.4,
      "beacons_used": ["BCN-001", "BCN-002", "BCN-003", "BCN-004"],
      "algorithm": "nlse",
      "iterations": 8,
      "convergence": true
    },
    "drift": {
      "drift_x_m": 0.02,
      "drift_y_m": -0.01,
      "drift_z_m": 0.005,
      "drift_total_m": 0.025,
      "noise_sigma_m": 0.08,
      "last_correction": 1705329120000
    },
    "gps": {
      "lat": 52.229774,
      "lon": 21.012374,
      "altitude_m": 110.15,
      "accuracy_m": 3.2,
      "satellites": 12,
      "fix": true
    }
  },

  "heading_deg": 45.2,

  "uwb_measurements": [
    {
      "beacon_id": "BCN-002",
      "beacon_name": "Hol - centrum",
      "range_m": 2.15,
      "rssi_dbm": -45,
      "fp_power_dbm": -42,
      "rx_power_dbm": -47,
      "los": true,
      "nlos_probability": 0.02,
      "timestamp": 1705329121234,
      "quality": "excellent"
    },
    {
      "beacon_id": "BCN-001",
      "beacon_name": "Wejście główne",
      "range_m": 8.23,
      "rssi_dbm": -54,
      "fp_power_dbm": -51,
      "rx_power_dbm": -56,
      "los": true,
      "nlos_probability": 0.08,
      "timestamp": 1705329121234,
      "quality": "excellent"
    },
    {
      "beacon_id": "BCN-007",
      "beacon_name": "Centrum - północ",
      "range_m": 10.82,
      "rssi_dbm": -58,
      "fp_power_dbm": -55,
      "rx_power_dbm": -60,
      "los": true,
      "nlos_probability": 0.12,
      "timestamp": 1705329121234,
      "quality": "good"
    },
    {
      "beacon_id": "BCN-003",
      "beacon_name": "Korytarz północny",
      "range_m": 12.05,
      "rssi_dbm": -60,
      "fp_power_dbm": -57,
      "rx_power_dbm": -62,
      "los": true,
      "nlos_probability": 0.15,
      "timestamp": 1705329121234,
      "quality": "good"
    }
  ],

  "imu": {
    "accel": { "x": 0.12, "y": -0.08, "z": 9.78 },
    "gyro": { "x": 0.5, "y": -0.3, "z": 0.1 },
    "mag": { "x": 22.5, "y": -5.2, "z": 42.1 },
    "orientation": { "roll": 2.1, "pitch": -1.5, "yaw": 45.2 },
    "temperature_c": 28.5
  },

  "pass_status": {
    "status": "active",
    "time_since_motion_s": 0,
    "alarm_threshold_s": 30,
    "pre_alarm_threshold_s": 20,
    "sensitivity": "normal",
    "alarm_active": false,
    "alarm_acknowledged": false
  },

  "barometer": {
    "pressure_pa": 101125,
    "altitude_rel_m": 0.15,
    "temperature_c": 28.5,
    "trend": "stable",
    "reference_pressure_pa": 101325,
    "estimated_floor": 0,
    "floor_confidence_percent": 95,
    "vertical_speed_mps": 0.0
  },

  "vitals": {
    "heart_rate_bpm": 95,
    "heart_rate_variability_ms": 45,
    "heart_rate_confidence": 98,
    "hr_zone": "light",
    "hr_band_id": "HR-001",
    "hr_band_battery": 85,
    "skin_temperature_c": 34.2,
    "motion_state": "walking",
    "step_count": 1234,
    "calories_burned": 250,
    "stress_level": "moderate",
    "stationary_duration_s": 0
  },

  "scba": {
    "id": "SCBA-001",
    "manufacturer": "Dräger",
    "model": "PSS 7000",
    "cylinder_pressure_bar": 280,
    "max_pressure_bar": 300,
    "consumption_rate_lpm": 45,
    "remaining_time_min": 35,
    "alarms": {
      "low_pressure": false,
      "very_low_pressure": false,
      "motion": false
    },
    "battery_percent": 92,
    "connection_status": "connected"
  },

  "recco": {
    "id": "RECCO-001",
    "type": "rescue",
    "location": "ubiór ochronny - kurtka",
    "detected": false,
    "last_detected": null,
    "signal_strength": null,
    "estimated_distance_m": null,
    "bearing_deg": null,
    "detector_id": "RECCO-DET-001"
  },

  "black_box": {
    "recording": true,
    "storage_used_percent": 12,
    "records_count": 7200,
    "write_rate_hz": 10
  },

  "device": {
    "tag_id": "TAG-001",
    "firmware_version": "2.4.0",
    "hardware_version": "3.0",
    "battery_percent": 78,
    "battery_voltage_mv": 3850,
    "battery_charging": false,
    "battery_temperature_c": 32,
    "connection_primary": "lora",
    "connection_backup": "ble",
    "lora_rssi_dbm": -82,
    "lora_snr_db": 8.5,
    "lte_rssi_dbm": -95,
    "lte_operator": "Play",
    "uptime_s": 7200,
    "last_sync_cloud": 1705329120000,
    "sos_button_pressed": false
  }
}
```

### 6. Status beaconów (beacons_status)
Wysyłany co 5 sekund.

```json
{
  "type": "beacons_status",
  "timestamp": "2025-01-15T14:32:05.000Z",
  "beacons": [
    {
      "id": "BCN-001",
      "name": "Wejście główne",
      "position": { "x": 2, "y": 5, "z": 0 },
      "floor": 0,
      "type": "entry",
      "status": "active",
      "battery_percent": 95,
      "battery_voltage_mv": 3850,
      "tags_in_range": ["TAG-001", "TAG-002"],
      "detected_tags": [
        {
          "tag_id": "TAG-001",
          "firefighter_id": "FF-001",
          "firefighter_name": "Jan Kowalski",
          "range_m": 5.23,
          "rssi_dbm": -58,
          "signal_quality": "excellent",
          "los": true,
          "nlos_probability": 0.12,
          "last_seen": 1705329125000,
          "velocity_mps": 1.2,
          "direction_deg": 45
        }
      ],
      "uwb_tx_count": 12345,
      "uwb_rx_count": 12340,
      "last_ping_ms": 150,
      "temperature_c": 28,
      "firmware_version": "1.2.0",
      "hardware_version": "2.0",
      "signal_quality": "excellent",
      "error_count": 0,
      "gps": { "lat": 52.2297, "lon": 21.0122, "altitude_m": 110 }
    }
  ]
}
```

### 7. Status bramki NIB (nib_status)
Wysyłany co 10 sekund.

```json
{
  "type": "nib_status",
  "timestamp": "2025-01-15T14:32:10.000Z",
  "nib": {
    "id": "NIB-001",
    "name": "Bramka taktyczna GBA 2.5/16",
    "vehicle": "GBA 2.5/16 nr 301W12",
    "vehicle_type": "Gaśniczy",
    "status": "online",
    "uptime_s": 3600,
    "position_gps": {
      "lat": 52.2297,
      "lon": 21.0122,
      "altitude_m": 110,
      "timestamp": "2025-01-15T14:32:10.000Z"
    },
    "power": {
      "source": "vehicle",
      "battery_percent": 100,
      "voltage_v": 13.8,
      "charging": true,
      "backup_battery_percent": 95
    },
    "connections": {
      "lte": {
        "status": "connected",
        "signal_rssi": -67,
        "signal_bars": 4,
        "operator": "Play",
        "technology": "LTE",
        "ip_address": "10.0.0.15",
        "data_usage_mb": 125.5
      },
      "lora": {
        "status": "active",
        "devices_connected": 6,
        "frequency_mhz": 868,
        "spreading_factor": 7,
        "bandwidth_khz": 125,
        "tx_power_dbm": 14,
        "packets_rx": 21600,
        "packets_tx": 200,
        "duty_cycle_percent": 0.8
      },
      "wifi": {
        "status": "active",
        "clients": 2,
        "ssid": "PSP-DOWODCA",
        "channel": 6,
        "security": "WPA3"
      },
      "gps": {
        "status": "fix",
        "satellites": 12,
        "hdop": 0.9,
        "pdop": 1.4,
        "fix_type": "3D"
      }
    },
    "system": {
      "cpu_percent": 18,
      "memory_percent": 45,
      "memory_total_mb": 8192,
      "disk_percent": 23,
      "disk_total_gb": 256,
      "temperature_c": 42,
      "fan_rpm": 1200,
      "load_average": [0.5, 0.4, 0.3]
    },
    "software": {
      "firmware_version": "2.4.0",
      "os_version": "Linux 5.15",
      "last_update": "2025-01-10T00:00:00Z",
      "auto_update": true
    },
    "statistics": {
      "packets_received": 21600,
      "packets_sent_cloud": 21600,
      "alerts_generated": 3,
      "active_alerts": 1,
      "bytes_received": 1250000,
      "bytes_sent": 980000
    }
  },
  "recco_detector": {
    "id": "DET-001",
    "name": "RECCO R9",
    "status": "inactive",
    "battery_percent": 85,
    "range_m": 80,
    "frequency_mhz": 1600,
    "last_scan": null,
    "reflectors_detected": 0
  }
}
```

### 8. Detektor RECCO (recco_detector)
Wysyłany przy aktywacji RECCO lub zmianach.

```json
{
  "type": "recco_detector",
  "timestamp": "2025-01-15T14:35:00.000Z",
  "detector": {
    "id": "DET-001",
    "name": "RECCO R9",
    "status": "active",
    "battery_percent": 85,
    "range_m": 80,
    "frequency_mhz": 1600,
    "last_scan": 1705329300000,
    "reflectors_detected": 2
  }
}
```

### 9. Pogoda (weather)
Wysyłana co 30 sekund lub przy znacznych zmianach.

```json
{
  "type": "weather",
  "timestamp": "2025-01-15T14:32:30.000Z",
  "weather": {
    "temperature_c": 8.5,
    "humidity_percent": 72,
    "pressure_hpa": 1013.25,
    "wind_speed_mps": 3.2,
    "wind_direction_deg": 225,
    "wind_gusts_mps": 5.1,
    "precipitation_mm": 0,
    "visibility_m": 8000,
    "uv_index": 2,
    "cloud_cover_percent": 45
  }
}
```

### 10. Alarm (alert) ⚠️
Wysyłany gdy wystąpi zdarzenie krytyczne.

```json
{
  "id": "ALERT-1705329322000",
  "type": "alert",
  "timestamp": "2025-01-15T14:35:22Z",
  "alert_type": "man_down",
  "severity": "critical",
  "tag_id": "TAG-003",
  "firefighter": {
    "id": "FF-003",
    "name": "Anna Wiśniewska",
    "role": "Ratownik",
    "team": "Rota 1"
  },
  "position": {
    "x": 22.1,
    "y": 15.8,
    "z": 0.2,
    "floor": 0
  },
  "details": {
    "stationary_duration_s": 35,
    "last_motion_state": "walking",
    "last_heart_rate": 142
  },
  "resolved": false,
  "acknowledged": false
}
```

**Typy alertów:**
| Typ | Severity | Opis |
|-----|----------|------|
| `man_down` | critical | Bezruch >30s |
| `sos_pressed` | critical | Naciśnięty przycisk SOS |
| `high_heart_rate` | warning | Tętno >180 bpm |
| `low_battery` | warning | Bateria <20% |
| `scba_low_pressure` | warning | Ciśnienie SCBA niskie |
| `scba_critical` | critical | Ciśnienie SCBA krytyczne |
| `beacon_offline` | warning | Beacon nie odpowiada |
| `tag_offline` | critical | Tag strażaka nie odpowiada |
| `high_temperature` | warning | Wysoka temperatura otoczenia |
| `high_co` | critical | Wysokie stężenie CO |
| `low_oxygen` | critical | Niski poziom tlenu |
| `explosive_gas` | critical | Wykryto gaz wybuchowy |

---

## 📤 WebSocket - Komendy

### Wywołaj alarm Man-Down
```json
{ "command": "trigger_man_down", "firefighter_id": "FF-003" }
```

### Wywołaj alarm SOS
```json
{ "command": "trigger_sos", "firefighter_id": "FF-002" }
```

### Wyłącz beacon (symulacja awarii)
```json
{ "command": "beacon_offline", "beacon_id": "BCN-002" }
```

### Uzupełnij SCBA (zatankuj aparat)
```json
{ "command": "scba_refill", "firefighter_id": "FF-001" }
```

### Potwierdź alarm
```json
{ "command": "acknowledge_alert", "alert_id": "ALERT-xxx", "acknowledged_by": "Dowódca" }
```

### Reset symulacji
```json
{ "command": "reset" }
```

### Pauza / Wznowienie
```json
{ "command": "pause" }
```

### Zmiana prędkości symulacji
```json
{ "command": "set_speed", "speed": 2.0 }
```
Zakres: 0.1 - 10.0

### Pobierz historię pozycji
```json
{ "command": "get_history", "firefighter_id": "FF-001", "limit": 60 }
```

---

## Beacony UWB

System wykorzystuje **18 beaconów UWB** rozstawionych w budynku szkoleniowym.

### Kluczowe parametry UWB

| Parametr | Wartość | Opis |
|----------|---------|------|
| **Maksymalny zasięg** | **15 m** | Tag odbiera sygnał tylko od beaconów w odległości ≤15m |
| **Minimum beaconów** | **3** | Wymagane minimum 3 beacony w zasięgu do pozycjonowania |
| **Częstotliwość** | 1 Hz | Pomiary UWB co 1 sekundę |
| **Filtrowanie pięter** | ±1 piętro | Tag widzi beacony z aktualnego piętra ±1 |

### Lista beaconów

| ID | Nazwa | Pozycja (x,y,z) | Piętro | Typ |
|----|-------|-----------------|--------|-----|
| BCN-B01 | Piwnica - wejście | (20, 24, -3.0) | -1 | anchor |
| BCN-B02 | Piwnica - kotłownia | (7, 6, -3.0) | -1 | hazard |
| BCN-001 | Wejście główne | (2, 5, 0) | 0 | entry |
| BCN-002 | Hol - centrum | (10, 5, 0) | 0 | anchor |
| BCN-003 | Korytarz północny | (20, 11, 0) | 0 | anchor |
| BCN-004 | Sala konferencyjna | (10, 19, 0) | 0 | anchor |
| BCN-005 | Klatka schodowa - parter | (35, 19, 0) | 0 | stairs |
| BCN-006 | Wejście boczne | (38, 20, 0) | 0 | entry |
| BCN-101 | Open space - północ | (10, 5, 3.2) | 1 | anchor |
| BCN-102 | Open space - południe | (10, 12, 3.2) | 1 | anchor |
| BCN-103 | Sala szkoleń | (35, 7, 3.2) | 1 | anchor |
| BCN-104 | Klatka schodowa - 1p | (35, 21, 3.2) | 1 | stairs |
| BCN-201 | Sala A | (10, 6, 6.4) | 2 | anchor |
| BCN-202 | Sala B | (30, 6, 6.4) | 2 | anchor |
| BCN-203 | Laboratorium | (12, 20, 6.4) | 2 | anchor |
| BCN-007 | Centrum - północ | (20, 5, 0) | 0 | anchor |
| BCN-008 | Centrum - południe | (20, 18, 0) | 0 | anchor |
| BCN-105 | Open space - centrum | (20, 10, 3.2) | 1 | anchor |

### Algorytm pozycjonowania

Symulator wykorzystuje **NLSE (Non-Linear Least Squares Estimation)** z filtrem Kalmana:

1. **Zbieranie pomiarów** - tag zapisuje odległości do wszystkich beaconów w zasięgu ≤15m
2. **Publikacja w API** - tablica `uwb_measurements` zawiera min. 3 beacony (jeśli dostępne) lub więcej
3. **Trilateration** - obliczanie pozycji na podstawie ≥3 beaconów
4. **Fuzja IMU** - korekta dryfu z danych akcelerometru/żyroskopu
5. **Filtr Kalmana** - wygładzanie trajektorii, predykcja

> **Uwaga:** Pozycjonowanie działa tylko gdy tag ma w zasięgu minimum 3 beacony. Jeśli jest mniej, pozycja nie jest aktualizowana.

**Parametry jakości pozycji:**
- `confidence` - pewność pozycji (0.0 - 1.0)
- `accuracy_m` - dokładność w metrach
- `gdop/hdop/vdop` - rozmycie geometryczne (niższe = lepsze)
- `beacons_used` - liczba użytych beaconów (min 3 dla 2D, 4 dla 3D)

---

## 🌡️ Czujniki środowiskowe

Tag nieśmiertelnik posiada zestaw czujników środowiskowych. Dane są dostępne w `tag_telemetry.environment`:

```json
{
  "environment": {
    "co_ppm": 15,              // Tlenek węgla (norma: <35 ppm, alarm: >100 ppm)
    "co2_ppm": 850,            // Dwutlenek węgla (norma: 400-1000 ppm)
    "o2_percent": 20.8,        // Tlen (norma: 19.5-23.5%, alarm: <19.5%)
    "lel_percent": 2,          // Dolna granica wybuchowości (alarm: >10%)
    "temperature_c": 28.5,     // Temperatura otoczenia
    "humidity_percent": 65,    // Wilgotność
    "voc_ppb": 120,            // Lotne związki organiczne
    "pm25_ugm3": 35            // Pyły zawieszone PM2.5
  }
}
```

### Progi alarmowe

| Czujnik | Jednostka | Norma | Ostrzeżenie | Alarm krytyczny |
|---------|-----------|-------|-------------|-----------------|
| CO | ppm | 0-35 | 50-100 | >100 |
| CO2 | ppm | 400-1000 | 1000-2000 | >5000 |
| O2 | % | 19.5-23.5 | 18-19.5 | <18 |
| LEL | % | 0-10 | 10-25 | >25 |
| Temperatura | °C | 0-40 | 40-60 | >60 |

### Alerty środowiskowe

Symulator automatycznie generuje alerty gdy czujniki przekroczą progi:

- `high_co` - wysokie stężenie CO (severity: critical)
- `low_oxygen` - niski poziom tlenu (severity: critical)
- `explosive_gas` - wykryto gaz wybuchowy (severity: critical)
- `high_temperature` - wysoka temperatura (severity: warning)

---

## 🌐 REST API

### Indeks endpointów

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/v1/health` | GET | Status serwera i symulacji |
| `/api/v1/building` | GET | Konfiguracja budynku |
| `/api/v1/beacons` | GET | Lista beaconów |
| `/api/v1/beacons/:id` | GET | Szczegóły beacona |
| `/api/v1/firefighters` | GET | Lista strażaków |
| `/api/v1/firefighters/:id` | GET | Pełna telemetria strażaka |
| `/api/v1/firefighters/:id/history` | GET | Historia pozycji |
| `/api/v1/nib` | GET | Status bramki NIB |
| `/api/v1/scba` | GET | Status aparatów SCBA |
| `/api/v1/recco` | GET | Status systemu RECCO |
| `/api/v1/weather` | GET | Dane pogodowe |
| `/api/v1/alerts` | GET | Lista alarmów |
| `/api/v1/simulation/control` | POST | Sterowanie symulacją |
| `/api/v1/recording/status` | GET | Status nagrywania |
| `/api/v1/incidents` | GET | Lista incydentów |
| `/api/v1/incidents/:id` | GET | Szczegóły incydentu |
| `/api/v1/incidents/:id/replay` | GET | Odtwarzanie incydentu |
| `/api/v1/incidents/:id/firefighters/:ffId/timeline` | GET | Oś czasu strażaka |
| `/api/v1/incidents/:id` | DELETE | Usuń incydent |

---

### GET /api/v1/health
Status serwera i symulacji.

```json
{
  "status": "ok",
  "version": "2.7.0",
  "uptime_s": 3600,
  "simulation_running": true,
  "simulation_speed": 1.0,
  "connected_clients": 3,
  "firefighters_count": 6,
  "beacons_count": 18,
  "active_alerts": 1
}
```

### GET /api/v1/building
Pełna konfiguracja budynku z beaconami i strefami.

### GET /api/v1/beacons
Lista wszystkich beaconów z aktualnym stanem.

### GET /api/v1/beacons/:id
Szczegóły pojedynczego beacona.

### GET /api/v1/firefighters
Lista strażaków z podstawowymi danymi.

### GET /api/v1/firefighters/:id
Pełna telemetria strażaka (jak tag_telemetry).

### GET /api/v1/firefighters/:id/history?limit=60
Historia pozycji strażaka (max 300 rekordów).

```json
{
  "firefighter_id": "FF-001",
  "records": [
    {
      "timestamp": 1705329121000,
      "position": { "x": 12.45, "y": 8.32, "z": 0, "floor": 0 },
      "heart_rate": 95,
      "motion_state": "walking",
      "scba_pressure_bar": 280,
      "battery_percent": 78
    }
  ]
}
```

### GET /api/v1/nib
Status bramki NIB z pełnymi danymi połączeń.

### GET /api/v1/scba
Status wszystkich aparatów powietrznych.

### GET /api/v1/recco
Status systemu RECCO (detektor i reflektory).

### GET /api/v1/weather
Aktualne dane pogodowe ze stacji na pojeździe.

### GET /api/v1/alerts?active=true
Lista alarmów. Parametr `active=true` zwraca tylko nierozwiązane.

### POST /api/v1/simulation/control
Sterowanie symulacją i nagrywaniem.

**Dostępne akcje:**

| Akcja | Parametry | Opis |
|-------|-----------|------|
| `trigger_man_down` | `firefighter_id` | Wywołaj alarm man-down |
| `trigger_sos` | `firefighter_id` | Wywołaj alarm SOS |
| `beacon_offline` | `beacon_id` | Symuluj awarię beacona |
| `scba_refill` | `firefighter_id` | Uzupełnij butlę SCBA do 100% |
| `acknowledge_alert` | `alert_id`, `acknowledged_by` | Potwierdź alarm |
| `trigger_environment_hazard` | `firefighter_id`, `hazard_type` | Wywołaj zagrożenie środowiskowe |
| `start_recording` | `name` | Rozpocznij nagrywanie incydentu |
| `stop_recording` | `reason` (opcjonalny) | Zatrzymaj nagrywanie |
| `reset` | - | Resetuj symulację |
| `pause` | - | Zatrzymaj symulację |
| `resume` | - | Wznów symulację |
| `set_speed` | `speed` (0.1-10.0) | Zmień prędkość symulacji |

**Typy zagrożeń środowiskowych (`hazard_type`):**
- `high_co` - wysokie stężenie CO
- `low_oxygen` - niski poziom tlenu
- `explosive_gas` - wykryto gaz wybuchowy (LEL)
- `high_temperature` - wysoka temperatura

```json
// Trigger man-down
{ "action": "trigger_man_down", "params": { "firefighter_id": "FF-003" } }

// Trigger SOS
{ "action": "trigger_sos", "params": { "firefighter_id": "FF-002" } }

// Wyłącz beacon
{ "action": "beacon_offline", "params": { "beacon_id": "BCN-002" } }

// Uzupełnij SCBA
{ "action": "scba_refill", "params": { "firefighter_id": "FF-001" } }

// Potwierdź alert
{ "action": "acknowledge_alert", "params": { "alert_id": "...", "acknowledged_by": "..." } }

// Wywołaj zagrożenie środowiskowe (CO)
{ "action": "trigger_environment_hazard", "params": { "firefighter_id": "FF-001", "hazard_type": "high_co" } }

// Rozpocznij nagrywanie
{ "action": "start_recording", "params": { "name": "Ćwiczenia 2025-01-15" } }

// Zatrzymaj nagrywanie
{ "action": "stop_recording", "params": { "reason": "Zakończenie ćwiczeń" } }

// Reset
{ "action": "reset" }

// Pause
{ "action": "pause" }

// Resume
{ "action": "resume" }

// Set speed (0.1 - 10x)
{ "action": "set_speed", "params": { "speed": 2.0 } }
```

**Odpowiedź:**
```json
{
  "success": true,
  "running": true,
  "speed": 1.0,
  "recording": false,
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

---

## 📼 API Nagrywania i Odtwarzania

### GET /api/v1/recording/status
Aktualny status nagrywania.

```json
{
  "recording": true,
  "session": {
    "incident_id": "INC-2025-001",
    "name": "Ćwiczenia 2025-01-15",
    "started_at": "2025-01-15T14:00:00Z",
    "firefighters_count": 6,
    "telemetry_count": 21600,
    "alerts_count": 3,
    "duration_seconds": 3600
  }
}
```

### GET /api/v1/incidents
Lista nagranych incydentów.

```json
{
  "incidents": [
    {
      "id": "INC-2025-001",
      "name": "Ćwiczenia 2025-01-15",
      "status": "completed",
      "started_at": "2025-01-15T14:00:00Z",
      "ended_at": "2025-01-15T15:00:00Z",
      "duration_seconds": 3600,
      "firefighters_count": 6,
      "telemetry_count": 21600,
      "alerts_count": 3
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### GET /api/v1/incidents/:id
Szczegóły pojedynczego incydentu.

### GET /api/v1/incidents/:id/replay
Odtwarzanie danych z incydentu.

**Parametry:**
- `start_time` - czas początkowy (ISO 8601)
- `end_time` - czas końcowy (ISO 8601)
- `firefighter_ids` - ID strażaków (oddzielone przecinkiem)
- `limit` - max rekordów (default 100)
- `offset` - offset paginacji
- `include_alerts` - czy dołączyć alerty (default true)

### GET /api/v1/incidents/:id/firefighters/:ffId/timeline
Oś czasu dla konkretnego strażaka w incydencie.

### DELETE /api/v1/incidents/:id
Usuń incydent (ostrożnie!).

---

## 💻 Przykłady kodu

### JavaScript - WebSocket
```javascript
// Użyj publicznego serwera lub lokalnego
const ws = new WebSocket('wss://niesmiertelnik.replit.app/ws');
// lub: const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  console.log('Połączono z symulatorem');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'welcome':
      console.log('Wersja symulatora:', data.simulator_version);
      break;
    case 'tag_telemetry':
      console.log(`${data.firefighter.name}: x=${data.position.x.toFixed(1)}, y=${data.position.y.toFixed(1)}, floor=${data.position.floor}`);
      console.log(`  HR: ${data.vitals.heart_rate_bpm} bpm, SCBA: ${data.scba?.remaining_time_min} min`);
      break;
    case 'alert':
      console.warn(`ALERT: ${data.alert_type} - ${data.firefighter.name}`);
      break;
    case 'beacons_status':
      console.log(`Aktywnych beaconów: ${data.beacons.filter(b => b.status === 'active').length}`);
      break;
  }
};

// Wysłanie komendy
ws.send(JSON.stringify({ command: 'trigger_man_down', firefighter_id: 'FF-003' }));
```

### JavaScript - Fetch API
```javascript
const API_URL = 'https://niesmiertelnik.replit.app/api/v1';
// lub: const API_URL = 'http://localhost:5000/api/v1';

// Pobierz listę strażaków
const response = await fetch(`${API_URL}/firefighters`);
const data = await response.json();
console.log(data.firefighters);

// Pobierz historię
const historyResponse = await fetch(`${API_URL}/firefighters/FF-001/history?limit=60`);
const history = await historyResponse.json();

// Sterowanie symulacją
await fetch(`${API_URL}/simulation/control`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'trigger_man_down',
    params: { firefighter_id: 'FF-003' }
  })
});

// Rozpocznij nagrywanie
await fetch(`${API_URL}/simulation/control`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'start_recording',
    params: { name: 'Moje nagranie' }
  })
});
```

### Python - WebSocket
```python
import asyncio
import websockets
import json

WS_URL = 'wss://niesmiertelnik.replit.app/ws'
# lub: WS_URL = 'ws://localhost:5000/ws'

async def connect():
    async with websockets.connect(WS_URL) as ws:
        while True:
            message = await ws.recv()
            data = json.loads(message)

            if data['type'] == 'tag_telemetry':
                ff = data['firefighter']
                pos = data['position']
                vitals = data['vitals']
                print(f"{ff['name']}: ({pos['x']:.1f}, {pos['y']:.1f}) floor={pos['floor']} HR={vitals['heart_rate_bpm']}")

asyncio.run(connect())
```

---

## ⚠️ Uwagi

1. **Symulator jest zintegrowany z aplikacją** - uruchom `npm run dev` w głównym katalogu projektu
2. **Port domyślny to 5000** (nie 8080 jak w starszych wersjach)
3. **Dane są realistyczne** - pozycje, tętno, SCBA, środowisko są symulowane algorytmicznie
4. **Jednostki**: pozycje w metrach, czas w ms/ISO 8601, ciśnienie w Pa/bar
5. **Nagrywanie** wymaga skonfigurowanej bazy PostgreSQL (DATABASE_URL)
6. **WebSocket automatycznie reconnectuje** przy utracie połączenia

---

## Nowe funkcje w v2.7.0

- **Rozszerzona telemetria** - GPS, trilateration, drift, environment sensors, heading, PASS status
- **System SCBA** - pełna symulacja aparatu powietrznego Dräger PSS 7000
- **Czujniki środowiskowe** - CO, CO2, O2, LEL, temperatura, wilgotność
- **Stacja pogodowa** - dane z pojazdu (temperatura, wiatr, ciśnienie, opady)
- **System nagrywania** - zapis i odtwarzanie incydentów do PostgreSQL
- **Rozszerzone beacony** - wykrywanie tagów, prędkość, kierunek, RSSI
- **RECCO** - pełna symulacja systemu z detektorem i reflektorami
- **PASS** - system wykrywania bezruchu z pre-alarmem (20s) i alarmem (30s)
- **Black Box** - rejestracja danych urządzenia
- **Auto-resolve** - alerty automatycznie rozwiązują się po 3 minutach
- **Zagrożenia środowiskowe** - możliwość wywołania alertów CO, O2, LEL, temperatura

---

## 🔗 Powiązane dokumenty

| Dokument | Opis |
|----------|------|
| `README.md` | Przegląd pakietu dokumentacji |
| `01_KARTA_WYZWANIA_v2.md` | Oficjalna karta wyzwania |
| `03_KONCEPCJA_HW_WYTYCZNE.md` | Wytyczne do dokumentacji hardware |
| `04_QUICK_START.md` | Szybki start dla uczestników |
| `05_TECHNOLOGIA_RECCO.md` | System backup lokalizacji RECCO |
| `EKOSYSTEM_URZADZEN_PELNA_SPECYFIKACJA.md` | Szczegółowa specyfikacja urządzeń |

---

*Dokumentacja API Symulatora Nieśmiertelnik PSP v2.7.0*
*HackNation 2025 – Zaprogramuj przyszłość Polski - Grudzień 2025*
