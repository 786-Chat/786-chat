"use client"

import { motion } from "framer-motion"

interface AIOrbProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  pulse?: boolean
}

export function AIOrb({ size = "md", className = "", pulse = true }: AIOrbProps) {
  const sizes = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48"
  }
  
  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, transparent 70%)",
        }}
        animate={pulse ? {
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.1, 0.3],
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, transparent 60%)",
        }}
        animate={pulse ? {
          scale: [1.2, 1.8, 1.2],
          opacity: [0.2, 0.05, 0.2],
        } : {}}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      
      {/* Core orb */}
      <motion.div
        className="absolute inset-4 rounded-full overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(96, 165, 250, 0.8) 0%, rgba(168, 85, 247, 0.6) 50%, rgba(34, 211, 238, 0.8) 100%)",
          boxShadow: "0 0 40px rgba(96, 165, 250, 0.5), inset 0 0 30px rgba(255,255,255,0.2)",
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Inner shine */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)",
          }}
        />
        
        {/* Rotating highlights */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-1/4 h-1/4 rounded-full bg-white/40"
          style={{ filter: "blur(8px)" }}
          animate={{
            x: [0, 10, -5, 0],
            y: [0, -5, 10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
      
      {/* Center bright spot */}
      <div
        className="absolute inset-0 flex items-center justify-center"
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-white"
          style={{
            boxShadow: "0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(96, 165, 250, 0.6)",
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  )
}
