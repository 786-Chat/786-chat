"use client";

import { useEffect, useState } from "react";
import { CleaningView } from "@/components/cleaning-view";
import { MobileBackButton } from "@/components/mobile-back-button";

export default function CleaningPage() {
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
        <CleaningView mobile />
      </>
    );
  }

  return (
    <>
      <MobileBackButton />
      <CleaningView />
    </>
  );
}
