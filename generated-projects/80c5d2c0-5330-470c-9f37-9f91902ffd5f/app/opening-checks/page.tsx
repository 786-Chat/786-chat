"use client";

import { useEffect, useState } from "react";
import { MobileOpeningChecks } from "@/components/mobile-opening-checks";

export default function OpeningChecksPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return <MobileOpeningChecks />;
  }

  // Desktop/tablet unchanged
  const { WeeklyChecksView } = require("@/components/weekly-checks-view");
  return <WeeklyChecksView mode="opening" />;
}
