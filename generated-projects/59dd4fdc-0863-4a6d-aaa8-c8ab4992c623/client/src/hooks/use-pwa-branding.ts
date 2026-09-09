import { useEffect } from "react";

export type PwaSection = "customer" | "epos" | "kitchen" | "waiter" | "driver" | "suppliers" | "finances";

const PWA_CONFIG: Record<PwaSection, { manifest: string; icon: string; themeColor: string; title: string }> = {
  customer: {
    manifest: "/manifest-customer.json",
    icon: "/icon-customer-512.png",
    themeColor: "#8b5cf6",
    title: "Link24",
  },
  epos: {
    manifest: "/manifest-epos.json",
    icon: "/icon-epos-512.png",
    themeColor: "#06b6d4",
    title: "App Epos",
  },
  kitchen: {
    manifest: "/manifest-kitchen.json",
    icon: "/icon-kitchen-512.png",
    themeColor: "#f97316",
    title: "App Kitchen",
  },
  waiter: {
    manifest: "/manifest-waiter.json",
    icon: "/icon-waiter-512.png",
    themeColor: "#1e3a5f",
    title: "App Waiter",
  },
  driver: {
    manifest: "/manifest-driver.json",
    icon: "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/uploads/c7e4899c-e868-4904-9843-0b5c05a2ceef/1788427358231-rla8cs.png",
    themeColor: "#f59e0b",
    title: "App Driver",
  },
  suppliers: {
    manifest: "/manifest-suppliers.json",
    icon: "/icon-suppliers-512.png",
    themeColor: "#8b5cf6",
    title: "App Suppliers",
  },
  finances: {
    manifest: "/manifest-finances.json",
    icon: "/icon-finances-512.png",
    themeColor: "#10b981",
    title: "App Finances",
  },
};

export function usePwaBranding(section: PwaSection) {
  useEffect(() => {
    const config = PWA_CONFIG[section];
    if (!config) return;

    const manifestLink = document.querySelector('link[rel="manifest"]');
    const originalManifestHref = manifestLink?.getAttribute("href");

    const appleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
    const originalIconHrefs: string[] = [];
    appleTouchIcons.forEach((icon) => {
      originalIconHrefs.push(icon.getAttribute("href") || "");
    });

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = metaThemeColor?.getAttribute("content");

    const appleAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const originalAppleTitle = appleAppTitle?.getAttribute("content");

    if (manifestLink) {
      manifestLink.setAttribute("href", config.manifest);
    }
    
    appleTouchIcons.forEach((icon) => {
      icon.setAttribute("href", config.icon);
    });
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", config.themeColor);
    }
    if (appleAppTitle) {
      appleAppTitle.setAttribute("content", config.title);
    }

    return () => {
      if (manifestLink && originalManifestHref) {
        manifestLink.setAttribute("href", originalManifestHref);
      }
      appleTouchIcons.forEach((icon, index) => {
        if (originalIconHrefs[index]) {
          icon.setAttribute("href", originalIconHrefs[index]);
        }
      });
      if (metaThemeColor && originalThemeColor) {
        metaThemeColor.setAttribute("content", originalThemeColor);
      }
      if (appleAppTitle && originalAppleTitle) {
        appleAppTitle.setAttribute("content", originalAppleTitle);
      }
    };
  }, [section]);
}

export function useRestaurantPwaBranding(slug: string | undefined, restaurantName: string | undefined, logoUrl: string | undefined, themeColor?: string, pageType?: "menu" | "welcome") {
  useEffect(() => {
    if (!slug) return;

    const manifestLink = document.querySelector('link[rel="manifest"]');
    const originalManifestHref = manifestLink?.getAttribute("href");

    const appleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
    const originalIconHrefs: string[] = [];
    appleTouchIcons.forEach((icon) => {
      originalIconHrefs.push(icon.getAttribute("href") || "");
    });

    const appleAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const originalAppleTitle = appleAppTitle?.getAttribute("content");

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = metaThemeColor?.getAttribute("content");

    const originalTitle = document.title;

    const page = pageType || "menu";
    if (manifestLink) {
      manifestLink.setAttribute("href", `/api/restaurants/${slug}/manifest.json?page=${page}`);
    }

    if (logoUrl) {
      appleTouchIcons.forEach((icon) => {
        icon.setAttribute("href", logoUrl);
      });
    }

    if (restaurantName) {
      if (appleAppTitle) {
        appleAppTitle.setAttribute("content", restaurantName);
      }
      document.title = restaurantName;
    }

    if (metaThemeColor && themeColor) {
      metaThemeColor.setAttribute("content", themeColor);
    }

    return () => {
      if (manifestLink && originalManifestHref) {
        manifestLink.setAttribute("href", originalManifestHref);
      }
      appleTouchIcons.forEach((icon, index) => {
        if (originalIconHrefs[index]) {
          icon.setAttribute("href", originalIconHrefs[index]);
        }
      });
      if (appleAppTitle && originalAppleTitle) {
        appleAppTitle.setAttribute("content", originalAppleTitle);
      }
      if (metaThemeColor && originalThemeColor) {
        metaThemeColor.setAttribute("content", originalThemeColor);
      }
      document.title = originalTitle;
    };
  }, [slug, restaurantName, logoUrl, themeColor, pageType]);
}
