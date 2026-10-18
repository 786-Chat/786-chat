import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { insertDeviceBrandSchema, insertDeviceCustomerSchema, insertDeviceSchema, insertDeviceGroupSchema, insertDeviceScheduleSchema } from "@shared/schema";
import * as tuyaService from "./tuya-service";

export function registerDeviceRoutes(app: Express) {
  // ===================== DEVICE BRANDS =====================
  app.get("/api/device-brands", async (_req, res) => {
    try {
      const brands = await storage.getAllDeviceBrands();
      res.json(brands);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/device-brands/:id", async (req, res) => {
    try {
      const brand = await storage.getDeviceBrand(req.params.id);
      if (!brand) return res.status(404).json({ error: "Brand not found" });
      res.json(brand);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/device-brands/by-slug/:slug", async (req, res) => {
    try {
      const brand = await storage.getDeviceBrandBySlug(req.params.slug);
      if (!brand) return res.status(404).json({ error: "Brand not found" });
      res.json(brand);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/device-brands", async (req, res) => {
    try {
      const data = insertDeviceBrandSchema.parse(req.body);
      const brand = await storage.createDeviceBrand(data);
      res.json(brand);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/device-brands/:id", async (req, res) => {
    try {
      const brand = await storage.updateDeviceBrand(req.params.id, req.body);
      if (!brand) return res.status(404).json({ error: "Brand not found" });
      res.json(brand);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/device-brands/:id", async (req, res) => {
    try {
      await storage.deleteDeviceBrand(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Brand login
  app.post("/api/device-brands/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const brands = await storage.getAllDeviceBrands();
      const brand = brands.find(b => b.adminUsername === username && b.adminPassword === password);
      if (!brand) return res.status(401).json({ error: "Invalid credentials" });
      const { adminPassword: _, ...safeBrand } = brand;
      res.json(safeBrand);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================== DEVICE CUSTOMERS =====================
  app.get("/api/device-brands/:brandId/customers", async (req, res) => {
    try {
      const customers = await storage.getDeviceCustomersByBrand(req.params.brandId);
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/device-customers/:id", async (req, res) => {
    try {
      const customer = await storage.getDeviceCustomer(req.params.id);
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/device-customers", async (req, res) => {
    try {
      const data = insertDeviceCustomerSchema.parse(req.body);
      const customer = await storage.createDeviceCustomer(data);
      res.json(customer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/device-customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateDeviceCustomer(req.params.id, req.body);
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/device-customers/:id", async (req, res) => {
    try {
      await storage.deleteDeviceCustomer(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Customer login
  app.post("/api/device-customers/login", async (req, res) => {
    try {
      const { username, password, brandSlug } = req.body;
      const brand = await storage.getDeviceBrandBySlug(brandSlug);
      if (!brand) return res.status(404).json({ error: "Brand not found" });
      const customer = await storage.getDeviceCustomerByLogin(username, brand.id);
      if (!customer || customer.loginPassword !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (!customer.isActive) {
        return res.status(403).json({ error: "Account disabled" });
      }
      res.json({ customer, brand });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================== DEVICES =====================
  app.get("/api/device-brands/:brandId/devices", async (req, res) => {
    try {
      const devices = await storage.getDevicesByBrand(req.params.brandId);
      res.json(devices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/device-customers/:customerId/devices", async (req, res) => {
    try {
      const devices = await storage.getDevicesByCustomer(req.params.customerId);
      res.json(devices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/devices/:id", async (req, res) => {
    try {
      const device = await storage.getDevice(req.params.id);
      if (!device) return res.status(404).json({ error: "Device not found" });
      res.json(device);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/devices", async (req, res) => {
    try {
      const data = insertDeviceSchema.parse(req.body);
      const existing = await storage.getDeviceBySerial(data.serialNumber, data.brandId);
      if (existing) return res.status(409).json({ error: "Device with this serial number already exists" });
      const device = await storage.createDevice(data);
      res.json(device);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/devices/:id", async (req, res) => {
    try {
      const device = await storage.updateDevice(req.params.id, req.body);
      if (!device) return res.status(404).json({ error: "Device not found" });
      res.json(device);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/devices/:id", async (req, res) => {
    try {
      await storage.deleteDevice(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================== DEVICE GROUPS =====================
  app.get("/api/device-brands/:brandId/groups", async (req, res) => {
    try {
      const groups = await storage.getDeviceGroups(req.params.brandId);
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/device-customers/:customerId/groups", async (req, res) => {
    try {
      const groups = await storage.getDeviceGroupsByCustomer(req.params.customerId);
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/device-groups", async (req, res) => {
    try {
      const data = insertDeviceGroupSchema.parse(req.body);
      const group = await storage.createDeviceGroup(data);
      res.json(group);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/device-groups/:id", async (req, res) => {
    try {
      const group = await storage.updateDeviceGroup(req.params.id, req.body);
      if (!group) return res.status(404).json({ error: "Group not found" });
      res.json(group);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/device-groups/:id", async (req, res) => {
    try {
      await storage.deleteDeviceGroup(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================== DEVICE SCHEDULES =====================
  app.get("/api/devices/:deviceId/schedules", async (req, res) => {
    try {
      const schedules = await storage.getDeviceSchedules(req.params.deviceId);
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/device-schedules", async (req, res) => {
    try {
      const data = insertDeviceScheduleSchema.parse(req.body);
      const schedule = await storage.createDeviceSchedule(data);
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/device-schedules/:id", async (req, res) => {
    try {
      const schedule = await storage.updateDeviceSchedule(req.params.id, req.body);
      if (!schedule) return res.status(404).json({ error: "Schedule not found" });
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/device-schedules/:id", async (req, res) => {
    try {
      await storage.deleteDeviceSchedule(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================== TUYA IOT API =====================
  app.get("/api/tuya/test-connection", async (_req, res) => {
    try {
      const result = await tuyaService.testConnection();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/tuya/status", async (_req, res) => {
    const hasCredentials = !!(process.env.TUYA_ACCESS_ID && process.env.TUYA_ACCESS_SECRET);
    res.json({
      configured: hasCredentials,
      accessId: hasCredentials ? process.env.TUYA_ACCESS_ID!.substring(0, 6) + "..." : null,
      dataCenter: "Central Europe",
    });
  });

  app.get("/api/tuya/devices", async (_req, res) => {
    try {
      const result = await tuyaService.getAllTuyaDevices();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, msg: error.message });
    }
  });

  app.get("/api/tuya/devices/:deviceId", async (req, res) => {
    try {
      const result = await tuyaService.getDeviceInfo(req.params.deviceId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, msg: error.message });
    }
  });

  app.get("/api/tuya/devices/:deviceId/status", async (req, res) => {
    try {
      const result = await tuyaService.getDeviceStatus(req.params.deviceId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, msg: error.message });
    }
  });

  app.get("/api/tuya/devices/:deviceId/specifications", async (req, res) => {
    try {
      const result = await tuyaService.getDeviceSpecifications(req.params.deviceId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, msg: error.message });
    }
  });

  app.post("/api/tuya/devices/:deviceId/commands", async (req, res) => {
    try {
      const { commands } = req.body;
      const result = await tuyaService.sendDeviceCommands(req.params.deviceId, commands);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, msg: error.message });
    }
  });
}
