import type { CopilotChartSpec } from "@/copilot/types/copilot";
import { downloadCsv } from "@/lib/exports";

const SAVED_CHARTS_KEY = "bioinsights-saved-charts";

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "chart";
}

function inlineSvgStyles(svg: SVGSVGElement, sourceSvg: SVGSVGElement) {
  const computedSvg = window.getComputedStyle(sourceSvg);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  svg.style.background = computedSvg.backgroundColor || "#ffffff";

  const sourceNodes = Array.from(sourceSvg.querySelectorAll<SVGElement>("*"));
  const clonedNodes = Array.from(svg.querySelectorAll<SVGElement>("*"));

  clonedNodes.forEach((node, index) => {
    const sourceNode = sourceNodes[index];
    if (!sourceNode) return;
    const computed = window.getComputedStyle(sourceNode);
    const style = [
      ["fill", computed.fill],
      ["stroke", computed.stroke],
      ["stroke-width", computed.strokeWidth],
      ["stroke-linecap", computed.strokeLinecap],
      ["stroke-linejoin", computed.strokeLinejoin],
      ["stroke-dasharray", computed.strokeDasharray],
      ["font-size", computed.fontSize],
      ["font-family", computed.fontFamily],
      ["font-weight", computed.fontWeight],
      ["letter-spacing", computed.letterSpacing],
      ["opacity", computed.opacity],
    ]
      .filter(([, value]) => value && value !== "normal")
      .map(([key, value]) => `${key}:${value}`)
      .join(";");

    if (style) {
      node.setAttribute("style", style);
    }

    if (computed.fill && computed.fill !== "none") {
      node.setAttribute("fill", computed.fill);
    }
    if (computed.stroke && computed.stroke !== "none") {
      node.setAttribute("stroke", computed.stroke);
    }
    if (computed.strokeWidth && computed.strokeWidth !== "0px") {
      node.setAttribute("stroke-width", computed.strokeWidth);
    }
  });
}

function serializeChartSvg(container: HTMLElement) {
  const sourceSvg = container.querySelector("svg");
  if (!sourceSvg) {
    throw new Error("Chart image is not ready yet.");
  }

  const clonedSvg = sourceSvg.cloneNode(true) as SVGSVGElement;
  const svgRect = sourceSvg.getBoundingClientRect();
  const width = Math.max(1, Math.round(svgRect.width));
  const height = Math.max(1, Math.round(svgRect.height));
  const sourceViewBox = sourceSvg.getAttribute("viewBox");

  clonedSvg.setAttribute("width", String(width));
  clonedSvg.setAttribute("height", String(height));
  if (sourceViewBox) {
    clonedSvg.setAttribute("viewBox", sourceViewBox);
  } else {
    clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
  clonedSvg.setAttribute("preserveAspectRatio", sourceSvg.getAttribute("preserveAspectRatio") ?? "xMidYMid meet");

  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  background.setAttribute("fill", "#fffaf3");
  clonedSvg.insertBefore(background, clonedSvg.firstChild);

  inlineSvgStyles(clonedSvg, sourceSvg);
  return {
    serialized: new XMLSerializer().serializeToString(clonedSvg),
    width,
    height,
  };
}

export function downloadChartCsv(chart: CopilotChartSpec) {
  const rows = chart.data.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === "number" ? value : String(value)])),
  );
  downloadCsv(`${sanitizeFilename(chart.title)}.csv`, rows);
}

export function downloadChartSvg(chart: CopilotChartSpec, container: HTMLElement) {
  const { serialized } = serializeChartSvg(container);
  triggerDownload(`${sanitizeFilename(chart.title)}.svg`, new Blob([serialized], { type: "image/svg+xml;charset=utf-8" }));
}

export async function downloadChartPng(chart: CopilotChartSpec, container: HTMLElement) {
  const { serialized, width, height } = serializeChartSvg(container);
  const image = new Image();
  const svgUrl = URL.createObjectURL(new Blob([serialized], { type: "image/svg+xml;charset=utf-8" }));

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not render chart image."));
      image.src = svgUrl;
    });

    const scale = Math.max(window.devicePixelRatio || 2, 2);
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("PNG export is not supported in this browser.");
    }

    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.fillStyle = "#fffaf3";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      throw new Error("Could not generate the PNG file.");
    }

    triggerDownload(`${sanitizeFilename(chart.title)}.png`, blob);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function saveChartSnapshot(chart: CopilotChartSpec) {
  if (typeof window === "undefined") return 0;

  const existing = window.localStorage.getItem(SAVED_CHARTS_KEY);
  const saved = existing ? (JSON.parse(existing) as Array<CopilotChartSpec & { savedAt: string }>) : [];
  const next = [{ ...chart, savedAt: new Date().toISOString() }, ...saved].slice(0, 20);
  window.localStorage.setItem(SAVED_CHARTS_KEY, JSON.stringify(next));
  return next.length;
}
