import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name") || "R"
  const color = request.nextUrl.searchParams.get("color") || "#3b82f6"
  const size = parseInt(request.nextUrl.searchParams.get("size") || "512")

  // Get initials (max 2 characters)
  const words = name.trim().split(/\s+/)
  const initials = words.length >= 2 
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()

  // Create SVG icon with initials
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${color}" rx="${size * 0.15}"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="central" 
        text-anchor="middle" 
        fill="white" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-weight="700" 
        font-size="${size * 0.4}"
      >${initials}</text>
    </svg>
  `.trim()

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400"
    }
  })
}
