import { Coffee, Heart, Handshake } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container-custom py-12">
      <h1 className="text-4xl font-bold text-stone-900">About Bean House</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <p className="text-lg text-stone-700">
            Bean House started as a small corner café with a big dream: to
            create a space where people could enjoy exceptional coffee and
            feel at home. Today, we are a thriving community hub known for our
            quality roasts and warm hospitality.
          </p>
          <p className="mt-4 text-stone-700">
            Our beans are ethically sourced from small farms around the world,
            and we roast them in-house to ensure freshness in every cup.
          </p>
        </div>
        <div className="space-y-4">
          <div className="card flex items-center gap-4">
            <Coffee className="h-8 w-8 text-amber-600" />
            <div>
              <h3 className="font-semibold">Our Mission</h3>
              <p className="text-sm text-stone-600">
                To serve the best coffee while supporting sustainable farming.
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <Heart className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="font-semibold">Our Values</h3>
              <p className="text-sm text-stone-600">
                Quality, community, and environmental responsibility.
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <Handshake className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold">Our Partners</h3>
              <p className="text-sm text-stone-600">
                We work directly with farmers and local bakers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
