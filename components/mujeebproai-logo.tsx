"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import useSWR from "swr"

interface LogoProps {
  variant?: "full" | "compact" | "icon" | "favicon"
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  animated?: boolean
  showText?: boolean
  className?: string
}

interface ActiveLogo {
  id: string
  type: "image" | "video"
  url: string
  filename: string
}

const sizeMap = {
  xs: { icon: 36, text: "text-base" },
  sm: { icon: 48, text: "text-xl" },
  md: { icon: 60, text: "text-2xl" },
  lg: { icon: 80, text: "text-3xl" },
  xl: { icon: 110, text: "text-5xl" },
}

/* Each letter in "MujeebProAI" gets a distinct color - matching the rainbow brand style */
const brandColors = [
  "#ff4d6a", // M - red/pink
  "#ff8c42", // u - orange
  "#ffd000", // j - yellow
  "#44cc66", // e - green
  "#44cc66", // e - green
  "#22aaff", // b - blue
  "#6655ee", // P - purple
  "#ff4d6a", // r - red/pink
  "#ff8c42", // o - orange
  "#22aaff", // A - blue
  "#44cc66", // I - green
]

const brandText = "MujeebProAI"

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

function ColorfulBrandText({ textClass }: { textClass: string }) {
  return (
    <span className={`font-bold tracking-tight ${textClass}`}>
      {brandText.split("").map((letter, i) => (
        <span
          key={i}
          style={{ color: brandColors[i] }}
          className="drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]"
        >
          {letter}
        </span>
      ))}
    </span>
  )
}

function BrandLogo({ size, animated, customLogo }: { size: number; animated: boolean; customLogo?: ActiveLogo | null }) {
  const defaultLogoSrc = "/images/logo-animated.gif"
  
  // Use custom logo if available
  const logoSrc = customLogo?.url || defaultLogoSrc
  const isVideo = customLogo?.type === "video"

  return (
    <div
      className="relative flex-shrink-0 rounded-full overflow-hidden"
      style={{ width: size, height: size }}
    >
      {isVideo ? (
        <video
          src={logoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-[115%] h-[115%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          draggable={false}
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoSrc}
          alt="MujeebProAI"
          width={size}
          height={size}
          className="object-cover w-[115%] h-[115%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          draggable={false}
        />
      )}

      {/* Animated glow behind the logo */}
      {animated && (
        <motion.div
          className="absolute inset-[-4px] rounded-full pointer-events-none -z-10 blur-md"
          style={{
            background:
              "radial-gradient(circle, rgba(0,180,100,0.25) 0%, rgba(0,100,220,0.15) 50%, transparent 70%)",
          }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  )
}

export function MujeebProAILogo({
  variant = "full",
  size = "md",
  animated = true,
  showText = true,
  className = "",
}: LogoProps) {
  const dims = sizeMap[size]
  
  // Fetch active logo from API
  const { data } = useSWR<{ logo: ActiveLogo | null }>("/api/admin/logo/active", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Cache for 1 minute
  })
  
  const customLogo = data?.logo

  /* Icon / Favicon - just the logo image, no text */
  if (variant === "favicon" || variant === "icon") {
    return (
      <div className={`relative flex-shrink-0 ${className}`}>
        <BrandLogo size={dims.icon} animated={animated} customLogo={customLogo} />
      </div>
    )
  }

  /* Compact - smaller gap, no animation */
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-3 relative z-20 ${className}`}>
        <BrandLogo size={dims.icon} animated={false} customLogo={customLogo} />
        {showText && <ColorfulBrandText textClass={dims.text} />}
      </div>
    )
  }

  /* Full - logo + colorful bold text with glow */
  return (
    <div className={`flex items-center gap-4 group relative z-20 ${className}`}>
      <BrandLogo size={dims.icon} animated={animated} customLogo={customLogo} />
      {showText && <ColorfulBrandText textClass={dims.text} />}
    </div>
  )
}
