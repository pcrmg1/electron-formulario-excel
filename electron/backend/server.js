import express from "express";
import fs from "fs";
import path from "path";
import { imageToVideo } from "./video_generator.js";
import * as utils from "./utils.js";
import archiver from "archiver";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const originalGet = app.get.bind(app);
app.get = (path, ...handlers) => {
  console.log("Registering GET route:", path);
  return originalGet(path, ...handlers);
};

const originalUse = app.use.bind(app);
app.use = (path, ...handlers) => {
  if (typeof path === "string") {
    console.log("Registering USE middleware at:", path);
  } else {
    console.log("Registering USE middleware with no explicit path");
  }
  return originalUse(path, ...handlers);
};

app.use(express.json());
app.use(express.static("public"));
app.use(cors());

async function processVideosSequentially(info, template, outputDir) {
  for (let index = 0; index < info.length; index++) {
    const item = info[index];
    const imagePath = path.join(
      __dirname,
      "background-raw-images",
      `${template}.png`,
    );
    const outputhPath = path.join(outputDir, `${index + 1}.mp4`);
    await imageToVideo(imagePath, item.hook, item.desc, outputhPath);
  }
}

app.get("/public/:id", async (req, res) => {
  const { id } = req.params;
  const folderPath = path.join(__dirname, "public", id);

  if (!fs.existsSync(folderPath)) {
    return res.status(404).send("Folder not found");
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename=${id}.zip`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);

  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".mp4"));
  for (const file of files) {
    archive.file(path.join(folderPath, file), { name: file });
  }

  archive.finalize();
});

app.post("/make_videos", async (req, res) => {
  try {
    const { template, info, userData } = req.body;
    console.log({ template, info, userData });

    if (!template || !info || !Array.isArray(info)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    const outputDir = path.join(__dirname, "public", userData);
    fs.mkdirSync(outputDir, { recursive: true });
    console.log("Output directory created:", outputDir);

    await processVideosSequentially(info, template, outputDir);

    // After processing, list the files to confirm
    const generatedFiles = fs
      .readdirSync(outputDir)
      .filter((f) => f.endsWith(".mp4"));
    console.log("Generated video files:", generatedFiles);

    res.json({ message: "Videos procesados" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/verify_client", async (req, res) => {
  // Get user_id
  const { user_id } = req.body;

  console.log(user_id);

  let user;
  if (user_id.startsWith("new")) {
    user = await utils.findUser(user_id, "team");
    console.log(user);
    return res
      .status(200)
      .json({ user_id: user.id, user_name: user.name, source: "team" });
  } else {
    user = await utils.findUser(user_id, "clickup");
    console.log(user);
    return res.status(200).json({
      user_id: user.user_id,
      user_name: user.user_name,
      source: "clickup",
    });
  }
});

const frontendPath = path.join(__dirname, "../../dist");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

console.log("Registered Express routes:");
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(middleware.route.path);
  } else if (middleware.name === "router") {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log(handler.route.path);
      }
    });
  }
});

export default app;
