import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

const PWA_BRANDING: Record<string, { icon: string; manifest: string; themeColor: string; title: string }> = {
  "/epos-login": { icon: "/icon-epos-192.png", manifest: "/manifest-epos.json", themeColor: "#059669", title: "Link24-EPOS" },
  "/kitchen-login": { icon: "/icon-kitchen-192.png", manifest: "/manifest-kitchen.json", themeColor: "#ea580c", title: "Link24-Kitchen" },
  "/waiter-login": { icon: "/icon-waiter-192.png", manifest: "/manifest-waiter.json", themeColor: "#7c3aed", title: "Link24-Waiter" },
  "/driver-login": { icon: "https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/uploads/c7e4899c-e868-4904-9843-0b5c05a2ceef/1788427357025-pysge.png", manifest: "/manifest-driver.json", themeColor: "#2563eb", title: "Link24-Driver" },
  "/suppliers-login": { icon: "/icon-suppliers-192.png", manifest: "/manifest-suppliers.json", themeColor: "#0891b2", title: "Link24-Suppliers" },
  "/finances-login": { icon: "/icon-finances-192.png", manifest: "/manifest-finances.json", themeColor: "#16a34a", title: "Link24-Finances" },
};

function injectPwaBranding(html: string, urlPath: string): string {
  const branding = PWA_BRANDING[urlPath];
  if (!branding) return html;
  
  let result = html;
  
  result = result.replace(
    /<link rel="manifest" href="[^"]*">/g,
    `<link rel="manifest" href="${branding.manifest}">`
  );
  
  result = result.replace(
    /<link rel="apple-touch-icon"[^>]*>/g,
    `<link rel="apple-touch-icon" href="${branding.icon}">`
  );
  
  result = result.replace(
    /<meta name="theme-color" content="[^"]*">/g,
    `<meta name="theme-color" content="${branding.themeColor}">`
  );
  
  result = result.replace(
    /<meta name="apple-mobile-web-app-title" content="[^"]*">/g,
    `<meta name="apple-mobile-web-app-title" content="${branding.title}">`
  );
  
  return result;
}

function injectRestaurantBranding(html: string, restaurant: { name: string; slug: string; logoUrl?: string | null; primaryColor?: string | null; address?: string | null; phone?: string | null; description?: string | null; }, pageType: "menu" | "welcome" = "menu", baseUrl: string = ""): string {
  let result = html;

  const manifestUrl = `/api/restaurants/${restaurant.slug}/manifest.json?page=${pageType}`;
  result = result.replace(
    /<link rel="manifest" href="[^"]*">/g,
    `<link rel="manifest" href="${manifestUrl}">`
  );

  const iconUrl = restaurant.logoUrl || "/icon-customer-512.png";
  result = result.replace(
    /<link rel="apple-touch-icon"[^>]*>/g,
    `<link rel="apple-touch-icon" href="${iconUrl}">`
  );

  const escapedName = restaurant.name.replace(/"/g, '&quot;');
  const seoDescription = (restaurant as any).description
    ? String((restaurant as any).description).replace(/"/g, '&quot;').substring(0, 160)
    : `${escapedName} - Order food online, view our menu, book a table. Fast delivery and collection available.`;
  const seoAddress = (restaurant as any).address ? String((restaurant as any).address).replace(/"/g, '&quot;') : "";
  const seoPhone = (restaurant as any).phone ? String((restaurant as any).phone).replace(/"/g, '&quot;') : "";

  const canonicalPath = pageType === "welcome" ? `/${restaurant.slug}/welcome` : `/${restaurant.slug}/menu`;
  const absoluteCanonical = baseUrl ? `${baseUrl}${canonicalPath}` : canonicalPath;
  const absoluteMenuUrl = baseUrl ? `${baseUrl}/${restaurant.slug}/menu` : `/${restaurant.slug}/menu`;
  const absoluteLogoUrl = restaurant.logoUrl
    ? (restaurant.logoUrl.startsWith("http") ? restaurant.logoUrl : `${baseUrl}${restaurant.logoUrl}`)
    : (baseUrl ? `${baseUrl}/link24-icon.png` : "/link24-icon.png");

  result = result.replace(
    /<meta name="apple-mobile-web-app-title" content="[^"]*">/g,
    `<meta name="apple-mobile-web-app-title" content="${escapedName}">`
  );

  if (restaurant.primaryColor) {
    result = result.replace(
      /<meta name="theme-color" content="[^"]*">/g,
      `<meta name="theme-color" content="${restaurant.primaryColor}">`
    );
  }

  result = result.replace(
    /<meta property="og:title" content="[^"]*" \/>/g,
    `<meta property="og:title" content="${escapedName} - Online Menu & Ordering" />`
  );
  result = result.replace(
    /<meta property="og:description" content="[^"]*" \/>/g,
    `<meta property="og:description" content="${seoDescription}" />`
  );
  result = result.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/g,
    `<meta name="twitter:title" content="${escapedName}" />`
  );
  result = result.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/g,
    `<meta name="twitter:description" content="${seoDescription}" />`
  );

  result = result.replace(
    /<meta property="og:image" content="[^"]*" \/>/g,
    `<meta property="og:image" content="${absoluteLogoUrl}" />`
  );
  result = result.replace(
    /<meta name="twitter:image" content="[^"]*" \/>/g,
    `<meta name="twitter:image" content="${absoluteLogoUrl}" />`
  );

  const seoMetaTags = `
    <meta name="description" content="${seoDescription}" />
    <meta name="keywords" content="${escapedName}, restaurant, food delivery, online menu, order food, takeaway, ${seoAddress ? seoAddress + ', ' : ''}food near me" />
    <meta property="og:type" content="restaurant" />
    <meta property="og:locale" content="en_GB" />
    <link rel="canonical" href="${absoluteCanonical}" />
  `;

  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": restaurant.name,
    "description": seoDescription.replace(/&quot;/g, '"'),
    "url": absoluteCanonical,
    "hasMenu": {
      "@type": "Menu",
      "url": absoluteMenuUrl
    }
  };
  if (seoAddress) structuredData.address = { "@type": "PostalAddress", "streetAddress": seoAddress.replace(/&quot;/g, '"') };
  if (seoPhone) structuredData.telephone = seoPhone.replace(/&quot;/g, '"');
  if (absoluteLogoUrl) structuredData.image = absoluteLogoUrl;

  const jsonLd = `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;

  result = result.replace('</head>', `${seoMetaTags}\n${jsonLd}\n  </head>`);

  if (result.includes('<title>')) {
    result = result.replace(/<title>[^<]*<\/title>/g, `<title>${escapedName} - Menu, Order Online & Book a Table</title>`);
  } else {
    result = result.replace('</head>', `  <title>${escapedName} - Menu, Order Online & Book a Table</title>\n  </head>`);
  }

  return result;
}

async function getRestaurantByDomain(hostname: string) {
  const normalizeDomain = (d: string) => d.toLowerCase().trim().replace(/\.$/, '').replace(/^www\./, '');
  const cleanHost = normalizeDomain(hostname);
  
  const isSubdomain = cleanHost.endsWith('.link24.online') && 
    cleanHost !== 'link24.online' && 
    cleanHost !== 'www.link24.online';
  const isCustomDomain = !cleanHost.includes('replit') && 
    !cleanHost.includes('localhost') && 
    !cleanHost.includes('127.0.0.1') &&
    cleanHost !== 'link24.online' &&
    cleanHost !== 'www.link24.online' &&
    !isSubdomain &&
    cleanHost.length > 0;
  
  if (!isSubdomain && !isCustomDomain) return null;
  
  const restaurants = await storage.getAllRestaurants();
  return restaurants.find((r: any) => {
    const customDomain = r.customDomain;
    if (!customDomain) return false;
    const storedDomain = normalizeDomain(customDomain);
    return storedDomain === cleanHost;
  }) || null;
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(async (req, res, next) => {
    if (req.method !== 'GET') return next();
    const urlPath = req.path;
    if (urlPath !== '/' && urlPath !== '/index.html') return next();
    
    try {
      const hostname = (req.hostname || (req.headers.host || '').replace(/:\d+$/, '')).toLowerCase().replace(/\.$/, '');
      const restaurant = await getRestaurantByDomain(hostname);
      if (restaurant) {
        const indexPath = path.resolve(distPath, "index.html");
        const html = fs.readFileSync(indexPath, "utf-8");
        const reqBaseUrl = `${req.protocol}://${req.get("host")}`;
        const modifiedHtml = injectRestaurantBranding(html, restaurant, "welcome", reqBaseUrl);
        res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache, no-store, must-revalidate" }).send(modifiedHtml);
        return;
      }
    } catch (e) {
    }
    next();
  });

  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  app.use("*", async (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const urlPath = req.originalUrl.split('?')[0];
    
    if (PWA_BRANDING[urlPath]) {
      const html = fs.readFileSync(indexPath, "utf-8");
      const modifiedHtml = injectPwaBranding(html, urlPath);
      res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache, no-store, must-revalidate" }).send(modifiedHtml);
      return;
    }

    const reqBaseUrl = `${req.protocol}://${req.get("host")}`;

    const menuMatch = urlPath.match(/^\/menu\/([^/]+)/);
    if (menuMatch) {
      try {
        const slug = menuMatch[1];
        const restaurant = await storage.getRestaurantBySlug(slug);
        if (restaurant) {
          const html = fs.readFileSync(indexPath, "utf-8");
          const modifiedHtml = injectRestaurantBranding(html, restaurant, "menu", reqBaseUrl);
          res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache, no-store, must-revalidate" }).send(modifiedHtml);
          return;
        }
      } catch (e) {
      }
    }

    const welcomeMatch = urlPath.match(/^\/(r|restaurant)\/([^/]+)/);
    if (welcomeMatch) {
      try {
        const slug = welcomeMatch[2];
        const restaurant = await storage.getRestaurantBySlug(slug);
        if (restaurant) {
          const html = fs.readFileSync(indexPath, "utf-8");
          const modifiedHtml = injectRestaurantBranding(html, restaurant, "welcome", reqBaseUrl);
          res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache, no-store, must-revalidate" }).send(modifiedHtml);
          return;
        }
      } catch (e) {
      }
    }

    const slugWelcomeMatch = urlPath.match(/^\/([a-z0-9-]+)\/(welcome|menu)/);
    if (slugWelcomeMatch) {
      try {
        const slug = slugWelcomeMatch[1];
        const pageType = slugWelcomeMatch[2] === "menu" ? "menu" : "welcome";
        const restaurant = await storage.getRestaurantBySlug(slug);
        if (restaurant) {
          const html = fs.readFileSync(indexPath, "utf-8");
          const modifiedHtml = injectRestaurantBranding(html, restaurant, pageType as "menu" | "welcome", reqBaseUrl);
          res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache, no-store, must-revalidate" }).send(modifiedHtml);
          return;
        }
      } catch (e) {
      }
    }

    try {
      const hostname = (req.hostname || (req.headers.host || '').replace(/:\d+$/, '')).toLowerCase().replace(/\.$/, '');
      const restaurant = await getRestaurantByDomain(hostname);
      if (restaurant) {
        const html = fs.readFileSync(indexPath, "utf-8");
        const modifiedHtml = injectRestaurantBranding(html, restaurant, "welcome", reqBaseUrl);
        res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache, no-store, must-revalidate" }).send(modifiedHtml);
        return;
      }
    } catch (e) {
    }

    const html = fs.readFileSync(indexPath, "utf-8");
    res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-cache, no-store, must-revalidate" }).send(html);
  });
}
