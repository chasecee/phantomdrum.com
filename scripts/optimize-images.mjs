import sharp from "sharp";
import { readdir, stat, mkdir } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";

const inputDir = join(process.cwd(), "public/img");
const outputDir = join(process.cwd(), "public/img/optimized");
const supportedExtensions = new Set([".png", ".jpg", ".jpeg"]);

async function collectImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entryPath.startsWith(outputDir)) {
        continue;
      }
      files.push(...(await collectImages(entryPath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = extname(entry.name).toLowerCase();
    if (!extension || !supportedExtensions.has(extension)) {
      continue;
    }

    files.push({
      inputPath: entryPath,
      relativePath: relative(inputDir, entryPath),
    });
  }

  return files;
}

async function ensureDirectoryExists(filePath) {
  await mkdir(filePath, { recursive: true });
}

async function convertToWebP(inputPath, outputPath) {
  const inputStats = await stat(inputPath);

  await sharp(inputPath).webp({ quality: 85, effort: 6 }).toFile(outputPath);

  const outputStats = await stat(outputPath);
  const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

  return {
    input: inputStats.size,
    output: outputStats.size,
    savings: parseFloat(savings),
  };
}

function formatKilobytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function optimizeImages() {
  const images = await collectImages(inputDir);

  if (!images.length) {
    console.log("No source PNG or JPG assets found under public/img.");
    return;
  }

  await ensureDirectoryExists(outputDir);

  console.log(
    `Optimizing ${images.length} image${images.length === 1 ? "" : "s"}...\n`
  );

  for (const { inputPath, relativePath } of images) {
    const sanitizedPath = relativePath
      .replace(/\s+/g, "-")
      .replace(/\.(png|jpg|jpeg)$/i, ".webp");
    const outputPath = join(outputDir, sanitizedPath);

    await ensureDirectoryExists(dirname(outputPath));

    try {
      const { input, output, savings } = await convertToWebP(
        inputPath,
        outputPath
      );
      const label = relative(inputDir, inputPath);
      console.log(`✓ ${label}`);
      console.log(
        `  ${formatKilobytes(input)} → ${formatKilobytes(
          output
        )} (${savings}% smaller)\n`
      );
    } catch (error) {
      console.error(`✗ Failed to convert ${relativePath}:`, error);
    }
  }

  console.log("Done. Optimized assets are in public/img/optimized.");
}

optimizeImages().catch((error) => {
  console.error(error);
  process.exit(1);
});
