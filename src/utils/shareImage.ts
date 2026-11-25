export async function shareOrSaveDataUrl(
  dataUrl: string,
  filename: string,
  title: string,
  text: string,
): Promise<void> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const mime = blob.type || "image/png";
  const file = new File([blob], filename, { type: mime });

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
    }
  }

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
