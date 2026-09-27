import path from "path";
import { createServer as createViteServer } from "vite";
import express from "express";
import { app } from "./serverApp";

const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: any, res: any) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Khảo Thí Thông Minh] Server đang chạy tại http://0.0.0.0:${PORT}`);
  });
}

startServer();
