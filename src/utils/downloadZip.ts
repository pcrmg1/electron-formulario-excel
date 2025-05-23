import { BASE_URL } from "./base";

export async function downloadZip(folderId: string) {
  try {
    const response = await fetch(`${BASE_URL}/public/${folderId}`);

    if (!response.ok) throw new Error("Failed to download ZIP");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${folderId}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
  }
}
