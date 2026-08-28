"use client";

import { useEffect, useState } from "react";
import { MobileBackButton } from "@/components/mobile-back-button";
import { FreezersView } from "@/components/freezers-view";
import { MobileFreezerCheck } from "@/components/mobile-freezer-check";

export default function FreezersPage() {
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
        <MobileFreezerCheck />
      </>
    );
  }

  return <FreezersView />;
}
