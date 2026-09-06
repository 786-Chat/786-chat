import type { Express, Request, Response } from "express";
import { db } from "./db";
import { displayMenus, displaySlides, displaySections, displayItems } from "@shared/schema";
import { eq, asc, and } from "drizzle-orm";

export function registerDisplayMenuRoutes(app: Express): void {

  // ============ DISPLAY MENUS ============
  app.get("/api/display-menus/:branchId", async (req: Request, res: Response) => {
    try {
      const menus = await db.select().from(displayMenus).where(eq(displayMenus.branchId, req.params.branchId)).orderBy(asc(displayMenus.createdAt));
      res.json(menus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch display menus" });
    }
  });

  app.post("/api/display-menus", async (req: Request, res: Response) => {
    try {
      const { branchId, name, orientation, slideDuration, tvSize } = req.body;
      if (!branchId || !name || typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "Branch ID and name required" });
      if (orientation && !["landscape", "portrait"].includes(orientation)) return res.status(400).json({ error: "Invalid orientation" });
      if (slideDuration !== undefined && (typeof slideDuration !== "number" || slideDuration < 1 || slideDuration > 300)) return res.status(400).json({ error: "Slide duration must be 1-300 seconds" });
      const allowedSizes = ["32","42","50","55","65","75"];
      const [menu] = await db.insert(displayMenus).values({
        branchId, name: name.trim(), orientation: orientation || "landscape",
        slideDuration: slideDuration || 10,
        tvSize: tvSize && allowedSizes.includes(String(tvSize)) ? String(tvSize) : "55",
      }).returning();
      res.json(menu);
    } catch (error) {
      res.status(500).json({ error: "Failed to create display menu" });
    }
  });

  app.patch("/api/display-menus/:id", async (req: Request, res: Response) => {
    try {
      const updates: any = {};
      if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
      if (req.body.orientation !== undefined && ["landscape", "portrait"].includes(req.body.orientation)) updates.orientation = req.body.orientation;
      if (req.body.slideDuration !== undefined) updates.slideDuration = Math.max(1, Math.min(300, Number(req.body.slideDuration) || 10));
      if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
      if (req.body.tvSize !== undefined) updates.tvSize = String(req.body.tvSize);
      const [menu] = await db.update(displayMenus).set(updates).where(eq(displayMenus.id, req.params.id)).returning();
      if (!menu) return res.status(404).json({ error: "Menu not found" });
      res.json(menu);
    } catch (error) {
      res.status(500).json({ error: "Failed to update display menu" });
    }
  });

  app.delete("/api/display-menus/:id", async (req: Request, res: Response) => {
    try {
      await db.delete(displayMenus).where(eq(displayMenus.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete display menu" });
    }
  });

  // ============ SLIDES ============
  app.get("/api/display-slides/:menuId", async (req: Request, res: Response) => {
    try {
      const slides = await db.select().from(displaySlides).where(eq(displaySlides.menuId, req.params.menuId)).orderBy(asc(displaySlides.sortOrder));
      res.json(slides);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch slides" });
    }
  });

  app.post("/api/display-slides", async (req: Request, res: Response) => {
    try {
      const { menuId, name, sortOrder, bgType, bgColor, bgGradient, bgImageUrl, bgVideoUrl, bgMusicUrl, templateId, layoutColumns, showNumbers } = req.body;
      if (!menuId) return res.status(400).json({ error: "Menu ID required" });
      const [parentMenu] = await db.select().from(displayMenus).where(eq(displayMenus.id, menuId));
      if (!parentMenu) return res.status(404).json({ error: "Menu not found" });
      const [slide] = await db.insert(displaySlides).values({
        menuId, name: name || "New Slide", sortOrder: sortOrder || 0,
        bgType: bgType || "color", bgColor: bgColor || "#1a1a2e",
        bgGradient, bgImageUrl, bgVideoUrl, bgMusicUrl,
        templateId: templateId || "classic-dark", layoutColumns: layoutColumns || 3,
        showNumbers: showNumbers || false,
      }).returning();
      res.json(slide);
    } catch (error) {
      res.status(500).json({ error: "Failed to create slide" });
    }
  });

  app.patch("/api/display-slides/:id", async (req: Request, res: Response) => {
    try {
      const updates: any = {};
      const fields = ["name", "sortOrder", "bgType", "bgColor", "bgGradient", "bgImageUrl", "bgVideoUrl", "bgMusicUrl", "templateId", "layoutColumns", "showNumbers"];
      fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
      const [slide] = await db.update(displaySlides).set(updates).where(eq(displaySlides.id, req.params.id)).returning();
      if (!slide) return res.status(404).json({ error: "Slide not found" });
      res.json(slide);
    } catch (error) {
      res.status(500).json({ error: "Failed to update slide" });
    }
  });

  app.delete("/api/display-slides/:id", async (req: Request, res: Response) => {
    try {
      await db.delete(displaySlides).where(eq(displaySlides.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete slide" });
    }
  });

  // ============ SECTIONS ============
  app.get("/api/display-sections/:slideId", async (req: Request, res: Response) => {
    try {
      const sections = await db.select().from(displaySections).where(eq(displaySections.slideId, req.params.slideId)).orderBy(asc(displaySections.sortOrder));
      res.json(sections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  app.post("/api/display-sections", async (req: Request, res: Response) => {
    try {
      const { slideId, title, sortOrder, titleFont, titleSize, titleColor, titleBold, bgColor, borderColor } = req.body;
      if (!slideId || !title || typeof title !== "string" || !title.trim()) return res.status(400).json({ error: "Slide ID and title required" });
      const [parentSlide] = await db.select().from(displaySlides).where(eq(displaySlides.id, slideId));
      if (!parentSlide) return res.status(404).json({ error: "Slide not found" });
      const [section] = await db.insert(displaySections).values({
        slideId, title: title.trim(), sortOrder: sortOrder || 0, titleFont, titleSize, titleColor, titleBold, bgColor, borderColor,
      }).returning();
      res.json(section);
    } catch (error) {
      res.status(500).json({ error: "Failed to create section" });
    }
  });

  app.patch("/api/display-sections/:id", async (req: Request, res: Response) => {
    try {
      const updates: any = {};
      const fields = ["title", "sortOrder", "titleFont", "titleSize", "titleColor", "titleBold", "bgColor", "borderColor"];
      fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
      const [section] = await db.update(displaySections).set(updates).where(eq(displaySections.id, req.params.id)).returning();
      if (!section) return res.status(404).json({ error: "Section not found" });
      res.json(section);
    } catch (error) {
      res.status(500).json({ error: "Failed to update section" });
    }
  });

  app.delete("/api/display-sections/:id", async (req: Request, res: Response) => {
    try {
      await db.delete(displaySections).where(eq(displaySections.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete section" });
    }
  });

  // ============ ITEMS ============
  app.get("/api/display-items/:sectionId", async (req: Request, res: Response) => {
    try {
      const items = await db.select().from(displayItems).where(eq(displayItems.sectionId, req.params.sectionId)).orderBy(asc(displayItems.sortOrder));
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.post("/api/display-items", async (req: Request, res: Response) => {
    try {
      const { sectionId, name, price, description, imageUrl, sortOrder, nameFont, nameSize, nameColor, priceColor, priceSize, isFeatured, priceVariants } = req.body;
      if (!sectionId || !name) return res.status(400).json({ error: "Section ID and name required" });
      const [parentSection] = await db.select().from(displaySections).where(eq(displaySections.id, sectionId));
      if (!parentSection) return res.status(404).json({ error: "Section not found" });
      const [item] = await db.insert(displayItems).values({
        sectionId, name: String(name).trim(), price: String(price || "").trim(), description, imageUrl, sortOrder: sortOrder || 0,
        nameFont, nameSize, nameColor, priceColor, priceSize, isFeatured: Boolean(isFeatured),
        priceVariants: priceVariants || null,
      }).returning();
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  app.patch("/api/display-items/:id", async (req: Request, res: Response) => {
    try {
      const updates: any = {};
      const fields = ["name", "price", "description", "imageUrl", "sortOrder", "nameFont", "nameSize", "nameColor", "priceColor", "priceSize", "isFeatured", "priceVariants"];
      fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
      const [item] = await db.update(displayItems).set(updates).where(eq(displayItems.id, req.params.id)).returning();
      if (!item) return res.status(404).json({ error: "Item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  app.delete("/api/display-items/:id", async (req: Request, res: Response) => {
    try {
      await db.delete(displayItems).where(eq(displayItems.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // ============ PUBLIC TV DISPLAY ============
  app.get("/api/tv/:token", async (req: Request, res: Response) => {
    try {
      const [menu] = await db.select().from(displayMenus).where(
        and(eq(displayMenus.publicToken, req.params.token), eq(displayMenus.isActive, true))
      );
      if (!menu) return res.status(404).json({ error: "Display not found or inactive" });

      const slides = await db.select().from(displaySlides).where(eq(displaySlides.menuId, menu.id)).orderBy(asc(displaySlides.sortOrder));

      const slidesWithContent = await Promise.all(slides.map(async (slide) => {
        const sections = await db.select().from(displaySections).where(eq(displaySections.slideId, slide.id)).orderBy(asc(displaySections.sortOrder));
        const sectionsWithItems = await Promise.all(sections.map(async (section) => {
          const items = await db.select().from(displayItems).where(eq(displayItems.sectionId, section.id)).orderBy(asc(displayItems.sortOrder));
          return { ...section, items };
        }));
        return { ...slide, sections: sectionsWithItems };
      }));

      res.json({ menu, slides: slidesWithContent });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch TV display" });
    }
  });

  // ============ DUPLICATE MENU ============
  app.post("/api/display-menus/:id/duplicate", async (req: Request, res: Response) => {
    try {
      const [original] = await db.select().from(displayMenus).where(eq(displayMenus.id, req.params.id));
      if (!original) return res.status(404).json({ error: "Menu not found" });

      const [newMenu] = await db.insert(displayMenus).values({
        branchId: original.branchId,
        name: req.body.name || `${original.name} (Copy)`,
        orientation: original.orientation,
        slideDuration: original.slideDuration,
        tvSize: original.tvSize,
      }).returning();

      const origSlides = await db.select().from(displaySlides).where(eq(displaySlides.menuId, original.id)).orderBy(asc(displaySlides.sortOrder));
      for (const slide of origSlides) {
        const [newSlide] = await db.insert(displaySlides).values({
          menuId: newMenu.id, name: slide.name, sortOrder: slide.sortOrder,
          bgType: slide.bgType, bgColor: slide.bgColor, bgGradient: slide.bgGradient,
          bgImageUrl: slide.bgImageUrl, bgVideoUrl: slide.bgVideoUrl, bgMusicUrl: slide.bgMusicUrl,
          templateId: slide.templateId, layoutColumns: slide.layoutColumns,
        }).returning();

        const origSections = await db.select().from(displaySections).where(eq(displaySections.slideId, slide.id)).orderBy(asc(displaySections.sortOrder));
        for (const section of origSections) {
          const [newSection] = await db.insert(displaySections).values({
            slideId: newSlide.id, title: section.title, sortOrder: section.sortOrder,
            titleFont: section.titleFont, titleSize: section.titleSize, titleColor: section.titleColor,
            titleBold: section.titleBold, bgColor: section.bgColor, borderColor: section.borderColor,
          }).returning();

          const origItems = await db.select().from(displayItems).where(eq(displayItems.sectionId, section.id)).orderBy(asc(displayItems.sortOrder));
          for (const item of origItems) {
            await db.insert(displayItems).values({
              sectionId: newSection.id, name: item.name, price: item.price,
              description: item.description, imageUrl: item.imageUrl, sortOrder: item.sortOrder,
              nameFont: item.nameFont, nameSize: item.nameSize, nameColor: item.nameColor,
              priceColor: item.priceColor, priceSize: item.priceSize, isFeatured: item.isFeatured,
              priceVariants: item.priceVariants,
            });
          }
        }
      }

      res.json(newMenu);
    } catch (error) {
      console.error("Duplicate menu error:", error);
      res.status(500).json({ error: "Failed to duplicate menu" });
    }
  });

  // Get full menu data for editor
  app.get("/api/display-menu-full/:menuId", async (req: Request, res: Response) => {
    try {
      const [menu] = await db.select().from(displayMenus).where(eq(displayMenus.id, req.params.menuId));
      if (!menu) return res.status(404).json({ error: "Menu not found" });

      const slides = await db.select().from(displaySlides).where(eq(displaySlides.menuId, menu.id)).orderBy(asc(displaySlides.sortOrder));

      const slidesWithContent = await Promise.all(slides.map(async (slide) => {
        const sections = await db.select().from(displaySections).where(eq(displaySections.slideId, slide.id)).orderBy(asc(displaySections.sortOrder));
        const sectionsWithItems = await Promise.all(sections.map(async (section) => {
          const items = await db.select().from(displayItems).where(eq(displayItems.sectionId, section.id)).orderBy(asc(displayItems.sortOrder));
          return { ...section, items };
        }));
        return { ...slide, sections: sectionsWithItems };
      }));

      res.json({ menu, slides: slidesWithContent });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch full menu" });
    }
  });
}