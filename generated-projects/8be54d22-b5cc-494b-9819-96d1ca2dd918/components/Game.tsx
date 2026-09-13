'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { HUD } from './HUD';
import { Minimap } from './Minimap';
import { MissionList } from './MissionList';
import { createCity } from '@/lib/city';
import { createPlayer } from '@/lib/player';
import { createVehicles } from '@/lib/vehicles';
import { createNPCs } from '@/lib/npcs';
import { createPolice } from '@/lib/police';
import { missions } from '@/lib/missions';
import { saveGame, loadGame } from '@/lib/save';

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState({
    health: 100,
    money: 0,
    wanted: 0,
    mission: 0,
    missionProgress: 0,
    time: 12,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMenu, setShowMenu] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // City
    const city = createCity(scene);

    // Player
    const player = createPlayer(scene);

    // Vehicles
    const vehicles = createVehicles(scene);

    // NPCs
    const npcs = createNPCs(scene);

    // Police
    const police = createPolice(scene);

    // Controls
    const controls = new PointerLockControls(camera, renderer.domElement);
    controls.addEventListener('lock', () => setIsPlaying(true));
    controls.addEventListener('unlock', () => setIsPlaying(false));

    // Animation loop
    const clock = new THREE.Clock();
    let time = 12;
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      time += delta * 0.1; // day/night cycle
      if (time > 24) time = 0;
      const sunIntensity = Math.max(0, Math.sin((time - 6) * Math.PI / 12));
      dirLight.intensity = sunIntensity;
      scene.background = new THREE.Color().setHSL(0.6, 0.5, 0.2 + sunIntensity * 0.6);

      // Update player
      player.update(delta, controls);

      // Update vehicles
      vehicles.forEach(v => v.update(delta));

      // Update NPCs
      npcs.forEach(n => n.update(delta));

      // Update police
      police.update(delta, player.position);

      // Update HUD state
      setGameState(prev => ({
        ...prev,
        health: player.health,
        money: player.money,
        wanted: police.wantedLevel,
        time: time,
      }));

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const startGame = () => {
    setShowMenu(false);
    // Load saved game if exists
    const saved = loadGame();
    if (saved) {
      setGameState(saved);
    }
  };

  const saveGameState = () => {
    saveGame(gameState);
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="absolute inset-0" />
      {showMenu && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="bg-white p-8 rounded-lg text-center">
            <h1 className="text-3xl font-bold mb-4">Crime Game Prototype</h1>
            <button
              onClick={startGame}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Start Game
            </button>
            <button
              onClick={saveGameState}
              className="ml-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Save
            </button>
          </div>
        </div>
      )}
      {!showMenu && (
        <>
          <HUD health={gameState.health} money={gameState.money} wanted={gameState.wanted} time={gameState.time} />
          <Minimap />
          <MissionList missions={missions} current={gameState.mission} progress={gameState.missionProgress} />
        </>
      )}
    </div>
  );
}