import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function imageToVideo(imagePath, title, description, outputPath) {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error("La imagen de entrada no existe.");
    }

    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const imageWidth = metadata.width;
    const imageHeight = metadata.height;

    // Obtener el brillo promedio de la imagen para determinar el color del texto
    const { dominant } = await image.stats();
    const brightness = (dominant.r + dominant.g + dominant.b) / 3;
    const textColor = brightness > 128 ? "black" : "white";

    const padding = 40;
    const lineSpacing = 10;
    const maxTitleSize = 80;
    const descriptionSize = 40;

    // Ajustar dinámicamente el tamaño del título para que no se salga
    const { fontSize: titleSize, lines: wrappedTitle } = adjustFontSizeToFit(
      title,
      imageWidth - 2 * padding,
      maxTitleSize,
    );

    const wrappedDescription = description
      .split("\n")
      .flatMap((descLine) =>
        wrapText(descLine, imageWidth - 2 * padding, descriptionSize),
      );

    const descriptionBlockHeight =
      wrappedDescription.length * descriptionSize +
      (wrappedDescription.length - 1) * lineSpacing;

    const descriptionTopY = (imageHeight - descriptionBlockHeight) / 2;
    let descriptionY = descriptionTopY + descriptionSize;
    const titleY =
      descriptionTopY -
      (wrappedTitle.length - 1) * (titleSize + lineSpacing) -
      titleSize;

    let svgOverlay = `
      <svg width="${imageWidth}" height="${imageHeight}">
        <style>
          .title { font: bold ${titleSize}px sans-serif; fill: ${textColor}; text-anchor: middle; }
          .description { font: bold ${descriptionSize}px sans-serif; fill: ${textColor}; text-anchor: start; }
        </style>
    `;

    wrappedTitle.forEach((line, index) => {
      svgOverlay += `<text x="${imageWidth / 2}" y="${titleY + index * (titleSize + lineSpacing)}" class="title">${line}</text>`;
    });

    wrappedDescription.forEach((line) => {
      svgOverlay += `<text x="${padding}" y="${descriptionY}" class="description">${line}</text>`;
      descriptionY += descriptionSize + lineSpacing;
    });

    svgOverlay += `</svg>`;

    const editedImagePath = path.join(__dirname, "temp_image.png");
    await sharp(imagePath)
      .composite([{ input: Buffer.from(svgOverlay), blend: "over" }])
      .toFormat("png")
      .toFile(editedImagePath);

    const videoOutput = outputPath.endsWith(".mp4")
      ? outputPath
      : `${outputPath}.mp4`;
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(editedImagePath)
        .loop(5)
        .fps(30)
        .output(videoOutput)
        .on("start", (commandLine) =>
          console.log("Spawned ffmpeg with command:", commandLine),
        )
        .on("stderr", (stderrLine) =>
          console.error("ffmpeg stderr:", stderrLine),
        )
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    fs.unlinkSync(editedImagePath);
    console.log("Video generado con éxito:", videoOutput);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function wrapText(text, maxWidth, fontSize) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = testLine.length * (fontSize * 0.6);

    if (testWidth > maxWidth && currentLine !== "") {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function adjustFontSizeToFit(text, maxWidth, maxFontSize, minFontSize = 20) {
  let fontSize = maxFontSize;

  while (fontSize >= minFontSize) {
    const lines = wrapText(text, maxWidth, fontSize);
    const maxLineWidth = Math.max(
      ...lines.map((line) => line.length * fontSize * 0.6),
    );
    if (maxLineWidth <= maxWidth) {
      return { fontSize, lines };
    }
    fontSize -= 2;
  }

  // Si nada funciona, devuelve el mínimo
  return {
    fontSize: minFontSize,
    lines: wrapText(text, maxWidth, minFontSize),
  };
}
