import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { Building, Telemetry, Beacon } from '../types';
import * as THREE from 'three';

interface Props {
  building: Building | null;
  firefighters: Telemetry[];
  beacons: Beacon[];
}

const Floor = ({ floor, width, depth, index }: { floor: any; width: number; depth: number; index: number }) => {
  // Użyj neutralnych kolorów dla architektury
  const floorColor = '#2d333b';
  const lineColor = '#444c56';

  // "Rozsunięcie" pięter w pionie (exploded view)
  const yPos = index * 4; // Każde piętro co 4 jednostki w górę

  return (
    <group position={[0, yPos, 0]}>
      {/* Grupa jest ustawiona w [0,0], czyli w rogu budynku.
          Geometrie muszą być przesunięte o połowę swoich wymiarów, aby "zaczynały się" od 0,0. 
      */}
      
      {/* Podłoga (Półprzezroczysta płyta) */}
      <mesh position={[width / 2, 0, depth / 2]}>
        <boxGeometry args={[width, 0.2, depth]} />
        <meshStandardMaterial color={floorColor} opacity={0.8} transparent />
      </mesh>

      {/* Obrys (Wireframe) */}
      <lineSegments position={[width / 2, 0, depth / 2]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, 0.2, depth)]} />
        <lineBasicMaterial color={lineColor} linewidth={1} />
      </lineSegments>
      
      {/* Etykieta piętra */}
      <Text
        position={[-2, 0, depth / 2]}
        color="white"
        fontSize={1}
        anchorX="right"
        anchorY="middle"
      >
        {floor.name}
      </Text>
    </group>
  );
};

const Firefighter3D = ({ ff, floorIndex }: { ff: Telemetry; floorIndex: number }) => {
  const yPos = floorIndex * 4 + 0.5; // Pozycja Y zgodna z piętrem + trochę nad ziemią
  
  // Konwersja pozycji 2D (X, Y) na 3D (X, Z). Uwaga: w Three.js Y to góra.
  // W API: X to szerokość, Y to głębokość.
  // W Three: X to szerokość, Z to głębokość.
  const x = ff.position.x;
  const z = ff.position.y;

  const color = ff.vitals.motion_state === 'stationary' ? '#d29922' : 
                ff.vitals.motion_state === 'fallen' ? '#f85149' : '#3fb950';

  return (
    <group position={[x, yPos, z]}>
      <mesh>
        <capsuleGeometry args={[0.3, 0.8, 4, 8]} /> {/* Kształt ludzika */}
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Etykieta HTML nad strażakiem */}
      <Html position={[0, 1, 0]} center distanceFactor={15}>
        <div className="bg-black/80 text-white text-[10px] px-1 rounded whitespace-nowrap border border-white/20">
          {ff.firefighter.name}
        </div>
      </Html>
    </group>
  );
};

export const Building3D = ({ building, firefighters }: Props) => {
  if (!building) return <div className="flex items-center justify-center h-full text-muted-foreground">Brak danych budynku</div>;

  const { width_m, depth_m } = building.dimensions;
  // Centrujemy kamerę na środku budynku
  const centerX = width_m / 2;
  const centerZ = depth_m / 2;

  // Mapowanie numeru piętra na index (dla pozycji Y)
  // Zakładamy, że floors są posortowane, ale dla pewności znajdźmy index
  const getFloorIndex = (floorNum: number) => {
    const idx = building.floors.findIndex(f => f.number === floorNum);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="w-full h-full bg-[#050505]">
      <Canvas camera={{ position: [-20, 20, 40], fov: 50 }}>
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <OrbitControls target={[centerX, 5, centerZ]} />

        <group>
          {/* Generowanie pięter */}
          {building.floors.map((floor, index) => (
            <Floor 
              key={floor.number} 
              floor={floor} 
              width={width_m} 
              depth={depth_m} 
              index={index} 
            />
          ))}

          {/* Strażacy */}
          {firefighters.map(ff => (
            <Firefighter3D 
              key={ff.tag_id} 
              ff={ff} 
              floorIndex={getFloorIndex(ff.position.floor)} 
            />
          ))}
        </group>

        <gridHelper args={[100, 100, 0x30363d, 0x161b22]} position={[centerX, -2, centerZ]} />
      </Canvas>
      
      <div className="absolute bottom-4 left-4 bg-black/50 p-2 rounded text-xs text-white border border-white/10">
        <div className="font-bold mb-1">Legenda 3D</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#f85149] rounded-full border border-white/50"></span> Upadek / Alarm</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#d29922] rounded-full border border-white/50"></span> Bezruch</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#3fb950] rounded-full border border-white/50"></span> W ruchu</div>
      </div>
    </div>
  );
};
