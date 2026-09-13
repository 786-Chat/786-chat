import express from "express";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const runtime = require("./dist/index.cjs");

void express;

export default runtime.app;
