"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (window.innerWidth >= 768) {
      router.replace("/dashboard");
    }
  }, [router]);

  return null;
}
