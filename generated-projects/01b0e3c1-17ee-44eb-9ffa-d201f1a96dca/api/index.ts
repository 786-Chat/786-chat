import type { Request, Response } from "express";
import { app, ready } from "../server/index";

export default async function handler(req: Request, res: Response) {
  await ready;
  return app(req, res);
}
