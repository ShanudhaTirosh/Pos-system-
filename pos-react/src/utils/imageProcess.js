/**
 * processImage — compress, resize and convert an image File to a WebP Base64 string.
 * Keeps Firestore documents well under the 1MB limit.
 *
 * @param {File}   file        — the raw File object from an <input type="file">
 * @param {number} maxWidth    — max pixel width of the output (default 800)
 * @param {number} quality     — WebP quality 0–1 (default 0.72)
 * @returns {Promise<string>}  — base64-encoded data URL  (data:image/webp;base64,...)
 */
export async function processImage(file, maxWidth = 800, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        // Calculate target dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width  = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fall back to JPEG for older Safari
        const webpData = canvas.toDataURL('image/webp', quality);
        if (webpData.startsWith('data:image/webp')) {
          resolve(webpData);
        } else {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * estimateBase64Size — rough byte size of a base64 string
 */
export function estimateBase64Size(base64) {
  const padding = (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  return (base64.length * 3) / 4 - padding;
}
