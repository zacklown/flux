"use client";

import Image from "next/image";
import Link from "next/link";
import { jsPDF } from "jspdf";
import {
  ChangeEvent,
  DragEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import profilePhoto from "@/app/photos/IMG_3224_square.jpg";
import styles from "./photo-editor-dashboard.module.css";

type RasterFormat = "image/jpeg" | "image/png" | "image/webp";
type ExportFormat = RasterFormat | "application/pdf" | "image/x-icon";
type CropRect = { x: number; y: number; width: number; height: number };
type DragMode = "move" | "nw" | "ne" | "sw" | "se";

type DragState = {
  mode: DragMode;
  pointerId: number;
  startX: number;
  startY: number;
  initialCrop: CropRect;
};

type FormatOption = {
  label: string;
  value: ExportFormat;
  enabled: boolean;
};

type RatioPreset = {
  label: string;
  width: number;
  height: number;
};

const formatOptions: FormatOption[] = [
  { label: "JPG", value: "image/jpeg", enabled: true },
  { label: "PNG", value: "image/png", enabled: true },
  { label: "WEBP", value: "image/webp", enabled: true },
  { label: "ICO", value: "image/x-icon", enabled: true },
  { label: "PDF", value: "application/pdf", enabled: true },
];

const ratioPresets: RatioPreset[] = [
  { label: "Original", width: 0, height: 0 },
  { label: "Square", width: 1, height: 1 },
  { label: "4:3", width: 4, height: 3 },
  { label: "3:4", width: 3, height: 4 },
  { label: "16:9", width: 16, height: 9 },
  { label: "9:16", width: 9, height: 16 },
];

const fullCropRect: CropRect = { x: 0, y: 0, width: 1, height: 1 };
const minCropSize = 0.08;

function extensionForFormat(format: ExportFormat) {
  switch (format) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    case "image/x-icon":
      return "ico";
    default:
      return "jpg";
  }
}

function formatName(format: ExportFormat) {
  switch (format) {
    case "application/pdf":
      return "PDF";
    case "image/jpeg":
      return "JPG";
    case "image/png":
      return "PNG";
    case "image/x-icon":
      return "ICO";
    default:
      return "WEBP";
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function megabytesFromBytes(size: number) {
  return size / (1024 * 1024);
}

function toFixedSize(value: number) {
  return value.toFixed(value >= 10 ? 0 : 1);
}

function cropPixels(source: { width: number; height: number }, cropRect: CropRect) {
  return {
    x: Math.round(source.width * cropRect.x),
    y: Math.round(source.height * cropRect.y),
    width: Math.max(1, Math.round(source.width * cropRect.width)),
    height: Math.max(1, Math.round(source.height * cropRect.height)),
  };
}

function normalizeCrop(nextCrop: CropRect) {
  const width = clamp(nextCrop.width, minCropSize, 1);
  const height = clamp(nextCrop.height, minCropSize, 1);
  const x = clamp(nextCrop.x, 0, 1 - width);
  const y = clamp(nextCrop.y, 0, 1 - height);
  return { x, y, width, height };
}

function fitCropToBounds(nextCrop: CropRect) {
  const crop = normalizeCrop(nextCrop);
  return {
    ...crop,
    x: clamp(crop.x, 0, 1 - crop.width),
    y: clamp(crop.y, 0, 1 - crop.height),
  };
}

function resizeCropFromCenter(
  cropRect: CropRect,
  source: { width: number; height: number },
  nextWidthPx?: number,
  nextHeightPx?: number,
  constrainProportions = true,
) {
  const currentAspectRatio = cropRect.width / cropRect.height;
  let nextWidth = nextWidthPx ? nextWidthPx / source.width : cropRect.width;
  let nextHeight = nextHeightPx ? nextHeightPx / source.height : cropRect.height;

  if (constrainProportions) {
    if (nextWidthPx && !nextHeightPx) {
      nextHeight = nextWidth / currentAspectRatio;
    }
    if (nextHeightPx && !nextWidthPx) {
      nextWidth = nextHeight * currentAspectRatio;
    }
  }

  nextWidth = clamp(nextWidth, minCropSize, 1);
  nextHeight = clamp(nextHeight, minCropSize, 1);

  const centerX = cropRect.x + cropRect.width / 2;
  const centerY = cropRect.y + cropRect.height / 2;

  return fitCropToBounds({
    x: centerX - nextWidth / 2,
    y: centerY - nextHeight / 2,
    width: nextWidth,
    height: nextHeight,
  });
}

function applyAspectRatioPreset(
  cropRect: CropRect,
  source: { width: number; height: number },
  ratioWidth: number,
  ratioHeight: number,
) {
  if (ratioWidth === 0 || ratioHeight === 0) {
    return fullCropRect;
  }

  const targetAspectRatio = ratioWidth / ratioHeight;
  const sourceAspectRatio = source.width / source.height;
  const cropPixelWidth = cropRect.width * source.width;
  const cropPixelHeight = cropRect.height * source.height;
  const cropArea = Math.max(1, cropPixelWidth * cropPixelHeight);

  let nextWidthPx = Math.sqrt(cropArea * targetAspectRatio);
  let nextHeightPx = nextWidthPx / targetAspectRatio;

  if (nextWidthPx > source.width) {
    nextWidthPx = source.width;
    nextHeightPx = nextWidthPx / targetAspectRatio;
  }

  if (nextHeightPx > source.height) {
    nextHeightPx = source.height;
    nextWidthPx = nextHeightPx * targetAspectRatio;
  }

  if (targetAspectRatio > sourceAspectRatio) {
    nextWidthPx = Math.min(nextWidthPx, source.width);
    nextHeightPx = nextWidthPx / targetAspectRatio;
  } else {
    nextHeightPx = Math.min(nextHeightPx, source.height);
    nextWidthPx = nextHeightPx * targetAspectRatio;
  }

  const centerX = cropRect.x + cropRect.width / 2;
  const centerY = cropRect.y + cropRect.height / 2;
  const nextWidth = clamp(nextWidthPx / source.width, minCropSize, 1);
  const nextHeight = clamp(nextHeightPx / source.height, minCropSize, 1);

  return fitCropToBounds({
    x: centerX - nextWidth / 2,
    y: centerY - nextHeight / 2,
    width: nextWidth,
    height: nextHeight,
  });
}

function Icon({ name }: { name: string }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "image":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="m21 16-5.5-5.5L6 20" />
        </svg>
      );
    case "file":
      return (
        <svg {...commonProps}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
        </svg>
      );
    case "upload":
      return (
        <svg {...commonProps}>
          <path d="M12 16V5" />
          <path d="m7 10 5-5 5 5" />
          <path d="M5 19h14" />
        </svg>
      );
    case "plus":
      return (
        <svg {...commonProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "minus":
      return (
        <svg {...commonProps}>
          <path d="M5 12h14" />
        </svg>
      );
    case "aspect":
      return (
        <svg {...commonProps}>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M8 10h8M8 14h5" />
        </svg>
      );
    case "compress":
      return (
        <svg {...commonProps}>
          <path d="M16 8h4V4" />
          <path d="m20 4-5 5" />
          <path d="M8 16H4v4" />
          <path d="m4 20 5-5" />
        </svg>
      );
    case "change":
      return (
        <svg {...commonProps}>
          <path d="M7 7h10l-3-3" />
          <path d="m17 17H7l3 3" />
          <path d="M17 7a7 7 0 0 1 0 10" />
          <path d="M7 17a7 7 0 0 1 0-10" />
        </svg>
      );
    case "help":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.1 9a3 3 0 1 1 5.4 1.8c-.6.8-1.5 1.2-1.9 2.2" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "download":
      return (
        <svg {...commonProps}>
          <path d="M12 4v10" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 20h14" />
        </svg>
      );
    case "crop":
      return (
        <svg {...commonProps}>
          <path d="M6 3v13a2 2 0 0 0 2 2h13" />
          <path d="M18 8V5a2 2 0 0 0-2-2h-3" />
          <path d="M8 21V8a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "close":
      return (
        <svg {...commonProps}>
          <path d="M6 6 18 18" />
          <path d="M18 6 6 18" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

async function loadImageFromUrl(url: string) {
  const image = new window.Image();
  image.decoding = "async";
  image.src = url;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Image failed to load"));
  });
  return image;
}

async function loadImageFromBlob(blob: Blob) {
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await loadImageFromUrl(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function buildCanvas(image: HTMLImageElement, cropRect: CropRect, width: number, height: number) {
  const crop = cropPixels({ width: image.width, height: image.height }, cropRect);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context unavailable");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, format: RasterFormat, quality?: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, format, quality);
  });
}

function scaleCanvas(sourceCanvas: HTMLCanvasElement, scale: number) {
  const nextCanvas = document.createElement("canvas");
  nextCanvas.width = Math.max(1, Math.round(sourceCanvas.width * scale));
  nextCanvas.height = Math.max(1, Math.round(sourceCanvas.height * scale));
  const nextContext = nextCanvas.getContext("2d");

  if (!nextContext) {
    throw new Error("Scaled canvas unavailable");
  }

  nextContext.imageSmoothingEnabled = true;
  nextContext.imageSmoothingQuality = "high";
  nextContext.drawImage(sourceCanvas, 0, 0, nextCanvas.width, nextCanvas.height);
  return nextCanvas;
}

async function findBestRasterBlob(canvas: HTMLCanvasElement, format: RasterFormat, targetBytes: number) {
  if (format === "image/png") {
    const blob = await canvasToBlob(canvas, format);
    if (!blob) {
      throw new Error("PNG export failed");
    }

    if (blob.size <= targetBytes) {
      return { blob, quality: 1, scale: 1 };
    }

    let smallestBlob = blob;
    let smallestQuality = 1;
    let smallestScale = 1;
    let bestBlob: Blob | null = null;
    let bestQuality = 1;
    let bestScale = 1;
    let workingCanvas = canvas;
    let workingScale = 1;

    for (let index = 0; index < 8; index += 1) {
      const pressure = targetBytes / smallestBlob.size;
      const scaleStep = clamp(Math.sqrt(Math.max(pressure, 0.08)) * 0.96, 0.45, 0.92);
      workingScale *= scaleStep;
      workingCanvas = scaleCanvas(workingCanvas, scaleStep);

      const scaledPngBlob = await canvasToBlob(workingCanvas, "image/png");
      if (!scaledPngBlob) {
        throw new Error("PNG export failed");
      }

      if (scaledPngBlob.size < smallestBlob.size) {
        smallestBlob = scaledPngBlob;
        smallestScale = workingScale;
        smallestQuality = 1;
      }

      if (scaledPngBlob.size <= targetBytes) {
        bestBlob = scaledPngBlob;
        bestScale = workingScale;
        bestQuality = 1;
        break;
      }
    }

    if (bestBlob) {
      return { blob: bestBlob, quality: bestQuality, scale: bestScale };
    }

    let low = 0.08;
    let high = 0.92;
    let transcodedBestBlob: Blob | null = null;
    let transcodedBestQuality = 0.08;

    for (let index = 0; index < 7; index += 1) {
      const quality = Number(((low + high) / 2).toFixed(3));
      const jpegBlob = await canvasToBlob(workingCanvas, "image/jpeg", quality);

      if (!jpegBlob) {
        throw new Error("Intermediate JPEG export failed");
      }

      const jpegImage = await loadImageFromBlob(jpegBlob);
      const pngCanvas = document.createElement("canvas");
      pngCanvas.width = workingCanvas.width;
      pngCanvas.height = workingCanvas.height;
      const pngContext = pngCanvas.getContext("2d");

      if (!pngContext) {
        throw new Error("PNG transcode canvas unavailable");
      }

      pngContext.drawImage(jpegImage, 0, 0, pngCanvas.width, pngCanvas.height);
      const pngBlob = await canvasToBlob(pngCanvas, "image/png");

      if (!pngBlob) {
        throw new Error("PNG export failed");
      }

      if (pngBlob.size < smallestBlob.size) {
        smallestBlob = pngBlob;
        smallestQuality = quality;
        smallestScale = workingScale;
      }

      if (pngBlob.size <= targetBytes) {
        transcodedBestBlob = pngBlob;
        transcodedBestQuality = quality;
        low = quality;
      } else {
        high = quality;
      }
    }

    return {
      blob: transcodedBestBlob ?? smallestBlob,
      quality: transcodedBestBlob ? transcodedBestQuality : smallestQuality,
      scale: transcodedBestBlob ? workingScale : smallestScale,
    };
  }

  let low = 0.1;
  let high = 1;
  let bestBlob: Blob | null = null;
  let bestQuality = 0.92;

  for (let index = 0; index < 7; index += 1) {
    const quality = Number(((low + high) / 2).toFixed(3));
    const blob = await canvasToBlob(canvas, format, quality);
    if (!blob) {
      throw new Error("Raster export failed");
    }

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      bestQuality = quality;
      low = quality;
    } else {
      high = quality;
    }
  }

  if (bestBlob) {
    return { blob: bestBlob, quality: bestQuality, scale: 1 };
  }

  const fallback = await canvasToBlob(canvas, format, 0.1);
  if (!fallback) {
    throw new Error("Raster export failed");
  }

  return { blob: fallback, quality: 0.1, scale: 1 };
}

async function buildPdfBlob(imageDataUrl: string, width: number, height: number) {
  const orientation = width >= height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [width, height],
    compress: true,
  });

  pdf.addImage(imageDataUrl, "JPEG", 0, 0, width, height, undefined, "FAST");
  return pdf.output("blob");
}

async function buildIcoBlob(sourceCanvas: HTMLCanvasElement) {
  const iconSize = clamp(Math.max(sourceCanvas.width, sourceCanvas.height), 16, 256);
  const iconCanvas = document.createElement("canvas");
  iconCanvas.width = iconSize;
  iconCanvas.height = iconSize;
  const iconContext = iconCanvas.getContext("2d");

  if (!iconContext) {
    throw new Error("ICO canvas unavailable");
  }

  iconContext.clearRect(0, 0, iconSize, iconSize);
  iconContext.imageSmoothingEnabled = true;
  iconContext.imageSmoothingQuality = "high";

  const scale = Math.min(iconSize / sourceCanvas.width, iconSize / sourceCanvas.height);
  const drawWidth = Math.max(1, Math.round(sourceCanvas.width * scale));
  const drawHeight = Math.max(1, Math.round(sourceCanvas.height * scale));
  const offsetX = Math.round((iconSize - drawWidth) / 2);
  const offsetY = Math.round((iconSize - drawHeight) / 2);

  iconContext.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight);

  const pngBlob = await canvasToBlob(iconCanvas, "image/png");
  if (!pngBlob) {
    throw new Error("ICO PNG payload failed");
  }

  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const header = new Uint8Array(6 + 16);
  const view = new DataView(header.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);

  header[6] = iconSize >= 256 ? 0 : iconSize;
  header[7] = iconSize >= 256 ? 0 : iconSize;
  header[8] = 0;
  header[9] = 0;
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, pngBytes.byteLength, true);
  view.setUint32(18, header.byteLength, true);

  return new Blob([header, pngBytes], { type: "image/x-icon" });
}

export function PhotoEditorDashboard() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("sample-photo");
  const [originalDimensions, setOriginalDimensions] = useState({ width: 1920, height: 1080 });
  const [constrainProportions, setConstrainProportions] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [targetFileSizeMB, setTargetFileSizeMB] = useState(2.5);
  const [targetFileSizeInput, setTargetFileSizeInput] = useState("2.5");
  const [originalFileSizeMB, setOriginalFileSizeMB] = useState<number | null>(null);
  const [estimatedSizeMB, setEstimatedSizeMB] = useState<number | null>(null);
  const [resolvedQuality, setResolvedQuality] = useState(0.82);
  const [resolvedScale, setResolvedScale] = useState(1);
  const [format, setFormat] = useState<ExportFormat>("image/jpeg");
  const [stripExif, setStripExif] = useState(true);
  const [status, setStatus] = useState("System ready");
  const [isExporting, setIsExporting] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect>(fullCropRect);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const estimateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openHelp, setOpenHelp] = useState<null | "target" | "quality">(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const cropSourceDimensions = useMemo(
    () => cropPixels(originalDimensions, cropRect),
    [cropRect, originalDimensions],
  );

  useEffect(() => {
    if (!previewUrl) {
      setWidthInput("");
      setHeightInput("");
      return;
    }

    setWidthInput(String(cropSourceDimensions.width));
    setHeightInput(String(cropSourceDimensions.height));
  }, [cropSourceDimensions.height, cropSourceDimensions.width, previewUrl]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const activeDrag = dragState;
    const sourceAspectRatio = originalDimensions.width / originalDimensions.height;
    const initialAspectRatio = activeDrag.initialCrop.width / activeDrag.initialCrop.height;

    function handlePointerMove(event: PointerEvent) {
      const viewport = previewViewportRef.current;
      if (!viewport || event.pointerId !== activeDrag.pointerId) {
        return;
      }

      const bounds = viewport.getBoundingClientRect();
      const deltaX = (event.clientX - activeDrag.startX) / bounds.width;
      const deltaY = (event.clientY - activeDrag.startY) / bounds.height;
      const initial = activeDrag.initialCrop;

      let nextCrop = initial;

      switch (activeDrag.mode) {
        case "move":
          nextCrop = {
            ...initial,
            x: initial.x + deltaX,
            y: initial.y + deltaY,
          };
          break;
        case "nw": {
          const width = initial.width - deltaX;
          if (constrainProportions) {
            const height = width / initialAspectRatio;
            nextCrop = {
              x: initial.x + deltaX,
              y: initial.y + (initial.height - height),
              width,
              height,
            };
          } else {
            nextCrop = {
              x: initial.x + deltaX,
              y: initial.y + deltaY,
              width,
              height: initial.height - deltaY,
            };
          }
          break;
        }
        case "ne": {
          const width = initial.width + deltaX;
          if (constrainProportions) {
            const height = width / initialAspectRatio;
            nextCrop = {
              x: initial.x,
              y: initial.y + (initial.height - height),
              width,
              height,
            };
          } else {
            nextCrop = {
              x: initial.x,
              y: initial.y + deltaY,
              width,
              height: initial.height - deltaY,
            };
          }
          break;
        }
        case "sw": {
          const width = initial.width - deltaX;
          if (constrainProportions) {
            const height = width / initialAspectRatio;
            nextCrop = {
              x: initial.x + deltaX,
              y: initial.y,
              width,
              height,
            };
          } else {
            nextCrop = {
              x: initial.x + deltaX,
              y: initial.y,
              width,
              height: initial.height + deltaY,
            };
          }
          break;
        }
        case "se": {
          const width = initial.width + deltaX;
          if (constrainProportions) {
            const height = width / initialAspectRatio;
            nextCrop = {
              x: initial.x,
              y: initial.y,
              width,
              height,
            };
          } else {
            nextCrop = {
              x: initial.x,
              y: initial.y,
              width,
              height: initial.height + deltaY,
            };
          }
          break;
        }
      }

      if (constrainProportions) {
        nextCrop.height = nextCrop.width / initialAspectRatio;
      }

      nextCrop = fitCropToBounds(nextCrop);

      if (constrainProportions) {
        const maxWidthByHeight = nextCrop.height * initialAspectRatio;
        const maxHeightByWidth = nextCrop.width / initialAspectRatio;
        if (nextCrop.width > maxWidthByHeight) {
          nextCrop.width = maxWidthByHeight;
        } else {
          nextCrop.height = maxHeightByWidth;
        }
        nextCrop = fitCropToBounds(nextCrop);
      }

      if (nextCrop.width > 1) {
        nextCrop.width = 1;
        nextCrop.height = sourceAspectRatio / initialAspectRatio;
      }

      setCropRect(nextCrop);
    }

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerId === activeDrag.pointerId) {
        setDragState(null);
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [constrainProportions, dragState, originalDimensions.height, originalDimensions.width]);

  const maxTargetFileSizeMB = originalFileSizeMB ?? 20;

  const exportLabel = useMemo(() => {
    if (format === "image/png") {
      return "PNG lossless export";
    }
    if (format === "image/webp") {
      return "WEBP optimized export";
    }
    if (format === "application/pdf") {
      return "PDF document export";
    }
    if (format === "image/x-icon") {
      return "ICO icon export";
    }
    return "JPG balanced export";
  }, [format]);

  const qualityLabel = useMemo(() => {
    if (format === "image/png") {
      return "Detail Scale";
    }
    if (format === "application/pdf") {
      return "PDF Source";
    }
    if (format === "image/x-icon") {
      return "Icon Detail";
    }
    return "Encoder Quality";
  }, [format]);

  const qualityDisplay = useMemo(() => {
    if (format === "image/png") {
      return `${Math.round(resolvedScale * 100)}%`;
    }
    return `${Math.round(resolvedQuality * 100)}%`;
  }, [format, resolvedQuality, resolvedScale]);

  useEffect(() => {
    setTargetFileSizeInput(String(targetFileSizeMB));
  }, [targetFileSizeMB]);

  useEffect(() => {
    return () => {
      if (estimateTimeoutRef.current) {
        clearTimeout(estimateTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function estimateOutput() {
      if (!previewUrl) {
        setEstimatedSizeMB(null);
        return;
      }

      try {
        const image = loadedImageRef.current ?? (await loadImageFromUrl(previewUrl));
        if (!loadedImageRef.current) {
          loadedImageRef.current = image;
        }

        const canvas = buildCanvas(image, cropRect, cropSourceDimensions.width, cropSourceDimensions.height);

        if (format === "application/pdf") {
          const jpegTargetBytes = targetFileSizeMB * 1024 * 1024 * 0.88;
          const { blob, quality, scale } = await findBestRasterBlob(canvas, "image/jpeg", jpegTargetBytes);
          const estimatedPdfSizeMB = megabytesFromBytes(blob.size * 1.08);

          if (!cancelled) {
            setResolvedQuality(quality);
            setResolvedScale(scale);
            setEstimatedSizeMB(estimatedPdfSizeMB);
          }
          return;
        }

        if (format === "image/x-icon") {
          const blob = await buildIcoBlob(canvas);
          if (!cancelled) {
            setResolvedQuality(1);
            setResolvedScale(1);
            setEstimatedSizeMB(megabytesFromBytes(blob.size));
          }
          return;
        }

        const targetBytes = targetFileSizeMB * 1024 * 1024;
        const { blob, quality, scale } = await findBestRasterBlob(canvas, format, targetBytes);

        if (!cancelled) {
          setResolvedQuality(quality);
          setResolvedScale(scale);
          setEstimatedSizeMB(megabytesFromBytes(blob.size));
        }
      } catch {
        if (!cancelled) {
          setEstimatedSizeMB(null);
        }
      }
    }

    if (!previewUrl || dragState || isExporting) {
      return () => {
        cancelled = true;
      };
    }

    if (estimateTimeoutRef.current) {
      clearTimeout(estimateTimeoutRef.current);
    }

    estimateTimeoutRef.current = setTimeout(() => {
      void estimateOutput();
    }, 180);

    return () => {
      cancelled = true;
      if (estimateTimeoutRef.current) {
        clearTimeout(estimateTimeoutRef.current);
      }
    };
  }, [
    cropRect,
    cropSourceDimensions.height,
    cropSourceDimensions.width,
    dragState,
    format,
    isExporting,
    previewUrl,
    targetFileSizeMB,
  ]);

  function triggerUpload() {
    fileInputRef.current?.click();
  }

  function loadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("Drop an image file");
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => {
      loadedImageRef.current = img;
      setOriginalDimensions({ width: img.width, height: img.height });
      setCropRect(fullCropRect);
      setWidthInput(String(img.width));
      setHeightInput(String(img.height));
      const fileSizeMB = megabytesFromBytes(file.size);
      setOriginalFileSizeMB(fileSizeMB);
      const normalizedTarget = Math.max(0.2, Number(fileSizeMB.toFixed(2)));
      setTargetFileSizeMB(normalizedTarget);
      setTargetFileSizeInput(String(normalizedTarget));
      setZoom(100);
      setStatus(`Loaded ${file.name}`);
    };
    img.src = url;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(url);
    setFileName(file.name.replace(/\.[^.]+$/, ""));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    loadFile(file);
  }

  function updateWidth(nextWidth: number) {
    const safeWidth = clamp(Math.round(nextWidth) || 1, 1, originalDimensions.width);
    setCropRect((current) =>
      resizeCropFromCenter(current, originalDimensions, safeWidth, undefined, constrainProportions),
    );
  }

  function updateHeight(nextHeight: number) {
    const safeHeight = clamp(Math.round(nextHeight) || 1, 1, originalDimensions.height);
    setCropRect((current) =>
      resizeCropFromCenter(current, originalDimensions, undefined, safeHeight, constrainProportions),
    );
  }

  function resetToOriginal() {
    setCropRect(fullCropRect);
    setWidthInput(String(originalDimensions.width));
    setHeightInput(String(originalDimensions.height));
    const normalizedTarget = Math.max(0.2, Number((originalFileSizeMB ?? 2.5).toFixed(2)));
    setTargetFileSizeMB(normalizedTarget);
    setTargetFileSizeInput(String(normalizedTarget));
    setZoom(100);
    setStatus("Reverted to original framing");
  }

  function applyRatioPreset(preset: RatioPreset) {
    setCropRect((current) => applyAspectRatioPreset(current, originalDimensions, preset.width, preset.height));
    setStatus(preset.label === "Original" ? "Restored original crop ratio" : `Applied ${preset.label} crop`);
  }

  function commitTargetFileSize(rawValue: string) {
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) {
      setTargetFileSizeInput(String(targetFileSizeMB));
      return;
    }

    const normalizedValue = clamp(parsedValue, 0.2, maxTargetFileSizeMB);
    setTargetFileSizeMB(normalizedValue);
    setTargetFileSizeInput(String(normalizedValue));
  }

  function commitWidthInput(rawValue: string) {
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) {
      setWidthInput(previewUrl ? String(cropSourceDimensions.width) : "");
      return;
    }

    updateWidth(parsedValue);
  }

  function commitHeightInput(rawValue: string) {
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) {
      setHeightInput(previewUrl ? String(cropSourceDimensions.height) : "");
      return;
    }

    updateHeight(parsedValue);
  }

  function startDrag(mode: DragMode, event: ReactPointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDragState({
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialCrop: cropRect,
    });
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFile(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      setIsDraggingFile(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFile(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      loadFile(file);
    }
  }

  async function processDownload() {
    if (!previewUrl) {
      setStatus("Upload a photo to export");
      return;
    }

    setIsExporting(true);
    setStatus("Rendering export...");

    try {
      const image = loadedImageRef.current ?? (await loadImageFromUrl(previewUrl));
      loadedImageRef.current = image;

      const canvas = buildCanvas(image, cropRect, cropSourceDimensions.width, cropSourceDimensions.height);
      const targetBytes = targetFileSizeMB * 1024 * 1024;
      let outputBlob: Blob;

      if (format === "application/pdf") {
        const { blob } = await findBestRasterBlob(canvas, "image/jpeg", targetBytes * 0.88);
        const imageDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result));
          reader.readAsDataURL(blob);
        });
        outputBlob = await buildPdfBlob(imageDataUrl, cropSourceDimensions.width, cropSourceDimensions.height);
      } else if (format === "image/x-icon") {
        outputBlob = await buildIcoBlob(canvas);
      } else {
        const { blob } = await findBestRasterBlob(canvas, format, targetBytes);
        outputBlob = blob;
      }

      const downloadUrl = URL.createObjectURL(outputBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${fileName}-${cropSourceDimensions.width}x${cropSourceDimensions.height}.${extensionForFormat(format)}`;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      const exifNote = stripExif ? "EXIF stripped" : "Browser export may preserve minimal metadata only";
      setStatus(
        `${formatName(format)} ready at ${toFixedSize(megabytesFromBytes(outputBlob.size))} MB. ${exifNote}.`,
      );
    } catch {
      setStatus("Export failed. Try a different image.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className={styles.appShell}>
      <aside className={styles.sideNav}>
        <div className={styles.brandBlock}>
          <h1>Flux</h1>
          <p>secure and slow... on purpose.</p>
        </div>

        <nav className={styles.navList}>
          <button className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={styles.iconWrap}>
              <Icon name="image" />
            </span>
            <span>Image Tools</span>
          </button>
          <button className={styles.navItem}>
            <span className={styles.iconWrap}>
              <Icon name="file" />
            </span>
            <span>Document Tools</span>
            <small>Soon</small>
          </button>
        </nav>

        <div className={styles.sideFooter}>
          <button className={styles.navItem} onClick={() => setSupportOpen(true)}>
            <span className={styles.iconWrap}>
              <Icon name="help" />
            </span>
            <span>Support</span>
          </button>
          <Link className={styles.navItem} href="/about">
            <span className={styles.iconWrap}>
              <Icon name="file" />
            </span>
            <span>About This Project</span>
          </Link>

          <div className={styles.makerCard}>
            <Image className={styles.makerPhoto} src={profilePhoto} alt="Zack Lown" width={64} height={64} />
            <div>
              <strong>Made by Zack Lown</strong>
              <span>Personal Project</span>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <main className={styles.workspaceFrame}>
          <section className={styles.previewSection}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarGroup}>
                <input
                  ref={fileInputRef}
                  className={styles.hiddenInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                />
                <button className={styles.primaryGhostButton} onClick={triggerUpload}>
                  <span className={styles.buttonIcon}>
                    <Icon name="upload" />
                  </span>
                  Upload New
                </button>
                <button className={styles.secondaryButton} onClick={resetToOriginal}>
                  Reset
                </button>
                <div className={styles.toolbarDivider} />
                <div className={styles.zoomControls}>
                  <button className={styles.iconButton} onClick={() => setZoom((value) => clamp(value + 5, 25, 200))}>
                    <Icon name="plus" />
                  </button>
                  <button className={styles.iconButton} onClick={() => setZoom((value) => clamp(value - 5, 25, 200))}>
                    <Icon name="minus" />
                  </button>
                  <span>{zoom}%</span>
                </div>
              </div>

              <div className={styles.metaDisplay}>
                <span>
                  Crop {previewUrl ? cropSourceDimensions.width : "--"} x {previewUrl ? cropSourceDimensions.height : "--"}
                </span>
                <span>
                  Start Size {originalFileSizeMB === null ? "--" : `${toFixedSize(originalFileSizeMB)} MB`}
                </span>
                <span>{formatName(format)}</span>
              </div>
            </div>

            <div className={styles.canvasArea}>
              <div className={styles.previewCard}>
                <div
                  ref={previewViewportRef}
                  className={`${styles.previewViewport} ${isDraggingFile ? styles.previewViewportDragging : ""}`}
                  style={{ transform: `scale(${zoom / 100})` }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {previewUrl ? (
                    <div
                      className={styles.previewStage}
                      style={{ aspectRatio: `${originalDimensions.width} / ${originalDimensions.height}` }}
                    >
                      <img className={styles.previewImage} src={previewUrl} alt="Uploaded photo preview" />

                      <div className={styles.cropOverlay}>
                        <div
                          className={styles.cropBox}
                          style={{
                            left: `${cropRect.x * 100}%`,
                            top: `${cropRect.y * 100}%`,
                            width: `${cropRect.width * 100}%`,
                            height: `${cropRect.height * 100}%`,
                          }}
                          onPointerDown={(event) => startDrag("move", event)}
                        >
                          <div className={styles.cropTag}>
                            <span className={styles.cropIcon}>
                              <Icon name="crop" />
                            </span>
                            <span>
                              {cropSourceDimensions.width} x {cropSourceDimensions.height}
                            </span>
                          </div>
                          <button
                            className={`${styles.handle} ${styles.topLeft}`}
                            onPointerDown={(event) => startDrag("nw", event)}
                            aria-label="Resize crop from top left"
                            type="button"
                          />
                          <button
                            className={`${styles.handle} ${styles.topRight}`}
                            onPointerDown={(event) => startDrag("ne", event)}
                            aria-label="Resize crop from top right"
                            type="button"
                          />
                          <button
                            className={`${styles.handle} ${styles.bottomLeft}`}
                            onPointerDown={(event) => startDrag("sw", event)}
                            aria-label="Resize crop from bottom left"
                            type="button"
                          />
                          <button
                            className={`${styles.handle} ${styles.bottomRight}`}
                            onPointerDown={(event) => startDrag("se", event)}
                            aria-label="Resize crop from bottom right"
                            type="button"
                          />
                          <div className={styles.thirdsRow}>
                            <span />
                            <span />
                          </div>
                          <div className={styles.thirdsColumn}>
                            <span />
                            <span />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button className={styles.uploadDropzone} onClick={triggerUpload} type="button">
                      <span className={styles.uploadDropzoneIcon}>
                        <Icon name="upload" />
                      </span>
                      <strong>Upload Photo</strong>
                      <span>Click to browse or drag and drop an image here.</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

          </section>

          <section className={styles.inspectorPanel}>
            <div className={styles.inspectorContent}>
              <div className={styles.controlBlock}>
                <div className={styles.blockHeading}>
                  <span className={styles.smallIcon}>
                    <Icon name="aspect" />
                  </span>
                  Resizing &amp; Dimensions
                </div>

                <div className={styles.dimensionGrid}>
                  <label>
                    <span>Width (px)</span>
                    <input
                      type="number"
                      value={widthInput}
                      min={1}
                      max={originalDimensions.width}
                      onChange={(event) => setWidthInput(event.target.value)}
                      onBlur={(event) => commitWidthInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          commitWidthInput(event.currentTarget.value);
                          event.currentTarget.blur();
                        }
                      }}
                      disabled={!previewUrl}
                    />
                  </label>
                  <label>
                    <span>Height (px)</span>
                    <input
                      type="number"
                      value={heightInput}
                      min={1}
                      max={originalDimensions.height}
                      onChange={(event) => setHeightInput(event.target.value)}
                      onBlur={(event) => commitHeightInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          commitHeightInput(event.currentTarget.value);
                          event.currentTarget.blur();
                        }
                      }}
                      disabled={!previewUrl}
                    />
                  </label>
                </div>

                <div className={styles.ratioPresetBlock}>
                  <span className={styles.ratioPresetLabel}>Common Ratios</span>
                  <div className={styles.ratioPresetGrid}>
                    {ratioPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        className={styles.ratioPresetButton}
                        onClick={() => applyRatioPreset(preset)}
                        disabled={!previewUrl}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.toggleRow}>
                  <span>Constrain Proportions</span>
                  <button
                    className={`${styles.toggle} ${constrainProportions ? styles.toggleActive : ""}`}
                    onClick={() => setConstrainProportions((value) => !value)}
                    aria-pressed={constrainProportions}
                  >
                    <span />
                  </button>
                </div>
              </div>

              <div className={styles.controlBlock}>
                <div className={styles.blockHeadingRow}>
                  <div className={styles.blockHeading}>
                    <span className={styles.smallIcon}>
                      <Icon name="compress" />
                    </span>
                    Target File Size
                  </div>
                  <span className={styles.metricChip}>
                    {estimatedSizeMB === null ? "--" : `${toFixedSize(estimatedSizeMB)} MB`}
                  </span>
                </div>

                <div className={styles.fileSizeInputs}>
                  <label className={styles.targetInput}>
                    <span className={styles.labelWithHelp}>
                      <span>Target (MB)</span>
                      <button
                        className={styles.helpBadge}
                        type="button"
                        aria-label="Explain file size units"
                        onClick={() => setOpenHelp((current) => (current === "target" ? null : "target"))}
                        aria-expanded={openHelp === "target"}
                      >
                        ?
                      </button>
                    </span>
                    {openHelp === "target" ? (
                      <div className={styles.helpPopover}>
                        <strong>File Size Units</strong>
                        <p>Targets here use megabytes.</p>
                        <p>`1 MB = 1024 KB` and `2048 KB = 2 MB`.</p>
                        <p>The slider sets your desired final file size ceiling.</p>
                      </div>
                    ) : null}
                    <input
                      type="number"
                      min={0.2}
                      max={maxTargetFileSizeMB}
                      step={0.01}
                      value={targetFileSizeInput}
                      onChange={(event) => setTargetFileSizeInput(event.target.value)}
                      onBlur={(event) => commitTargetFileSize(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          commitTargetFileSize(event.currentTarget.value);
                          event.currentTarget.blur();
                        }
                      }}
                    />
                  </label>
                  <label className={styles.targetInput}>
                    <span className={styles.labelWithHelp}>
                      <span>{qualityLabel}</span>
                      <button
                        className={styles.helpBadge}
                        type="button"
                        aria-label="Explain quality percentage"
                        onClick={() => setOpenHelp((current) => (current === "quality" ? null : "quality"))}
                        aria-expanded={openHelp === "quality"}
                      >
                        ?
                      </button>
                    </span>
                    {openHelp === "quality" ? (
                      <div className={styles.helpPopover}>
                        <strong>{qualityLabel}</strong>
                        <p>This number shows how much detail or encoding strength is needed to reach the target.</p>
                        <p>Higher percentages usually mean more detail and a larger file.</p>
                        <p>For PNG and ICO, this can reflect retained detail rather than a literal encoder knob.</p>
                      </div>
                    ) : null}
                    <input type="text" value={qualityDisplay} readOnly />
                  </label>
                </div>

                <input
                  className={styles.slider}
                  type="range"
                  min={0.2}
                  max={maxTargetFileSizeMB}
                  step={0.01}
                  value={targetFileSizeMB}
                  onChange={(event) =>
                    setTargetFileSizeMB(clamp(Number(event.target.value), 0.2, maxTargetFileSizeMB))
                  }
                />
                <div className={styles.sliderLabels}>
                  <span>Smaller File</span>
                  <span>Original Size</span>
                </div>
                {format === "image/png" ? (
                  <p className={styles.helperText}>
                    PNG target size is reached by downscaling detail first and, if needed, simplifying pixels before exporting back to PNG.
                  </p>
                ) : originalFileSizeMB !== null ? (
                  <p className={styles.helperText}>
                    Starting image size: {toFixedSize(originalFileSizeMB)} MB. Target size cannot exceed the original file.
                  </p>
                ) : null}
              </div>

              <div className={styles.controlBlock}>
                <div className={styles.blockHeading}>
                  <span className={styles.smallIcon}>
                    <Icon name="change" />
                  </span>
                  Output Format
                </div>

                <div className={styles.formatGrid}>
                  {formatOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`${styles.formatButton} ${format === option.value ? styles.formatButtonActive : ""}`}
                      onClick={() => setFormat(option.value)}
                      disabled={!option.enabled}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.controlBlock}>
                <div className={styles.optionRow}>
                  <label className={styles.checkboxRow}>
                    <input type="checkbox" checked={stripExif} onChange={() => setStripExif((value) => !value)} />
                    <span>Strip EXIF Data</span>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.inspectorFooter}>
              <button className={styles.primaryAction} onClick={processDownload} disabled={isExporting || !previewUrl}>
                <span className={styles.buttonIcon}>
                  <Icon name="download" />
                </span>
                {isExporting ? "Processing..." : "Process & Download"}
              </button>
              <p>Estimated export time: &lt; 1.2s</p>
            </div>
          </section>
        </main>
      </div>

      {supportOpen ? (
        <div className={styles.modalBackdrop} onClick={() => setSupportOpen(false)}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSupportOpen(false)} aria-label="Close support popup">
              <Icon name="close" />
            </button>
            <p className={styles.modalEyebrow}>Support</p>
            <h2>This is a personal project. Don&apos;t contact me if you don&apos;t know me.</h2>
            <p className={styles.modalBody}>If you do know me, send me an email for support.</p>
            <a className={styles.modalLink} href="mailto:zacklown@gmail.com">
              zacklown@gmail.com
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
