// Game engine class - handles all game logic, rendering, and input

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover'

interface Obstacle {
  x: number
  gapY: number
  gapHeight: number
  width: number
  type: 'tower' | 'pillar' | 'platform' | 'moving'
  speed: number
  passed: boolean
  color: string
}

interface Coin {
  x: number
  y: number
  radius: number
  collected: boolean
  rotation: number
}

interface PowerUp {
  x: number
  y: number
  type: 'shield' | 'superjump' | 'magnet' | 'slowmo'
  active: boolean
  duration: number
}

interface Enemy {
  x: number
  y: number
  width: number
  height: number
  type: 'flyer' | 'walker' | 'turtle' | 'robot' | 'bouncer'
  vx: number
  vy: number
  alive: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

interface Cloud {
  x: number
  y: number
  width: number
  height: number
  speed: number
}

interface Mountain {
  x: number
  y: number
  width: number
  height: number
  color: string
}

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number = 0
  private height: number = 0
  private dpr: number = 1

  private state: GameState = 'menu'
  private score = 0
  private bestScore = 0
  private coins = 0
  private muted = false

  private player = {
    x: 0,
    y: 0,
    vy: 0,
    width: 40,
    height: 40,
    rotation: 0,
    flapTimer: 0,
  }

  private gravity = 0.5
  private flapStrength = -8
  private baseSpeed = 3
  private speed = this.baseSpeed
  private obstacles: Obstacle[] = []
  private coinsList: Coin[] = []
  private powerUps: PowerUp[] = []
  private enemies: Enemy[] = []
  private particles: Particle[] = []
  private clouds: Cloud[] = []
  private mountains: Mountain[] = []

  private frame = 0
  private lastTime = 0
  private animationId: number | null = null
  private spawnTimer = 0
  private coinTimer = 0
  private powerUpTimer = 0
  private enemyTimer = 0
  private screenShake = 0
  private milestoneShown = 0

  private audioCtx: AudioContext | null = null
  private soundEnabled = true

  // Callbacks
  onStateChange: (state: GameState) => void = () => {}
  onScoreChange: (score: number) => void = () => {}
  onCoinsChange: (coins: number) => void = () => {}
  onBestScoreChange: (best: number) => void = () => {}
  onMuteChange: (muted: boolean) => void = () => {}

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.resize()
    window.addEventListener('resize', this.resize)
    window.addEventListener('keydown', this.handleKeyDown)
    canvas.addEventListener('mousedown', this.handlePointerDown)
    canvas.addEventListener('touchstart', this.handleTouchStart)
  }

  init() {
    this.loadBestScore()
    this.resetGame()
    this.generateBackground()
    this.setState('menu')
    this.lastTime = performance.now()
    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('keydown', this.handleKeyDown)
    this.canvas.removeEventListener('mousedown', this.handlePointerDown)
    this.canvas.removeEventListener('touchstart', this.handleTouchStart)
  }

  startGame() {
    this.resetGame()
    this.setState('playing')
  }

  togglePause() {
    if (this.state === 'playing') {
      this.setState('paused')
    } else if (this.state === 'paused') {
      this.setState('playing')
    }
  }

  goToMenu() {
    this.setState('menu')
  }

  toggleMute() {
    this.muted = !this.muted
    this.soundEnabled = !this.muted
    this.onMuteChange(this.muted)
  }

  private setState(state: GameState) {
    this.state = state
    this.onStateChange(state)
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    this.dpr = window.devicePixelRatio || 1
    this.width = rect.width
    this.height = rect.height
    this.canvas.width = this.width * this.dpr
    this.canvas.height = this.height * this.dpr
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault()
      if (this.state === 'playing') {
        this.flap()
      } else if (this.state === 'menu' || this.state === 'gameover') {
        this.startGame()
      }
    }
  }

  private handlePointerDown = (e: MouseEvent) => {
    if (this.state === 'playing') {
      this.flap()
    }
  }

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    if (this.state === 'playing') {
      this.flap()
    }
  }

  private flap() {
    this.player.vy = this.flapStrength
    this.player.flapTimer = 10
    this.playSound('flap')
  }

  private resetGame() {
    this.score = 0
    this.coins = 0
    this.speed = this.baseSpeed
    this.obstacles = []
    this.coinsList = []
    this.powerUps = []
    this.enemies = []
    this.particles = []
    this.spawnTimer = 0
    this.coinTimer = 0
    this.powerUpTimer = 0
    this.enemyTimer = 0
    this.screenShake = 0
    this.milestoneShown = 0
    this.player.x = this.width * 0.3
    this.player.y = this.height * 0.5
    this.player.vy = 0
    this.player.rotation = 0
    this.onScoreChange(0)
    this.onCoinsChange(0)
  }

  private generateBackground() {
    this.clouds = []
    this.mountains = []
    for (let i = 0; i < 10; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.5,
        width: 60 + Math.random() * 80,
        height: 20 + Math.random() * 20,
        speed: 0.2 + Math.random() * 0.5,
      })
    }
    for (let i = 0; i < 5; i++) {
      this.mountains.push({
        x: Math.random() * this.width,
        y: this.height * 0.7,
        width: 100 + Math.random() * 150,
        height: 50 + Math.random() * 80,
        color: `hsl(${120 + Math.random() * 40}, 50%, ${30 + Math.random() * 20}%)`,
      })
    }
  }

  private gameLoop = (time: number) => {
    const dt = Math.min((time - this.lastTime) / 16.667, 3)
    this.lastTime = time
    this.frame++

    if (this.state === 'playing') {
      this.update(dt)
    }

    this.render()

    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  private update(dt: number) {
    // Player physics
    this.player.vy += this.gravity * dt
    this.player.y += this.player.vy * dt

    // Ceiling and floor collision
    if (this.player.y < 0) {
      this.player.y = 0
      this.player.vy = 0
    }
    if (this.player.y + this.player.height > this.height) {
      this.gameOver()
      return
    }

    // Player rotation based on velocity
    this.player.rotation = Math.max(-0.5, Math.min(0.5, this.player.vy * 0.05))

    // Flap animation
    if (this.player.flapTimer > 0) this.player.flapTimer--

    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i]
      obs.x -= this.speed * dt
      if (obs.type === 'moving') {
        obs.gapY += Math.sin(this.frame * 0.05) * 0.5 * dt
      }
      if (obs.x + obs.width < 0) {
        this.obstacles.splice(i, 1)
        continue
      }

      // Check if passed
      if (!obs.passed && obs.x + obs.width < this.player.x) {
        obs.passed = true
        this.score += 10
        this.onScoreChange(this.score)
        this.checkMilestones()
        this.playSound('pass')
      }

      // Collision with player
      if (this.checkObstacleCollision(obs)) {
        this.gameOver()
        return
      }
    }

    // Move coins
    for (let i = this.coinsList.length - 1; i >= 0; i--) {
      const coin = this.coinsList[i]
      coin.x -= this.speed * dt
      coin.rotation += 0.1 * dt
      if (coin.x < -20) {
        this.coinsList.splice(i, 1)
        continue
      }

      // Check collection
      if (!coin.collected && this.distance(this.player.x + this.player.width/2, this.player.y + this.player.height/2, coin.x, coin.y) < coin.radius + 20) {
        coin.collected = true
        this.coins++
        this.onCoinsChange(this.coins)
        this.playSound('coin')
        this.spawnParticles(coin.x, coin.y, '#FFD700', 5)
      }
    }

    // Move power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i]
      pu.x -= this.speed * dt
      if (pu.x < -30) {
        this.powerUps.splice(i, 1)
        continue
      }

      // Check collection
      if (this.distance(this.player.x + this.player.width/2, this.player.y + this.player.height/2, pu.x, pu.y) < 30) {
        this.applyPowerUp(pu.type)
        this.powerUps.splice(i, 1)
        this.playSound('powerup')
      }
    }

    // Move enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]
      enemy.x -= this.speed * dt
      enemy.x += enemy.vx * dt
      enemy.y += enemy.vy * dt

      // Simple bounce for walkers
      if (enemy.type === 'walker' || enemy.type === 'bouncer') {
        if (enemy.y < this.height * 0.6) enemy.vy = 1
        if (enemy.y > this.height * 0.8) enemy.vy = -1
      }

      if (enemy.x < -50) {
        this.enemies.splice(i, 1)
        continue
      }

      // Collision with player
      if (this.checkEnemyCollision(enemy)) {
        this.gameOver()
        return
      }
    }

    // Spawn obstacles
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawnObstacle()
      this.spawnTimer = Math.max(60, 120 - this.score * 0.5) / 60
    }

    // Spawn coins
    this.coinTimer -= dt
    if (this.coinTimer <= 0) {
      this.spawnCoins()
      this.coinTimer = 2 + Math.random() * 2
    }

    // Spawn power-ups
    this.powerUpTimer -= dt
    if (this.powerUpTimer <= 0) {
      this.spawnPowerUp()
      this.powerUpTimer = 10 + Math.random() * 10
    }

    // Spawn enemies
    this.enemyTimer -= dt
    if (this.enemyTimer <= 0) {
      this.spawnEnemy()
      this.enemyTimer = 5 + Math.random() * 5
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
      if (p.life <= 0) this.particles.splice(i, 1)
    }

    // Update clouds
    for (const cloud of this.clouds) {
      cloud.x -= cloud.speed * dt
      if (cloud.x + cloud.width < 0) {
        cloud.x = this.width + Math.random() * 100
        cloud.y = Math.random() * this.height * 0.5
      }
    }

    // Update mountains (parallax)
    for (const m of this.mountains) {
      m.x -= this.speed * 0.2 * dt
      if (m.x + m.width < 0) {
        m.x = this.width + Math.random() * 200
        m.y = this.height * 0.7
      }
    }

    // Screen shake decay
    if (this.screenShake > 0) this.screenShake -= dt

    // Difficulty progression
    this.speed = this.baseSpeed + this.score * 0.01
  }

  private spawnObstacle() {
    const gapHeight = Math.max(120, 200 - this.score * 0.5)
    const gapY = 50 + Math.random() * (this.height - gapHeight - 100)
    const type = Math.random() < 0.3 ? 'moving' : (Math.random() < 0.5 ? 'tower' : 'pillar')
    const width = type === 'tower' ? 50 : 40
    const color = type === 'tower' ? '#2d5a27' : '#8B4513'
    this.obstacles.push({
      x: this.width + 50,
      gapY,
      gapHeight,
      width,
      type,
      speed: this.speed,
      passed: false,
      color,
    })
  }

  private spawnCoins() {
    const count = 3 + Math.floor(Math.random() * 3)
    const startX = this.width + 50
    const baseY = 100 + Math.random() * (this.height - 200)
    for (let i = 0; i < count; i++) {
      this.coinsList.push({
        x: startX + i * 30,
        y: baseY + Math.sin(i * 0.5) * 30,
        radius: 12,
        collected: false,
        rotation: 0,
      })
    }
  }

  private spawnPowerUp() {
    const types: PowerUp['type'][] = ['shield', 'superjump', 'magnet', 'slowmo']
    const type = types[Math.floor(Math.random() * types.length)]
    this.powerUps.push({
      x: this.width + 50,
      y: 50 + Math.random() * (this.height - 100),
      type,
      active: false,
      duration: 5,
    })
  }

  private spawnEnemy() {
    const types: Enemy['type'][] = ['flyer', 'walker', 'turtle', 'robot', 'bouncer']
    const type = types[Math.floor(Math.random() * types.length)]
    const size = 30 + Math.random() * 10
    this.enemies.push({
      x: this.width + 50,
      y: 50 + Math.random() * (this.height - 100),
      width: size,
      height: size,
      type,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      alive: true,
    })
  }

  private applyPowerUp(type: PowerUp['type']) {
    switch (type) {
      case 'shield':
        // Implement shield effect (invincibility for a few seconds)
        break
      case 'superjump':
        this.flapStrength = -12
        setTimeout(() => { this.flapStrength = -8 }, 5000)
        break
      case 'magnet':
        // Attract coins for a few seconds
        break
      case 'slowmo':
        this.speed *= 0.5
        setTimeout(() => { this.speed = this.baseSpeed + this.score * 0.01 }, 3000)
        break
    }
  }

  private checkObstacleCollision(obs: Obstacle): boolean {
    const px = this.player.x
    const py = this.player.y
    const pw = this.player.width
    const ph = this.player.height

    // Top block
    if (px < obs.x + obs.width && px + pw > obs.x && py < obs.gapY) {
      return true
    }
    // Bottom block
    if (px < obs.x + obs.width && px + pw > obs.x && py + ph > obs.gapY + obs.gapHeight) {
      return true
    }
    return false
  }

  private checkEnemyCollision(enemy: Enemy): boolean {
    return (
      this.player.x < enemy.x + enemy.width &&
      this.player.x + this.player.width > enemy.x &&
      this.player.y < enemy.y + enemy.height &&
      this.player.y + this.player.height > enemy.y
    )
  }

  private distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
  }

  private gameOver() {
    this.setState('gameover')
    this.screenShake = 10
    this.playSound('crash')
    if (this.score > this.bestScore) {
      this.bestScore = this.score
      this.saveBestScore()
      this.onBestScoreChange(this.bestScore)
      this.playSound('highscore')
    }
    this.playSound('gameover')
  }

  private checkMilestones() {
    const milestones = [10, 25, 50, 100, 200]
    for (const m of milestones) {
      if (this.score >= m && this.milestoneShown < m) {
        this.milestoneShown = m
        this.playSound('milestone')
        // Could show a message, but we'll keep it simple
      }
    }
  }

  private spawnParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        color,
      })
    }
  }

  private render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, this.height)
    grad.addColorStop(0, '#87CEEB')
    grad.addColorStop(1, '#E0F6FF')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, this.width, this.height)

    // Mountains (parallax)
    for (const m of this.mountains) {
      ctx.fillStyle = m.color
      ctx.beginPath()
      ctx.moveTo(m.x, m.y + m.height)
      ctx.lineTo(m.x + m.width / 2, m.y)
      ctx.lineTo(m.x + m.width, m.y + m.height)
      ctx.closePath()
      ctx.fill()
    }

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    for (const cloud of this.clouds) {
      ctx.beginPath()
      ctx.arc(cloud.x, cloud.y, cloud.width / 2, 0, Math.PI * 2)
      ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - 10, cloud.width * 0.3, 0, Math.PI * 2)
      ctx.arc(cloud.x + cloud.width * 0.6, cloud.y, cloud.width * 0.4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Ground
    ctx.fillStyle = '#4CAF50'
    ctx.fillRect(0, this.height - 20, this.width, 20)
    ctx.fillStyle = '#388E3C'
    ctx.fillRect(0, this.height - 20, this.width, 5)

    // Obstacles
    for (const obs of this.obstacles) {
      ctx.fillStyle = obs.color
      // Top block
      ctx.fillRect(obs.x, 0, obs.width, obs.gapY)
      // Bottom block
      ctx.fillRect(obs.x, obs.gapY + obs.gapHeight, obs.width, this.height - (obs.gapY + obs.gapHeight))
      // Add brick pattern
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'
      ctx.lineWidth = 2
      for (let y = 0; y < obs.gapY; y += 20) {
        ctx.beginPath()
        ctx.moveTo(obs.x, y)
        ctx.lineTo(obs.x + obs.width, y)
        ctx.stroke()
      }
      for (let y = obs.gapY + obs.gapHeight; y < this.height; y += 20) {
        ctx.beginPath()
        ctx.moveTo(obs.x, y)
        ctx.lineTo(obs.x + obs.width, y)
        ctx.stroke()
      }
    }

    // Coins
    for (const coin of this.coinsList) {
      if (coin.collected) continue
      ctx.save()
      ctx.translate(coin.x, coin.y)
      ctx.rotate(coin.rotation)
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(0, 0, coin.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#B8860B'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#FFA500'
      ctx.beginPath()
      ctx.arc(0, 0, coin.radius * 0.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // Power-ups
    for (const pu of this.powerUps) {
      ctx.fillStyle = pu.type === 'shield' ? '#00BFFF' : pu.type === 'superjump' ? '#FF4500' : pu.type === 'magnet' ? '#FF69B4' : '#9ACD32'
      ctx.beginPath()
      ctx.arc(pu.x, pu.y, 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(pu.type[0].toUpperCase(), pu.x, pu.y + 4)
    }

    // Enemies
    for (const enemy of this.enemies) {
      ctx.fillStyle = enemy.type === 'flyer' ? '#FF6347' : enemy.type === 'walker' ? '#8B4513' : enemy.type === 'turtle' ? '#2E8B57' : enemy.type === 'robot' ? '#708090' : '#FFD700'
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height)
      // Eyes
      ctx.fillStyle = '#fff'
      ctx.fillRect(enemy.x + 5, enemy.y + 5, 10, 10)
      ctx.fillRect(enemy.x + enemy.width - 15, enemy.y + 5, 10, 10)
      ctx.fillStyle = '#000'
      ctx.fillRect(enemy.x + 8, enemy.y + 8, 4, 4)
      ctx.fillRect(enemy.x + enemy.width - 12, enemy.y + 8, 4, 4)
    }

    // Particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.fillStyle = p.color
      ctx.fillRect(p.x, p.y, 4, 4)
    }
    ctx.globalAlpha = 1

    // Player
    this.renderPlayer(ctx)

    // Screen shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake
      const shakeY = (Math.random() - 0.5) * this.screenShake
      ctx.translate(shakeX, shakeY)
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const x = this.player.x
    const y = this.player.y
    const w = this.player.width
    const h = this.player.height

    ctx.save()
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate(this.player.rotation)

    // Body (blue overalls)
    ctx.fillStyle = '#1E90FF'
    ctx.fillRect(-w / 2, -h / 2, w, h)

    // Head (skin)
    ctx.fillStyle = '#FFDAB9'
    ctx.beginPath()
    ctx.arc(0, -h / 2 - 5, 12, 0, Math.PI * 2)
    ctx.fill()

    // Red cap
    ctx.fillStyle = '#FF0000'
    ctx.beginPath()
    ctx.arc(0, -h / 2 - 10, 14, Math.PI, 0)
    ctx.fill()
    ctx.fillRect(-14, -h / 2 - 10, 28, 5)

    // Eyes
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(-5, -h / 2 - 5, 4, 0, Math.PI * 2)
    ctx.arc(5, -h / 2 - 5, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(-4, -h / 2 - 5, 2, 0, Math.PI * 2)
    ctx.arc(6, -h / 2 - 5, 2, 0, Math.PI * 2)
    ctx.fill()

    // Moustache
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-8, -h / 2 + 2)
    ctx.quadraticCurveTo(0, -h / 2 + 6, 8, -h / 2 + 2)
    ctx.stroke()

    // White gloves
    ctx.fillStyle = '#fff'
    ctx.fillRect(-w / 2 - 5, h / 2 - 10, 10, 10)
    ctx.fillRect(w / 2 - 5, h / 2 - 10, 10, 10)

    // Brown shoes
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(-w / 2 - 2, h / 2 - 2, 12, 6)
    ctx.fillRect(w / 2 - 10, h / 2 - 2, 12, 6)

    ctx.restore()
  }

  private loadBestScore() {
    const stored = localStorage.getItem('skyHopperBestScore')
    if (stored) {
      this.bestScore = parseInt(stored, 10) || 0
      this.onBestScoreChange(this.bestScore)
    }
  }

  private saveBestScore() {
    localStorage.setItem('skyHopperBestScore', this.bestScore.toString())
  }

  private playSound(type: string) {
    if (!this.soundEnabled) return
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    const ctx = this.audioCtx
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    let frequency = 440
    let duration = 0.1
    switch (type) {
      case 'flap':
        frequency = 300
        duration = 0.05
        break
      case 'coin':
        frequency = 800
        duration = 0.1
        break
      case 'powerup':
        frequency = 1200
        duration = 0.2
        break
      case 'pass':
        frequency = 600
        duration = 0.1
        break
      case 'crash':
        frequency = 100
        duration = 0.3
        break
      case 'gameover':
        frequency = 200
        duration = 0.5
        break
      case 'highscore':
        frequency = 1500
        duration = 0.3
        break
      case 'milestone':
        frequency = 1000
        duration = 0.15
        break
    }

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    oscillator.type = 'square'
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }
}
