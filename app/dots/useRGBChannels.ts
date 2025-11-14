import { useState, useEffect } from "react";

export function useRGBChannels(imageUrl: string) {
  const [channels, setChannels] = useState<{
    red: string;
    green: string;
    blue: string;
  } | null>(null);

  useEffect(() => {
    const extractRGBChannels = (url: string) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const redData = new ImageData(canvas.width, canvas.height);
        const greenData = new ImageData(canvas.width, canvas.height);
        const blueData = new ImageData(canvas.width, canvas.height);

        for (let i = 0; i < data.length; i += 4) {
          redData.data[i] = data[i];
          redData.data[i + 1] = 0;
          redData.data[i + 2] = 0;
          redData.data[i + 3] = 255;

          greenData.data[i] = 0;
          greenData.data[i + 1] = data[i + 1];
          greenData.data[i + 2] = 0;
          greenData.data[i + 3] = 255;

          blueData.data[i] = 0;
          blueData.data[i + 1] = 0;
          blueData.data[i + 2] = data[i + 2];
          blueData.data[i + 3] = 255;
        }

        const createDataUrl = (imgData: ImageData) => {
          ctx.putImageData(imgData, 0, 0);
          return canvas.toDataURL();
        };

        setChannels({
          red: createDataUrl(redData),
          green: createDataUrl(greenData),
          blue: createDataUrl(blueData),
        });
      };

      img.src = url;
    };

    extractRGBChannels(imageUrl);
  }, [imageUrl]);

  return channels;
}

