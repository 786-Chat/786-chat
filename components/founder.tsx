"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { MapPin, Globe, Sparkles, Award, Heart, Rocket } from "lucide-react"

export function Founder() {
  return (
    <section id="founder" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-cyan-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Meet the Visionary
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-foreground">Built by </span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Mujeeb Sardar
            </span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            A passionate innovator transforming businesses with AI-powered solutions
          </p>
        </motion.div>

        {/* Founder Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative rounded-3xl p-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 overflow-hidden group">
            {/* Animated border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-50 blur-xl group-hover:opacity-75 transition-opacity duration-500" />
            
            <div className="relative glass-strong rounded-3xl p-8 md:p-12">
              <div className="flex flex-col lg:flex-row gap-10 items-center">
                {/* Photo with animated border */}
                <div className="relative flex-shrink-0">
                  {/* Outer glow ring */}
                  <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-30 blur-xl animate-pulse" />
                  
                  {/* Animated spinning border */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 animate-spin-slow" style={{ animationDuration: '8s' }} />
                  
                  {/* Photo container */}
                  <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-background">
                    <Image
                      src="/images/founder.png"
                      alt="Mujeeb Sardar - CEO & Founder of MujeebProAI"
                      fill
                      className="object-cover object-top"
                      priority
                    />
                  </div>
                  
                  {/* Status badge */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full glass border border-cyan-500/30 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">Available for Projects</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    Mujeeb Sardar
                  </h3>
                  <p className="text-xl text-cyan-400 font-semibold mb-4">
                    CEO & Founder of MujeebProAI
                  </p>
                  
                  {/* Location badges */}
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <span className="text-muted-foreground">Based in</span>
                      <span className="text-foreground font-medium">United Kingdom</span>
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm">
                      <Globe className="w-4 h-4 text-purple-400" />
                      <span className="text-muted-foreground">From</span>
                      <span className="text-foreground font-medium">Nathia Gali, Pakistan</span>
                    </span>
                  </div>

                  {/* Story */}
                  <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
                    With a vision to democratize artificial intelligence, Mujeeb Sardar founded MujeebProAI 
                    to help businesses and creators harness the power of AI. From the beautiful mountains of 
                    Nathia Gali to the tech hubs of the United Kingdom, his journey reflects a commitment to 
                    innovation, excellence, and making advanced technology accessible to everyone.
                  </p>

                  {/* Stats/Highlights */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="glass rounded-xl p-4 text-center group/stat hover:border-cyan-500/30 transition-colors">
                      <Award className="w-6 h-6 text-cyan-400 mx-auto mb-2 group-hover/stat:scale-110 transition-transform" />
                      <div className="text-2xl font-bold text-foreground">5+</div>
                      <div className="text-xs text-muted-foreground">Years in AI</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center group/stat hover:border-purple-500/30 transition-colors">
                      <Rocket className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover/stat:scale-110 transition-transform" />
                      <div className="text-2xl font-bold text-foreground">50+</div>
                      <div className="text-xs text-muted-foreground">Projects Delivered</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center group/stat hover:border-pink-500/30 transition-colors">
                      <Heart className="w-6 h-6 text-pink-400 mx-auto mb-2 group-hover/stat:scale-110 transition-transform" />
                      <div className="text-2xl font-bold text-foreground">100%</div>
                      <div className="text-xs text-muted-foreground">Passion Driven</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
