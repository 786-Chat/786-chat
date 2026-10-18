import express from "express";
import * as runtime from "./dist/index.cjs";

void express;

export default (runtime as any).app;
