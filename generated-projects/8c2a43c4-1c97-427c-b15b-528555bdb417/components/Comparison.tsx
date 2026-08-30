"use client";

import { useState } from "react";

export default function Comparison() {
  const [showPremium, setShowPremium] = useState(false);

  return (
    <section className="section bg-white">
      <div className="container max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-8">Compare Our Offerings</h2>
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setShowPremium(false)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${!showPremium ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}
          >
            Classic
          </button>
          <button
            onClick={() => setShowPremium(true)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${showPremium ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}
          >
            Premium
          </button>
        </div>
        <div className="bg-neutral-50 rounded-2xl p-8">
          {showPremium ? (
            <div>
              <h3 className="text-2xl font-semibold mb-4">Premium Selection</h3>
              <p>Single-origin beans, limited roasts, and exclusive tasting notes.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-semibold mb-4">Classic Selection</h3>
              <p>Our everyday blends, consistent and comforting.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}