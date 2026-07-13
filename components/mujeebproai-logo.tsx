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
  xs: 36,
  sm: 48,
  md: 60,
  lg: 80,
  xl: 96,
}

export function MujeebProAILogo({
  size = "md",
  animated = true,
  className = "",
}: LogoProps) {
  const dimension = sizeMap[size]

  return (
    <motion.div
      className={`relative shrink-0 overflow-hidden rounded-[26%] shadow-[0_0_30px_rgba(212,175,55,0.18)] ${className}`}
      style={{ width: dimension, height: dimension }}
      animate={
        animated
          ? {
              y: [0, -2, 0],
              boxShadow: [
                "0 0 20px rgba(212,175,55,.12)",
                "0 0 34px rgba(245,201,92,.24)",
                "0 0 20px rgba(212,175,55,.12)",
              ],
            }
          : undefined
      }
      transition={animated ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : undefined}
      aria-label="786 Chat AI"
    >
      <Image
        src="/786-chat-ai-logo.svg"
        alt="786 Chat AI"
        fill
        priority
        sizes={`${dimension}px`}
        className="object-cover"
      />
    </motion.div>
  )
}
