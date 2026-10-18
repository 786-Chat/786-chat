import Link from "next/link";
import { ArrowRight, Coffee, Leaf, Award, Users, Star, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
              <Coffee className="h-4 w-4" />
              Small-batch roasted daily
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
              Crafted coffee for <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">every moment</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl">
              From bean to cup, we source ethically and roast with precision. Experience the difference of truly artisan coffee.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/menu">
                  Explore Menu
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/about">Our Story</Link>
              </Button>
            </div>
          </div>
          <div className="relative z-10">
            <div className="relative mx-auto max-w-md">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-200 to-violet-200 rounded-3xl blur-2xl opacity-60" />
              <div className="relative rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Today&apos;s Roast</p>
                    <p className="text-2xl font-bold text-slate-900">Ethiopia Yirgacheffe</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">In stock</span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-2xl font-bold text-indigo-600">4.9</p>
                    <p className="text-xs text-slate-500">Rating</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-2xl font-bold text-indigo-600">120+</p>
                    <p className="text-xs text-slate-500">Reviews</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-2xl font-bold text-indigo-600">15</p>
                    <p className="text-xs text-slate-500">Origins</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Why Bean House?</h2>
            <p className="mt-4 text-lg text-slate-600">We obsess over every detail so you can enjoy the perfect cup.</p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <Leaf className="h-8 w-8 text-indigo-600" />
              <h3 className="mt-4 text-lg font-semibold">Ethically Sourced</h3>
              <p className="mt-2 text-slate-600">Direct trade partnerships with farmers worldwide.</p>
            </Card>
            <Card className="p-6">
              <Award className="h-8 w-8 text-indigo-600" />
              <h3 className="mt-4 text-lg font-semibold">Award-Winning Roast</h3>
              <p className="mt-2 text-slate-600">Recognized for our unique flavor profiles.</p>
            </Card>
            <Card className="p-6">
              <Users className="h-8 w-8 text-indigo-600" />
              <h3 className="mt-4 text-lg font-semibold">Community Focus</h3>
              <p className="mt-2 text-slate-600">A welcoming space for work and connection.</p>
            </Card>
            <Card className="p-6">
              <Star className="h-8 w-8 text-indigo-600" />
              <h3 className="mt-4 text-lg font-semibold">Consistent Quality</h3>
              <p className="mt-2 text-slate-600">Every cup brewed to perfection, every time.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Demo */}
      <section className="bg-gradient-to-br from-indigo-50 to-violet-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Experience the Bean House difference</h2>
            <p className="mt-4 text-lg text-slate-600">Our baristas are trained to bring out the best in every bean. Watch our brewing process or visit us to taste it yourself.</p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-start gap-3">
                <Coffee className="h-6 w-6 text-indigo-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Signature Brews</p>
                  <p className="text-slate-600">Hand-crafted espresso drinks and pour-overs.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-6 w-6 text-indigo-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Fresh Daily</p>
                  <p className="text-slate-600">Beans roasted in-house every morning.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-6 w-6 text-indigo-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Visit Us</p>
                  <p className="text-slate-600">Find us in the heart of downtown.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-200 to-cyan-200 rounded-3xl blur-2xl opacity-50" />
            <div className="relative rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Brew Guide</p>
                <span className="text-xs text-slate-400">Step 2 of 3</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="h-2 w-full rounded-full bg-slate-100"><div className="h-2 w-2/3 rounded-full bg-indigo-500" /></div>
                <p className="text-sm text-slate-600">Grind 20g of beans to a medium-fine consistency.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Proof */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900">Loved by coffee lovers</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { name: "Sarah M.", quote: "Best latte in town! The atmosphere is perfect for working.", initials: "SM" },
              { name: "James T.", quote: "Their single-origin beans are incredible. I order online every week.", initials: "JT" },
              { name: "Emily R.", quote: "A cozy spot with friendly staff and amazing pastries.", initials: "ER" },
            ].map((testimonial) => (
              <Card key={testimonial.name} className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-slate-600">"{testimonial.quote}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Modules */}
      <section className="bg-slate-900 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center">More than just coffee</h2>
          <p className="mt-4 text-lg text-slate-300 text-center max-w-2xl mx-auto">Explore our full range of offerings.</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Espresso Bar", desc: "Classic and signature espresso drinks." },
              { title: "Brew Bar", desc: "Pour-over, French press, and cold brew." },
              { title: "Pastries", desc: "Freshly baked goods from local bakeries." },
              { title: "Coffee Beans", desc: "Buy our roasted beans to enjoy at home." },
              { title: "Merchandise", desc: "Mugs, tumblers, and apparel." },
              { title: "Catering", desc: "Coffee service for events and offices." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-slate-800 p-6 ring-1 ring-slate-700">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-slate-900">We partner with the best</h2>
          <div className="mt-12 flex flex-wrap justify-center gap-8">
            {["Local Farms", "Roastery Co-op", "Fair Trade Org", "Brewing Guild"].map((partner) => (
              <span key={partner} className="rounded-full bg-slate-100 px-6 py-3 text-sm font-medium text-slate-700">
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Conversion */}
      <section className="bg-gradient-to-r from-indigo-600 to-violet-600 py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to taste the difference?</h2>
          <p className="mt-4 text-lg text-indigo-100">Visit us today or get in touch for catering and wholesale.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button asChild size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50">
              <Link href="/menu">View Menu</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
