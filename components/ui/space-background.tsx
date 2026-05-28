"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    
    // Stars
    const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = []
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.8 + 0.2
      })
    }
    
    // Particles
    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string }[] = []
    const colors = ["rgba(96, 165, 250, 0.6)", "rgba(34, 211, 238, 0.5)", "rgba(168, 85, 247, 0.5)"]
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }
    
    // Meteors
    const meteors: { x: number; y: number; length: number; speed: number; active: boolean }[] = []
    for (let i = 0; i < 3; i++) {
      meteors.push({
        x: Math.random() * canvas.width,
        y: -100,
        length: Math.random() * 100 + 50,
        speed: Math.random() * 5 + 3,
        active: false
      })
    }
    
    let animationId: number
    let lastMeteorTime = 0
    
    const animate = (time: number) => {
      ctx.fillStyle = "rgba(5, 8, 22, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw stars with twinkle
      stars.forEach(star => {
        const twinkle = Math.sin(time * 0.002 * star.speed) * 0.3 + 0.7
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`
        ctx.fill()
        
        // Move stars slowly
        star.y += star.speed * 0.1
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }
      })
      
      // Draw particles with connections
      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
        
        // Draw connections
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(96, 165, 250, ${0.15 * (1 - dist / 150)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      
      // Spawn meteors occasionally
      if (time - lastMeteorTime > 3000 + Math.random() * 5000) {
        const inactiveMeteor = meteors.find(m => !m.active)
        if (inactiveMeteor) {
          inactiveMeteor.active = true
          inactiveMeteor.x = Math.random() * canvas.width + 200
          inactiveMeteor.y = -100
          lastMeteorTime = time
        }
      }
      
      // Draw meteors
      meteors.forEach(meteor => {
        if (!meteor.active) return
        
        const gradient = ctx.createLinearGradient(
          meteor.x, meteor.y,
          meteor.x + meteor.length * 0.7, meteor.y + meteor.length * 0.7
        )
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)")
        gradient.addColorStop(1, "transparent")
        
        ctx.beginPath()
        ctx.moveTo(meteor.x, meteor.y)
        ctx.lineTo(meteor.x + meteor.length * 0.7, meteor.y + meteor.length * 0.7)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.stroke()
        
        meteor.x -= meteor.speed * 2
        meteor.y += meteor.speed * 2
        
        if (meteor.y > canvas.height + 100) {
          meteor.active = false
        }
      })
      
      animationId = requestAnimationFrame(animate)
    }
    
    animate(0)
    
    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])
  
  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      {/* Aurora gradients */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(96, 165, 250, 0.4) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, rgba(34, 211, 238, 0.4) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      {/* Grid overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30 grid-pattern"
        style={{ zIndex: 2 }}
      />
    </>
  )
}
