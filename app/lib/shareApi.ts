export interface ShareResponse {
  shareId: string;
  shareUrl: string;
  imageUrl: string;
}

export async function uploadShareImage(
  imageBlob: Blob,
  sentence: string,
  options?: { words?: string[] }
): Promise<ShareResponse> {
  const formData = new FormData();
  if (options?.words) {
    formData.append("words", JSON.stringify(options.words));
  }
  formData.append("image", imageBlob, "sentence-cube.png");
  formData.append("sentence", sentence);

  const response = await fetch("/api/share", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "Unknown error";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      const errorText = await response.text().catch(() => "Unknown error");
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
