import sharp from "sharp";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_ASPECT_RATIO = OG_WIDTH / OG_HEIGHT;

async function generateOGImage() {
  const inputPath = join(process.cwd(), "public/img/album-art.jpg");
  const outputPath = join(process.cwd(), "public/img/og-image.jpg");

  const image = sharp(inputPath);
  const metadata = await image.metadata();

  const inputAspectRatio = metadata.width / metadata.height;
  let cropWidth = metadata.width;
  let cropHeight = metadata.height;
  let left = 0;
  let top = 0;

  if (inputAspectRatio > OG_ASPECT_RATIO) {
    cropHeight = metadata.height;
    cropWidth = Math.round(metadata.height * OG_ASPECT_RATIO);
    left = Math.round((metadata.width - cropWidth) / 2);
  } else {
    cropWidth = metadata.width;
    cropHeight = Math.round(metadata.width / OG_ASPECT_RATIO);
    top = Math.round((metadata.height - cropHeight) / 2);
  }

  const buffer = await image
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(OG_WIDTH, OG_HEIGHT, {
      fit: "cover",
      position: "center",
    })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  await writeFile(outputPath, buffer);

  console.log(`Generated OG image: ${outputPath}`);
  console.log(`Dimensions: ${OG_WIDTH}x${OG_HEIGHT}px`);
  console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

generateOGImage().catch((error) => {
  console.error("Error generating OG image:", error);
  process.exit(1);
});

