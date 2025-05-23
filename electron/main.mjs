import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import isDev from "electron-is-dev";
import expressApp from "./backend/server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPRESS_PORT = 3001;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const frontendUrl = isDev
    ? "http://localhost:5173"
    : pathToFileURL(
        path.join(__dirname, "..", "dist", "index.html"),
      ).toString();

  mainWindow.loadURL(frontendUrl);
}

app.whenReady().then(() => {
  expressApp.listen(EXPRESS_PORT, () => {
    console.log(`Express server started on http://localhost:${EXPRESS_PORT}`);
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
