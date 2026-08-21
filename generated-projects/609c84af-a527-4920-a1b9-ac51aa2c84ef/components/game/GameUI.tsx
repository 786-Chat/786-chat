'use client'

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Pause, Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react'

type GameState = 'menu' | 'playing' | 'paused' | 'gameover'

interface GameUIProps {
  gameState: GameState
  score: number
  bestScore: number
  coins: number
  muted: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onRestart: () => void
  onHome: () => void
  onToggleMute: () => void
}

export function GameUI({
  gameState,
  score,
  bestScore,
  coins,
  muted,
  onStart,
  onPause,
  onResume,
  onRestart,
  onHome,
  onToggleMute,
}: GameUIProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top bar */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 pointer-events-auto">
          <div className="bg-black/50 rounded-lg px-4 py-2 text-white font-arcade text-sm">
            Score: {score}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onToggleMute}
              className="bg-black/50 rounded-lg p-2 text-white hover:bg-black/70 transition"
              aria-label="Toggle mute"
            >
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button
              onClick={gameState === 'playing' ? onPause : onResume}
              className="bg-black/50 rounded-lg p-2 text-white hover:bg-black/70 transition"
              aria-label="Pause or resume"
            >
              {gameState === 'playing' ? <Pause size={20} /> : <Play size={20} />}
            </button>
          </div>
        </div>
      )}

      {/* Coin counter during play */}
      {gameState === 'playing' && (
        <div className="absolute top-16 left-4 bg-black/50 rounded-lg px-4 py-2 text-yellow-300 font-arcade text-sm pointer-events-auto">
          🪙 {coins}
        </div>
      )}

      {/* Start screen */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-auto">
          <h1 className="text-5xl md:text-7xl font-arcade text-yellow-300 drop-shadow-[0_4px_0_rgba(0,0,0,0.8)] mb-4 animate-float">
            SKY HOPPER
          </h1>
          <p className="text-white font-arcade text-sm mb-8">Tap or press Space to fly!</p>
          <button
            onClick={onStart}
            className="bg-green-500 hover:bg-green-600 text-white font-arcade text-xl px-8 py-4 rounded-full shadow-lg transition transform hover:scale-105"
          >
            ▶ PLAY
          </button>
          <div className="mt-6 text-white font-arcade text-sm">Best: {bestScore}</div>
          <button
            onClick={onToggleMute}
            className="mt-4 bg-black/50 rounded-lg p-2 text-white hover:bg-black/70 transition"
            aria-label="Toggle mute"
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      )}

      {/* Pause overlay */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-auto">
          <h2 className="text-4xl font-arcade text-white mb-8">PAUSED</h2>
          <button
            onClick={onResume}
            className="bg-blue-500 hover:bg-blue-600 text-white font-arcade text-xl px-8 py-4 rounded-full shadow-lg transition transform hover:scale-105"
          >
            ▶ RESUME
          </button>
          <button
            onClick={onHome}
            className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-arcade text-lg px-6 py-3 rounded-full shadow-lg transition"
          >
            🏠 HOME
          </button>
        </div>
      )}

      {/* Game over overlay */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-auto">
          <h2 className="text-4xl font-arcade text-red-400 mb-4">GAME OVER</h2>
          {score >= bestScore && score > 0 && (
            <div className="text-yellow-300 font-arcade text-xl mb-2 animate-pulse">NEW HIGH SCORE!</div>
          )}
          <div className="bg-black/50 rounded-lg p-4 text-white font-arcade text-sm mb-6">
            <div>Score: {score}</div>
            <div>Best: {bestScore}</div>
            <div>Coins: {coins}</div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onRestart}
              className="bg-green-500 hover:bg-green-600 text-white font-arcade text-xl px-8 py-4 rounded-full shadow-lg transition transform hover:scale-105"
            >
              🔄 PLAY AGAIN
            </button>
            <button
              onClick={onHome}
              className="bg-gray-600 hover:bg-gray-700 text-white font-arcade text-xl px-8 py-4 rounded-full shadow-lg transition"
            >
              🏠 HOME
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
