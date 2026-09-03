// 786.Chat/Vercel Node entrypoint for the imported Express application.
// The direct Express import lets Vercel detect this generated runtime correctly.
import express from "express"
import { app } from "./server/index"

void express

export default app
