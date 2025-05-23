import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";
import expressApp from "./backend/server.js"; // Import Express app

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPRESS_PORT = 3001;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true, // if you need nodeIntegration, else set false
      contextIsolation: false,
    },
  });

  const frontendUrl = isDev
    ? "http://localhost:5173" // your Vite frontend dev server
    : `file://${path.join(__dirname, "renderer", "dist", "index.html")}`;

  mainWindow.loadURL(frontendUrl);
}

app.whenReady().then(() => {
  // Start Express server inside Electron main process
  expressApp.listen(EXPRESS_PORT, () => {
    console.log(`Express server started on http://localhost:${EXPRESS_PORT}`);
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
