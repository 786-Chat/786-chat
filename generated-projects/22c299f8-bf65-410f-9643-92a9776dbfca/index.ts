// 786.Chat/Vercel Node entrypoint for the imported Express application.
// Keep an explicit Express import here so Vercel's Express detector recognises
// this root entrypoint while the real application continues to boot in server/index.ts.
import express from "express";
void express;
import "./server/index";
