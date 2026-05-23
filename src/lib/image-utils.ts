/**
 * Resize image to ≤maxWidth and always return a data URL.
 * Always goes through canvas — avoids returning blob URLs that can't be split into base64.
 */
export async function resizeForUpload(imageUrl: string, maxWidth = 1600): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w)
        w = maxWidth
      }
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL("image/jpeg", 0.92))
    }
    img.src = imageUrl
  })
}

/** Convert a data URL to base64 string + mimeType. */
export function dataUrlToBase64(dataUrl: string): { base64: string; mimeType: string } {
  const [header, base64] = dataUrl.split(",")
  const mimeType = header.split(":")[1].split(";")[0]
  return { base64, mimeType }
}
