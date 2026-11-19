/** Saves a Blob to the user's Downloads folder. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function downloadText(text: string, fileName: string, type = 'application/json'): void {
  downloadBlob(new Blob([text], { type }), fileName);
}

/** Reads a user-picked file as text (for project / brand kit imports). */
export function readFileAsText(file: File): Promise<string> {
  return file.text();
}

export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Lecture impossible'));
    reader.readAsDataURL(file);
  });
}
