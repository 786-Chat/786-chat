"use client";

import { useEffect, useState } from "react";
import { MobileClosingChecks } from "@/components/mobile-closing-checks";
import { MobileBackButton } from "@/components/mobile-back-button";

export default function ClosingChecksPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return (
      <>
        <MobileBackButton />
        <MobileClosingChecks />
      </>
    );
  }

  // Desktop/tablet unchanged
  const { WeeklyChecksView } = require("@/components/weekly-checks-view");
  return <WeeklyChecksView mode="closing" />;
}
