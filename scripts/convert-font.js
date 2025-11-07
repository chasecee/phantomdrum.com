const fs = require("fs");
const path = require("path");
const fontkit = require("fontkit");

async function convertWoff2ToTtf(inputPath, outputPath) {
  try {
    console.log(`Reading font file: ${inputPath}`);
    const buffer = fs.readFileSync(inputPath);
    const font = fontkit.create(buffer);

    const familyName = font.familyName || "Space Mono";
    const subfamilyName = font.subfamilyName || "Regular";
    console.log(`Font loaded: ${familyName} ${subfamilyName}`);

    const ttfBuffer = font.toBuffer();
    fs.writeFileSync(outputPath, ttfBuffer);

    console.log(`✓ Successfully converted to: ${outputPath}`);
    console.log(`  File size: ${(ttfBuffer.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error(`Error converting font:`, error);
    throw error;
  }
}

async function main() {
  const fontsDir = path.join(__dirname, "..", "public", "fonts");
  const outputDir = path.join(__dirname, "..", "public", "fonts");

  const fontFiles = [
    {
      input: path.join(fontsDir, "space-mono-v17-latin-700.woff2"),
      output: path.join(outputDir, "space-mono-bold.ttf"),
    },
    {
      input: path.join(fontsDir, "space-mono-v17-latin-regular.woff2"),
      output: path.join(outputDir, "space-mono-regular.ttf"),
    },
  ];

  for (const { input, output } of fontFiles) {
    if (fs.existsSync(input)) {
      await convertWoff2ToTtf(input, output);
    } else {
      console.warn(`⚠ Font file not found: ${input}`);
    }
  }

  console.log("\n✓ Conversion complete!");
}

main().catch(console.error);
