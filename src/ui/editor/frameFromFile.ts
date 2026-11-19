/**
 * Turns a dropped image or video file into a still image for the preview background.
 * For a video, grabs the frame at 1 s (or the middle of short clips).
 */
export async function stillFromFile(file: File): Promise<ImageBitmap | HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    }
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = url;
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('video'));
      });
      video.currentTime = Math.min(1, (video.duration || 2) / 2);
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error('video'));
      });
      return await createImageBitmap(video);
    }
    throw new Error('type');
  } finally {
    URL.revokeObjectURL(url);
  }
}
