"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    // Do not redirect during the first render while the viewport is still
    // unknown. The old false default caused mobile / to jump straight back
    // to /dashboard before the launcher could render.
    if (isMobile === false) {
      router.replace("/dashboard");
    }
  }, [isMobile, router]);

  // On mobile, the global MobileLauncher from app/layout.tsx owns the root
  // route. Desktop/tablet continue to redirect to Dashboard after detection.
  return null;
}
