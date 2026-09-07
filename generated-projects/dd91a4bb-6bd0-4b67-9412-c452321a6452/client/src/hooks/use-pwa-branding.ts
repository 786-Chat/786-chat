import { useEffect } from "react";

export type PwaSection = "customer" | "epos" | "kitchen" | "waiter" | "driver" | "suppliers" | "finances";

const PWA_CONFIG: Record<PwaSection, { manifest: string; icon: string; themeColor: string; title: string }> = {
  customer: {
    manifest: "/manifest-customer.json",
    icon: "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722781792-4dcf5a16-02e9-4fef-8d25-7090f7b723e3-icon-customer-512-y9rO6Bxem33yRMpq2xQbVtWrsOt37F.png",
    themeColor: "#8b5cf6",
    title: "Link24",
  },
  epos: {
    manifest: "/manifest-epos.json",
    icon: "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722785958-aed361a7-430c-4b35-9cd1-c994ce6d1f38-icon-epos-512-RTAiKovQ13EofiCsOvxT8IZwHDM4Z9.png",
    themeColor: "#06b6d4",
    title: "App Epos",
  },
  kitchen: {
    manifest: "/manifest-kitchen.json",
    icon: "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722789988-0b270daa-7c45-404f-ae45-9766035aac35-icon-kitchen-512-kuHGpG5tdybDVD8HZs6PHS82S6wrpX.png",
    themeColor: "#f97316",
    title: "App Kitchen",
  },
  waiter: {
    manifest: "/manifest-waiter.json",
    icon: "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722796212-7ee26760-dc21-49fe-96d0-8d960cb01532-icon-waiter-512-jbEeiERDSFJLjC5sGVYtIgG7VrzShz.png",
    themeColor: "#1e3a5f",
    title: "App Waiter",
  },
  driver: {
    manifest: "/manifest-driver.json",
    icon: "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722783902-13f6208b-3811-48df-9efc-954d405bfa19-icon-driver-512-gRzMVomShn63ANEu0ZBGylJOZH2jwD.png",
    themeColor: "#f59e0b",
    title: "App Driver",
  },
  suppliers: {
    manifest: "/manifest-suppliers.json",
    icon: "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722793858-5269d09b-bdc9-4439-be9a-2601dbab64b5-icon-suppliers-512-JpFroZ2a0WyyiWEh03SOfCC3WJ8aE9.png",
    themeColor: "#8b5cf6",
    title: "App Suppliers",
  },
  finances: {
    manifest: "/manifest-finances.json",
    icon: "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722787968-6da9f811-4d19-4f3e-b363-962df2733b71-icon-finances-512-ouKOeed6kx6sPuOrRpRKZ7wdHTr2pb.png",
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
