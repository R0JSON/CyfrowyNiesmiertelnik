# Dokumentacja Projektowa: Cyfrowy Nieśmiertelnik PSP v2.7
## Zespół: Lorem ipsum

Niniejsza dokumentacja opisuje kompletną koncepcję systemu "Cyfrowy Nieśmiertelnik PSP", obejmującą warstwę sprzętową, algorytmiczną oraz integracyjną. System składa się z osobistego tagu noszonego przez strażaka, infrastruktury beaconów UWB oraz oprogramowania wspierającego dowodzenie.

---

## Jak uruchomić symulację (Docker Compose)

Aby uruchomić pełną symulację systemu wraz z interfejsem graficznym (frontendem), wykonaj następujące kroki w terminalu:

1.  Przejdź do katalogu projektu `recreated_frontend`:
    ```bash
    cd recreated_frontend
    ```
2.  Zbuduj i uruchom kontenery Docker w tle:
    ```bash
    docker-compose up --build -d
    ```
    *(`--build` wymusi przebudowanie obrazów, `--d` uruchomi kontenery w trybie detached).*

3.  Po uruchomieniu, otwórz przeglądarkę i przejdź pod adres:
    **[http://localhost:3000](http://localhost:3000)**

4.  Aby zatrzymać symulację i usunąć kontenery:
    ```bash
    docker-compose down
    ```

---

## 1. Tag Nieśmiertelnika (Wearable) - Hardware

### 1.1. Opis ogólny
Tag to kompaktowe urządzenie noszone przez strażaka, integrujące wiele technologii lokalizacyjnych (UWB, GNSS, IMU, Barometr) oraz czujniki parametrów życiowych. Urządzenie komunikuje się z systemem dowodzenia (NIB) poprzez sieć LoRaWAN (daleki zasięg, brak opłat) oraz LTE-M (backup, wysoka przepustowość). Wbudowany system RECCO zapewnia pasywną lokalizację w przypadku całkowitej awarii elektroniki.

### 1.2. Schemat blokowy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TAG NIEŚMIERTELNIK v2.7                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │   UWB    │  │   GNSS   │  │   IMU    │  │  BARO    │                     │
│  │ DWM3000  │  │  LC86L   │  │ BMI270   │  │ BMP390   │                     │
│  │ SPI+IRQ  │  │  UART    │  │ SPI+IRQ  │  │   I2C    │                     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘                     │
│       │             │             │             │                           │
│       └─────────────┴──────┬──────┴─────────────┘                           │
│                            │                                                │
│                   ┌────────┴────────┐                                       │
│                   │                 │                                       │
│                   │  MCU nRF52840   │◄────── BLE ◄──── HR Band              │
│                   │                 │                                       │
│                   │ ARM Cortex-M4F  │                                       │
│                   │ BLE 5.0 + Mesh  │                                       │
│                   │ Crypto Engine   │                                       │
│                   │                 │                                       │
│                   └────────┬────────┘                                       │
│                            │                                                │
│       ┌────────────────────┼────────────────────┐                           │
│       │                    │                    │                           │
│  ┌────┴─────┐        ┌─────┴─────┐        ┌─────┴─────┐                     │
│  │ LoRaWAN  │        │  LTE-M    │        │   Flash   │                     │
│  │  SX1262  │        │SARA-R412M │        │ W25Q128   │                     │
│  │   SPI    │        │   UART    │        │   SPI     │                     │
│  └──────────┘        └───────────┘        └───────────┘                     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         ZASILANIE + UI                                │  │
│  │  Li-Po 1500mAh → PMIC BQ25895 → 3.3V/1.8V LDO                         │  │
│  │                   ↑                                                   │  │
│  │              USB-C (5V/1A)    LED RGB + Buzzer 85dB + SOS Button      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────┐                                                            │
│  │   RECCO     │  Reflektor pasywny (backup lokalizacji)                    │
│  │  Passive    │                                                            │
│  └─────────────┘                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3. Lista materiałowa (BOM)

| # | Komponent | Model/Part Number | Producent | Ilość | Cena jedn. | Suma | Źródło | Uzasadnienie |
|---|-----------|-------------------|-----------|-------|------------|------|--------|--------------|
| 1 | MCU | nRF52840-QIAA | Nordic Semi | 1 | $7.50 | $7.50 | DigiKey | Sprawdzony układ SoC z BLE 5.0, niskim poborem prądu i wbudowanym koprocesorem kryptograficznym. |
| 2 | Moduł UWB | DWM3000 | Qorvo | 1 | $18.00 | $18.00 | Mouser | IEEE 802.15.4z, precyzyjna lokalizacja (<10cm), niskie zużycie energii. |
| 3 | GNSS | LC86L | Quectel | 1 | $12.00 | $12.00 | LCSC | Multi-constellation, niski pobór prądu. |
| 4 | IMU | BMI270 | Bosch Sensortec | 1 | $4.50 | $4.50 | DigiKey | Zoptymalizowany pod kątem urządzeń wearable, niski pobór prądu. |
| 5 | Barometr | BMP390 | Bosch Sensortec | 1 | $2.50 | $2.50 | DigiKey | Wysoka precyzja (±0.5m) kluczowa dla identyfikacji piętra. |
| 6 | LoRa | SX1262 | Semtech | 1 | $6.00 | $6.00 | Mouser | Standard branżowy, zasięg, moc +22dBm. |
| 7 | LTE-M | SARA-R412M | u-blox | 1 | $22.00 | $22.00 | DigiKey | Backup komunikacyjny, obsługa PSM. |
| 8 | Pamięć Flash | W25Q128JV | Winbond | 1 | $2.00 | $2.00 | LCSC | 16MB na logi czarnej skrzynki i OTA. |
| 9 | Reflektor RECCO | RECCO Reflector | RECCO | 1 | $5.00 | $5.00 | RECCO | Pasywny system bezpieczeństwa. |
| 10 | Bateria | Li-Po 1500mAh | Generic | 1 | $8.00 | $8.00 | Alibaba | High-temp rated. |
| 11 | PMIC | BQ25895 | Texas Instruments | 1 | $3.50 | $3.50 | DigiKey | Ładowanie USB-C, fuel gauge. |
| 12 | Obudowa | Custom IP67 | - | 1 | $8.00 | $8.00 | - | ABS/PC, wytrzymałość mechaniczna i termiczna. |
| 13 | Elementy pasywne | R, C, L, złącza | Various | 1 | $5.00 | $5.00 | LCSC | Niezbędna drobnica. |
| 14 | PCB | 4-layer FR4 | - | 1 | $3.00 | $3.00 | JLCPCB | Płytka 4-warstwowa. |
| **SUMA** | | | | | | **$105.50** | | (~422 PLN) |

### 1.4. Analiza energetyczna i Czas Pracy

**Czas pracy (Indoor Active):** ~72 godziny (przy średnim poborze ~21 mA z marginesem bezpieczeństwa).

---

## 2. Beacon UWB (Kotwica) - Hardware

Beacon UWB to stacjonarne urządzenie (kotwica), zasilane bateryjnie (Li-Po 6000mAh), zapewniające >7 dni pracy ciągłej. Oparte na MCU nRF52833 i module UWB DWM3000.

---

## M11. Minimalna koncepcja działania bez GPS/GSM (Tunele, Podziemia)

W środowiskach pozbawionych sygnału GPS i zasięgu sieci komórkowej (GSM/LTE), system przechodzi w tryb autonomicznej lokalizacji lokalnej.

### Koncepcja działania:
1.  **Infrastruktura LoRaWAN:** Beacony UWB rozstawiane przez strażaków wchodzących do strefy (np. co 30-50 metrów) działają jako urządzenia końcowe (end-devices) w sieci LoRaWAN. Komunikują się one z przenośnymi bramkami LoRaWAN (tzw. "micro-gateways" lub bramkami NIB) tworzącymi lokalną sieć gwiazdy.
2.  **Lokalizacja Względna (Dead Reckoning + IMU/UWB):**
    *   **IMU (Inertial Measurement Unit):** Akcelerometr i żyroskop w tagu zliczają kroki i kierunek ruchu (PDR - Pedestrian Dead Reckoning). Pozwala to na śledzenie pozycji względem ostatniego znanego punktu.
    *   **Korekta UWB:** Gdy tag znajdzie się w zasięgu beacona, dryf IMU jest zerowany, a pozycja korygowana. W tunelu wystarczą 2 beacony, aby określić dystans od wejścia (1D localization).
3.  **Retransmisja danych (przez LoRaWAN):** Dane o pozycji i statusie są przesyłane z taga do najbliższego beacona UWB (który działa jako lokalny punkt dostępowy UWB dla taga), a następnie beacon wysyła te dane do bramki LoRaWAN. Bramka NIB (Network in a Box) zbiera te dane i udostępnia je dalej.

### Scenariusz użycia w tunelu:
1.  Dowódca ustawia Bramkę NIB (z funkcją bramki LoRaWAN) przed wjazdem do tunelu.
2.  Rota wchodzi do tunelu, montując beacony UWB (które są urządzeniami LoRaWAN) na ścianach co określony dystans.
3.  Każdy beacon UWB działa jako punkt odniesienia dla lokalizacji UWB oraz jako węzeł komunikacyjny LoRaWAN.
4.  Tag strażaka oblicza pozycję na podstawie IMU, korygując ją przy każdym mijanym beaconie UWB (metoda *ranging*).
5.  Tag strażaka komunikuje się z najbliższym beaconem UWB (np. poprzez BLE lub bezpośrednie UWB), a ten przesyła dane o pozycji strażaka do bramki NIB przez sieć LoRaWAN.
6.  Informacja "Strażak X jest 350m od wejścia" trafia do dowódcy.

---

## D1. Algorytm fuzji danych (EKF/UKF) dla lokalizacji

Aby zapewnić precyzyjną i płynną lokalizację, surowe dane z sensorów muszą zostać połączone. Zastosowano **Rozszerzony Filtr Kalmana (Extended Kalman Filter - EKF)**.

### Struktura Filtru EKF:

1.  **Model Stanu (State Vector):**
    *   `x, y, z` (Pozycja)
    *   `vx, vy, vz` (Prędkość)
    *   `q0, q1, q2, q3` (Orientacja - kwaterniony)
    *   `ba, bg` (Bias akcelerometru i żyroskopu)

2.  **Etap Predykcji (IMU):**
    *   Wysoka częstotliwość (np. 100Hz).
    *   Całkowanie danych z akcelerometru i żyroskopu w celu estymacji nowej pozycji i orientacji.
    *   Zwiększanie macierzy kowariancji błędu (niepewność rośnie z czasem - dryf).

3.  **Etap Korekcji (UWB/Baro/GNSS):**
    *   Niższa częstotliwość (np. 1-10Hz).
    *   **UWB:** Gdy dostępny jest pomiar dystansu do beacona, EKF porównuje przewidywany dystans z mierzonym i koryguje pozycję.
    *   **Barometr:** Pomiar ciśnienia koryguje współrzędną `z` (wysokość/piętro).
    *   **GNSS:** Jeśli dostępny (na zewnątrz), koryguje pozycję absolutną `x, y`.

### Zalety podejścia EKF:
*   **Ciągłość:** IMU zapewnia płynność ruchu między pomiarami UWB.
*   **Odporność:** Błędne pomiary UWB (np. odbicia wielodrogowe) są odrzucane, jeśli zbytnio odbiegają od predykcji (tzw. *gating*).
*   **Dokładność:** Łączenie wielu źródeł (sensor fusion) daje wynik lepszy niż każdy sensor z osobna.

---

## D8. Koncepcja integracji z systemami PSP (SWD-ST)

System Cyfrowy Nieśmiertelnik nie działa w próżni. Musi integrować się z Systemem Wspomagania Decyzji Państwowej Straży Pożarnej (SWD-ST).

### Architektura integracji:

1.  **Bramka NIB jako Integrator:**
    *   Bramka NIB w pojeździe dowodzenia zbiera dane lokalne (LoRaWAN/UWB).
    *   Posiada moduł LTE/5G do łączności z siecią WAN PSP.
    *   Udostępnia lokalne API REST/WebSocket.

2.  **Protokół wymiany danych (CAP - Common Alerting Protocol / JSON):**
    *   Dane są agregowane i wysyłane do serwera integracyjnego SWD-ST w formacie JSON lub XML (zgodnym ze standardami wymiany danych ratunkowych).

3.  **Przekazywane dane:**
    *   **Statusy:** Tętno, Alarmy Man-Down, Ciśnienie butli (tylko wartości krytyczne lub na żądanie, by nie zapchać łącza).
    *   **Lokalizacja:** Współrzędne GPS (na zewnątrz) lub względne (wewnątrz, zrzutowane na plan obiektu, jeśli SWD posiada plan).
    *   **Zdarzenia:** "Wejście do strefy zagrożenia", "Ewakuacja".

4.  **Wizualizacja w SK (Stanowisko Kierowania):**
    *   Na mapie cyfrowej w SWD pojawia się ikona roty/strażaka.
    *   Kliknięcie otwiera kartę ze szczegółami (powietrze, tętno).
    *   Alerty (Man-Down) wywołują priorytetowe powiadomienie na konsoli dyspozytora.

---

## B7. Koncepcja mobilnej aplikacji dla dowódcy

**Urządzenie:** Tablet wzmocniony (Rugged) 8-10 cali, Android/iOS.

### Główne Ekrany:

1.  **Pulpit Taktyczny (Dashboard):**
    *   **Lista Ratowników:** Kafelki z nazwiskiem, statusem (OK/Alarm), ciśnieniem w butli (pasek postępu) i tętnem.
    *   **Szybkie akcje:** Przycisk "EWAKUACJA WSZYSTKICH" (wymaga potwierdzenia), "ROLL CALL" (sprawdzenie obecności).

2.  **Mapa Taktyczna (Widok 2D/3D):**
    *   Rzut budynku (jeśli dostępny plan) lub siatka relatywna.
    *   Pozycje strażaków w czasie rzeczywistym.
    *   Możliwość rysowania stref (np. "Strefa Niebezpieczna") - wejście strażaka w strefę generuje wibrację na jego tagu.

3.  **Szczegóły Ratownika:**
    *   Wykres tętna w czasie.
    *   Historia przemieszczania (ścieżka).
    *   Możliwość wywołania tagu (sygnał dźwiękowy/świetlny).

### Wymagania Offline:
*   Aplikacja łączy się bezpośrednio z Bramką NIB przez Wi-Fi (lokalny hotspot).
*   Mapy (OpenStreetMap/Plany obiektów) są cache'owane offline.
*   Brak zależności od chmury/internetu – system działa w pełni autonomicznie w strefie akcji.

---

## B8. Propozycja rozszerzenia o inne służby (GOPR, TOPR, Ratownictwo Górnicze)

System jest modułowy, co pozwala na adaptację do innych specyfik:

1.  **GOPR / TOPR (Ratownictwo Górskie):**
    *   **Różnice:** Otwarte przestrzenie, ogromne dystanse, rzeźba terenu utrudniająca łączność.
    *   **Adaptacja:**
        *   Wymiana modułu radiowego na LoRaWAN o zwiększonej mocy lub wykorzystanie sieci Mesh na paśmie VHF.
        *   Integracja z mapami topograficznymi zamiast planów budynków.
        *   Priorytet dla GNSS i wysokościomierza barometrycznego.
        *   Dłuższy czas pracy baterii (akcje trwają dni, nie godziny) -> tryb "Deep Sleep" z rzadszym wysyłaniem pozycji.

2.  **Ratownictwo Górnicze:**
    *   **Różnice:** Środowisko wybuchowe (metan), setki metrów skał (brak GPS, słabe radio), rozległe chodniki.
    *   **Adaptacja:**
        *   **Certyfikacja ATEX (Iskrobezpieczeństwo) - KLUCZOWE.** Obudowa i elektronika muszą spełniać rygorystyczne normy.
        *   Infrastruktura szkieletowa: Wykorzystanie istniejącej w kopalniach sieci teletechnicznej (leaky feeder) lub gęstsza sieć beaconów Mesh relay.
        *   Algorytm lokalizacji 1D (wzdłuż chodnika) zamiast 3D.

3.  **WOPR (Ratownictwo Wodne):**
    *   **Adaptacja:** Wodoodporność IP68, detekcja zanurzenia, łączność na powierzchni wody.

---

**Autorzy Dokumentacji:** [Twój Zespół]
**Data:** Grudzień 2025# CyfrowyNiesmiertelnik
# CyfrowyNiesmiertelnik
