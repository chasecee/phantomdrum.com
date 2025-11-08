const sharp = require("sharp");
const { readdir, stat } = require("fs/promises");
const { join } = require("path");
const { existsSync, mkdirSync } = require("fs");

const inputDir = join(process.cwd(), "public/img");
const outputDir = join(process.cwd(), "public/img/optimized");

async function convertToWebP(inputPath, outputPath) {
  const stats = await stat(inputPath);
  const inputSize = stats.size;

  await sharp(inputPath).webp({ quality: 85, effort: 6 }).toFile(outputPath);

  const outputStats = await stat(outputPath);
  const outputSize = outputStats.size;
  const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);

  return {
    inputSize,
    outputSize,
    savings: parseFloat(savings),
  };
}

async function optimizeImages() {
  const imagesToOptimize = ["no-bg.png", "noise.png"];

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log("Optimizing images...\n");

  for (const imageName of imagesToOptimize) {
    const inputPath = join(inputDir, imageName);
    const outputPath = join(
      outputDir,
      imageName.replace(/\.(png|jpg|jpeg)$/i, ".webp")
    );

    if (!existsSync(inputPath)) {
      console.log(`⚠️  ${imageName} not found, skipping...`);
      continue;
    }

    try {
      const { inputSize, outputSize, savings } = await convertToWebP(
        inputPath,
        outputPath
      );
      console.log(`✓ ${imageName}`);
      console.log(
        `  ${(inputSize / 1024).toFixed(1)} KB → ${(outputSize / 1024).toFixed(
          1
        )} KB (${savings}% smaller)\n`
      );
    } catch (error) {
      console.error(`✗ Failed to convert ${imageName}:`, error);
    }
  }

  console.log("Done! Optimized images saved to public/img/optimized/");
}

optimizeImages().catch(console.error);
