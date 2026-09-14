import { Card } from "@/components/ui/card";
import { Coffee, Heart, Leaf, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900">Our Story</h1>
        <p className="mt-4 text-lg text-slate-600">From a small roastery to your favorite neighborhood coffee shop.</p>
      </div>
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="text-lg text-slate-700">
            Bean House was founded in 2015 with a simple mission: to serve exceptional coffee while supporting sustainable farming practices. We started as a tiny kiosk with a single espresso machine and a dream.
          </p>
          <p className="text-lg text-slate-700">
            Today, we roast our own beans in-house, partner directly with growers, and have become a gathering place for our community. Every cup we serve reflects our commitment to quality, ethics, and warmth.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">10+</p>
              <p className="text-sm text-slate-500">Years of roasting</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">15</p>
              <p className="text-sm text-slate-500">Partner farms</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">50k+</p>
              <p className="text-sm text-slate-500">Cups served</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">4.9</p>
              <p className="text-sm text-slate-500">Average rating</p>
            </Card>
          </div>
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Leaf className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-semibold">Sustainability</h2>
            </div>
            <p className="mt-3 text-slate-600">We use compostable packaging, support reforestation, and pay fair prices to farmers.</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-semibold">Community</h2>
            </div>
            <p className="mt-3 text-slate-600">We host local events, art shows, and open mic nights. Our space is yours.</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-semibold">Our Team</h2>
            </div>
            <p className="mt-3 text-slate-600">A passionate group of baristas, roasters, and coffee lovers who treat you like family.</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Coffee className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-semibold">Our Coffee</h2>
            </div>
            <p className="mt-3 text-slate-600">We roast in small batches to ensure peak freshness and flavor in every bag.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
