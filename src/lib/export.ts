import { toPng, toSvg } from "html-to-image";

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function downloadText(text: string, filename: string, mime = "application/json") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportElementPng(el: HTMLElement, filename: string) {
  const dataUrl = await toPng(el, { backgroundColor: "#ffffff", pixelRatio: 2 });
  triggerDownload(dataUrl, filename);
}

export async function exportElementSvg(el: HTMLElement, filename: string) {
  const dataUrl = await toSvg(el, { backgroundColor: "#ffffff" });
  triggerDownload(dataUrl, filename);
}

export function downloadSvgString(svg: string, filename: string) {
  downloadText(svg, filename, "image/svg+xml");
}

export function pngFromSvgString(svg: string, filename: string) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width || 1200;
    canvas.height = img.height || 800;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      triggerDownload(canvas.toDataURL("image/png"), filename);
    }
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "diagram";
}
