"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

type Obstacle = {
  x: number;
  width: number;
  height: number;
};

const GAME_WIDTH = 600;
const GAME_HEIGHT = 300;
const PLAYER_SIZE = 30;
const PLAYER_Y = GAME_HEIGHT - PLAYER_SIZE - 20;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const OBSTACLE_SPEED = 4;
const OBSTACLE_INTERVAL = 1500;

export default function NeonDash() {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playerY, setPlayerY] = useState(PLAYER_Y);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [isJumping, setIsJumping] = useState(false);

  const playerYRef = useRef(PLAYER_Y);
  const velocityRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const lastObstacleRef = useRef(0);

  const resetGame = useCallback(() => {
    playerYRef.current = PLAYER_Y;
    velocityRef.current = 0;
    obstaclesRef.current = [];
    scoreRef.current = 0;
    gameOverRef.current = false;
    lastObstacleRef.current = 0;
    setPlayerY(PLAYER_Y);
    setObstacles([]);
    setScore(0);
    setGameOver(false);
    setIsJumping(false);
  }, []);

  const jump = useCallback(() => {
    if (gameOverRef.current) return;
    if (playerYRef.current === PLAYER_Y) {
      velocityRef.current = JUMP_FORCE;
      setIsJumping(true);
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [jump]);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      // Physics
      velocityRef.current += GRAVITY;
      playerYRef.current += velocityRef.current;
      if (playerYRef.current >= PLAYER_Y) {
        playerYRef.current = PLAYER_Y;
        velocityRef.current = 0;
        setIsJumping(false);
      }
      setPlayerY(playerYRef.current);

      // Move obstacles
      const now = Date.now();
      if (now - lastObstacleRef.current > OBSTACLE_INTERVAL) {
        const height = 20 + Math.random() * 40;
        obstaclesRef.current.push({
          x: GAME_WIDTH,
          width: 20,
          height,
        });
        lastObstacleRef.current = now;
      }

      obstaclesRef.current = obstaclesRef.current
        .map((obs) => ({ ...obs, x: obs.x - OBSTACLE_SPEED }))
        .filter((obs) => obs.x + obs.width > 0);

      // Collision detection
      const playerRect = {
        x: 20,
        y: playerYRef.current,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
      };
      for (const obs of obstaclesRef.current) {
        const obsRect = {
          x: obs.x,
          y: GAME_HEIGHT - obs.height - 20,
          width: obs.width,
          height: obs.height,
        };
        if (
          playerRect.x < obsRect.x + obsRect.width &&
          playerRect.x + playerRect.width > obsRect.x &&
          playerRect.y < obsRect.y + obsRect.height &&
          playerRect.y + playerRect.height > obsRect.y
        ) {
          gameOverRef.current = true;
          setGameOver(true);
          clearInterval(interval);
          return;
        }
      }

      // Score
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setObstacles([...obstaclesRef.current]);
    }, 20);

    return () => clearInterval(interval);
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-full max-w-[600px] overflow-hidden border-2 border-cyan-400/30 bg-black/50"
        style={{ height: GAME_HEIGHT }}
        onClick={jump}
      >
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400/50" />

        {/* Player */}
        <div
          className="absolute left-5 bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
          style={{
            top: playerY,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
          }}
        />

        {/* Obstacles */}
        {obstacles.map((obs, i) => (
          <div
            key={i}
            className="absolute bg-magenta-400 shadow-[0_0_10px_rgba(255,0,170,0.8)]"
            style={{
              left: obs.x,
              bottom: 20,
              width: obs.width,
              height: obs.height,
            }}
          />
        ))}

        {/* Score */}
        <div className="absolute left-2 top-2 font-mono text-sm text-cyan-300">
          SCORE: {score}
        </div>

        {/* Game Over */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="font-mono text-2xl font-bold text-magenta-400">GAME OVER</p>
            <p className="mt-2 font-mono text-sm text-cyan-300">Score: {score}</p>
            <button
              onClick={resetGame}
              className="btn-neon mt-4"
            >
              <RotateCcw className="h-4 w-4" /> Restart
            </button>
          </div>
        )}
      </div>
      <p className="font-mono text-xs text-cyan-500">
        Press spacebar or tap to jump
      </p>
    </div>
  );
}
