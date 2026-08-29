"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [viewportReady, setViewportReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      setViewportReady(true);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (viewportReady && !isMobile) {
      router.replace("/dashboard");
    }
  }, [viewportReady, isMobile, router]);

  // On mobile the global MobileLauncher rendered by app/layout.tsx owns the
  // root route. Keep this page empty so Dashboard's back arrow can return to
  // the Apple-style launcher instead of immediately redirecting to Dashboard.
  return null;
}
