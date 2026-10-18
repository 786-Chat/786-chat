'use client'

import { useEffect, useRef, useState } from 'react'
import { GameEngine } from './engine'
import { GameUI } from './GameUI'

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [coins, setCoins] = useState(0)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new GameEngine(canvas)
    engineRef.current = engine

    engine.onStateChange = (state) => {
      setGameState(state)
    }
    engine.onScoreChange = (score) => setScore(score)
    engine.onCoinsChange = (coins) => setCoins(coins)
    engine.onBestScoreChange = (best) => setBestScore(best)
    engine.onMuteChange = (muted) => setMuted(muted)

    engine.init()

    return () => {
      engine.destroy()
    }
  }, [])

  const handleStart = () => {
    engineRef.current?.startGame()
  }

  const handlePause = () => {
    engineRef.current?.togglePause()
  }

  const handleResume = () => {
    engineRef.current?.togglePause()
  }

  const handleRestart = () => {
    engineRef.current?.startGame()
  }

  const handleHome = () => {
    engineRef.current?.goToMenu()
  }

  const handleToggleMute = () => {
    engineRef.current?.toggleMute()
  }

  return (
    <div className="relative w-full max-w-4xl aspect-[16/9] overflow-hidden rounded-2xl shadow-2xl">
      <canvas ref={canvasRef} className="w-full h-full" />
      <GameUI
        gameState={gameState}
        score={score}
        bestScore={bestScore}
        coins={coins}
        muted={muted}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onRestart={handleRestart}
        onHome={handleHome}
        onToggleMute={handleToggleMute}
      />
    </div>
  )
}
