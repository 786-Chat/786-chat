"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Sparkles, Zap, Shield, Globe, Bot, Cpu, BrainCircuit, X, Palette, Upload } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AIOrb } from "@/components/ui/ai-orb"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const floatingWords = ["Neural", "Quantum", "Cognitive", "Vision", "Transform"]

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false)
  return (
    <section className="relative min-h-screen overflow-hidden pt-32 pb-20">
      {/* Floating AI Words */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingWords.map((word, i) => (
          <motion.div
            key={word}
            className="absolute text-white/[0.03] font-bold text-4xl md:text-6xl select-none"
            style={{
              left: `${10 + (i % 3) * 30}%`,
              top: `${20 + Math.floor(i / 3) * 35}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.02, 0.06, 0.02],
              rotateX: [0, 10, 0],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          >
            {word}
          </motion.div>
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full glass border border-white/10 px-5 py-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="text-sm font-medium text-foreground/80">
                Powered by Next-Gen AI Technology
              </span>
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="max-w-5xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
          >
            <span className="block text-foreground">The Future of</span>
            <motion.span 
              className="block gradient-text mt-2"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 200%" }}
            >
              Artificial Intelligence
            </motion.span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed"
          >
            MujeebProAI helps restaurants, cafes, takeaways, and local businesses launch
            professional websites with online ordering, menu builders, and delivery systems.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button 
                size="lg" 
                asChild 
                className="h-14 px-8 text-base bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 shadow-lg shadow-primary/25"
              >
                <Link href="/register">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Building Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-8 text-base border-white/10 hover:border-white/20 hover:bg-white/5 group"
                onClick={() => setDemoOpen(true)}
              >
                <Play className="mr-2 h-5 w-5 group-hover:text-accent transition-colors" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Quick Action Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 flex flex-wrap justify-center gap-4"
          >
            <Link 
              href="/themes" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Palette className="w-4 h-4 text-cyan-400" />
              <span>Browse Themes</span>
              <ArrowRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </Link>
            <span className="text-white/20">|</span>
            <Link 
              href="/import-website" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Import Existing Website</span>
              <ArrowRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </Link>
          </motion.div>

          {/* Demo Video Modal */}
          <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
            <DialogContent className="max-w-4xl w-[95vw] bg-[#0d0d14] border-white/10 p-0 overflow-hidden max-h-[90vh]">
              <DialogHeader className="p-4 border-b border-white/10">
                <DialogTitle className="text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-cyan-400" />
                  MujeebProAI Demo
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Watch a demo of MujeebProAI capabilities
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="bg-black/50 flex items-center justify-center min-h-[400px]">
                  {/* Demo Video Content */}
                  <div className="text-center p-6 sm:p-8 w-full">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mb-6"
                    >
                      <AIOrb size="lg" />
                    </motion.div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Welcome to MujeebProAI</h3>
                    <p className="text-white/60 mb-6 max-w-md mx-auto text-sm sm:text-base">
                      Experience the power of AI-assisted coding, writing, and analysis. 
                      Get instant help with any task.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto px-2">
                      <motion.div 
                        className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mx-auto mb-2" />
                        <h4 className="text-sm font-medium text-white">AI Chat</h4>
                        <p className="text-xs text-white/50 mt-1">Natural conversations</p>
                      </motion.div>
                      <motion.div 
                        className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Cpu className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mx-auto mb-2" />
                        <h4 className="text-sm font-medium text-white">Code Generation</h4>
                        <p className="text-xs text-white/50 mt-1">Write code instantly</p>
                      </motion.div>
                      <motion.div 
                        className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10"
                        whileHover={{ scale: 1.02 }}
                      >
                        <BrainCircuit className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mx-auto mb-2" />
                        <h4 className="text-sm font-medium text-white">Smart Analysis</h4>
                        <p className="text-xs text-white/50 mt-1">Analyze anything</p>
                      </motion.div>
                    </div>
                    <Button 
                      className="mt-6 sm:mt-8 bg-gradient-to-r from-cyan-500 to-blue-600"
                      onClick={() => {
                        setDemoOpen(false)
                        window.location.href = "/register"
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Building Free
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* AI Orb with Orbiting Elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative mt-20 mb-16"
          >
            <AIOrb size="xl" />
            
            {/* Orbiting Icons */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ width: 320, height: 320, left: "50%", top: "50%", marginLeft: -160, marginTop: -160 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            >
              {[
                { Icon: Bot, color: "from-primary to-blue-400" },
                { Icon: Cpu, color: "from-accent to-cyan-400" },
                { Icon: BrainCircuit, color: "from-purple-500 to-pink-400" },
              ].map(({ Icon, color }, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `rotate(${i * 120}deg) translateX(160px) rotate(-${i * 120}deg)`,
                    marginTop: -24,
                    marginLeft: -24,
                  }}
                >
                  <motion.div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} p-0.5 shadow-lg`}
                    whileHover={{ scale: 1.2 }}
                    animate={{ rotate: [-i * 120, -i * 120 - 360] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-full h-full rounded-[10px] bg-background/90 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {[
              { value: "500+", label: "Businesses Launched" },
              { value: "99.9%", label: "Uptime Guaranteed" },
              { value: "24/7", label: "Support Available" },
              { value: "50+", label: "Theme Templates" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="group"
              >
                <motion.div 
                  className="text-3xl md:text-4xl font-bold gradient-text"
                  whileHover={{ scale: 1.05 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-muted-foreground mt-1 group-hover:text-foreground/70 transition-colors">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trusted By */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-24 pt-12 border-t border-white/5 w-full"
          >
            <p className="mb-8 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Everything You Need to Succeed
            </p>
            <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
              {["Online Ordering", "Menu Builder", "Delivery System", "Kitchen Display", "Marketplace"].map((feature, i) => (
                <motion.span
                  key={feature}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  whileHover={{ opacity: 1, scale: 1.05 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className="text-lg md:text-xl font-semibold text-muted-foreground cursor-default transition-all"
                >
                  {feature}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="relative mt-20 w-full max-w-5xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-purple-500/20 blur-3xl opacity-30" />
            <motion.div 
              className="relative overflow-hidden rounded-2xl border border-white/10 glass p-1.5 shadow-2xl"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-xl bg-background/80 backdrop-blur-sm overflow-hidden">
                {/* Window Header */}
                <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4 bg-black/20">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-sm text-muted-foreground font-medium">MujeebProAI Dashboard</span>
                  </div>
                  <div className="w-16" />
                </div>
                {/* Window Content */}
                <div className="grid gap-4 p-6 md:grid-cols-3">
                  {[
                    { label: "Active Sites", value: "12", progress: 75, color: "from-primary to-blue-400" },
                    { label: "Orders Today", value: "156", progress: 60, color: "from-accent to-cyan-400" },
                    { label: "Monthly Revenue", value: "£8.2K", progress: 90, color: "from-green-500 to-emerald-400" },
                  ].map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="text-sm text-muted-foreground mb-2">{card.label}</div>
                      <div className="text-3xl font-bold text-foreground">{card.value}</div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${card.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${card.progress}%` }}
                          transition={{ duration: 1, delay: 1 + i * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
