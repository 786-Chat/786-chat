"use client"

import Image from "next/image"
import { motion } from "framer-motion"

interface LogoProps {
  variant?: "full" | "compact" | "icon" | "favicon"
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  animated?: boolean
  showText?: boolean
  className?: string
}

const sizeMap = {
  xs: { width: 70, height: 52 },
  sm: { width: 92, height: 69 },
  md: { width: 118, height: 89 },
  lg: { width: 148, height: 111 },
  xl: { width: 184, height: 138 },
}

export function MujeebProAILogo({
  size = "md",
  animated = true,
  className = "",
}: LogoProps) {
  const dimensions = sizeMap[size]

  return (
    <motion.div
      className={`relative shrink-0 overflow-visible ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
      animate={animated ? { y: [0, -2, 0], filter: ["drop-shadow(0 0 8px rgba(212,175,55,.18))", "drop-shadow(0 0 16px rgba(245,201,92,.36))", "drop-shadow(0 0 8px rgba(212,175,55,.18))"] } : undefined}
      transition={animated ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : undefined}
      aria-label="786 Chat AI"
    >
      <Image
        src="/786-chat-ai-logo.svg"
        alt="786 Chat AI"
        fill
        priority
        sizes={`${dimensions.width}px`}
        className="object-contain"
      />
    </motion.div>
  )
}
