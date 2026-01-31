import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Image as ImageIcon,
  Camera,
  Sun,
  LayoutGrid,
  FileJson,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

/**
 * Storyboard Prompt JSON Builder
 * - Single-file React app
 * - No backend; outputs copyable JSON
 * - Intuitive form with dropdowns
 * - Reference images section for camera/lighting (inline SVG previews)
 */

const ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:2", "2.39:1", "21:9"]; 

const VISUAL_STYLE_PRESETS = [
  "cinematic, soft film look, subtle grain",
  "clean digital, sharp, high contrast",
  "anime, vibrant, cel-shaded",
  "noir, high contrast, rain-soaked",
  "dreamy, pastel, bloom, soft focus",
  "documentary, handheld, natural light",
  "photoreal, studio lighting, crisp",
];

const SHOT_TYPES = [
  "establishing",
  "wide",
  "medium",
  "medium two-shot",
  "close-up",
  "extreme close-up",
  "over-the-shoulder",
  "insert",
  "POV",
  "tracking",
  "drone",
];

const CAMERA_ANGLES = [
  "eye-level",
  "high angle",
  "low angle",
  "dutch angle",
  "top-down",
  "wide, exterior",
  "interior, eye-level",
  "eye-level, slightly to the side",
];

const CAMERA_MOVES = [
  "static",
  "handheld",
  "pan",
  "tilt",
  "dolly in",
  "dolly out",
  "tracking",
  "crane",
  "zoom",
  "orbit",
];

const LENS_PRESETS = [
  { label: "14mm (ultra-wide)", value: "14mm" },
  { label: "24mm (wide)", value: "24mm" },
  { label: "35mm (wide/normal)", value: "35mm" },
  { label: "50mm (normal)", value: "50mm" },
  { label: "85mm (portrait)", value: "85mm" },
  { label: "135mm (tele)", value: "135mm" },
];

const DEPTH_OF_FIELD = [
  { label: "Deep (everything sharp)", value: "deep" },
  { label: "Medium", value: "medium" },
  { label: "Shallow (background blur)", value: "shallow" },
];

const LIGHTING_PRESETS = [
  { label: "Natural window light", value: "natural_window" },
  { label: "Softbox key + fill", value: "softbox" },
  { label: "Backlit / rim light", value: "rim" },
  { label: "Neon / practicals", value: "neon" },
  { label: "Golden hour", value: "golden_hour" },
  { label: "Overcast / diffused", value: "overcast" },
  { label: "Hard spotlight", value: "spot" },
];

const OUTPUT_LAYOUTS = [
  "4 panels on a single page",
  "6 panels on a single page",
  "9 panels grid",
  "one shot per page",
];

const OUTPUT_LABELS = [
  "include shot_number and short caption under each frame",
  "shot_number only",
  "caption only",
  "no labels",
];

const OUTPUT_STYLE = [
  "clean storyboard frames, not fully rendered painting",
  "loose sketch lines, minimal shading",
  "photographic frames with overlays",
  "comic panel style with gutters",
];

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safeJsonStringify(obj) {
  return JSON.stringify(obj, null, 2);
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function miniSvgDataUri(svg) {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

// Simple, self-contained “reference image” illustrations (SVG) for lens/lighting.
const REF_IMAGES = {
  lenses: {
    "14mm": miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <defs>
          <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0' stop-color='#0b1220'/>
            <stop offset='1' stop-color='#111827'/>
          </linearGradient>
        </defs>
        <rect width='800' height='450' fill='url(#g)'/>
        <rect x='60' y='70' width='680' height='310' rx='26' fill='none' stroke='#93c5fd' stroke-width='5'/>
        <path d='M80 330 C 210 250, 290 230, 400 230 C 520 230, 600 250, 720 330' fill='none' stroke='#60a5fa' stroke-width='6'/>
        <circle cx='400' cy='230' r='10' fill='#93c5fd'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>14mm Ultra-wide</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Exaggerated perspective • Big environment • Strong lines</text>
      </svg>
    `),
    "24mm": miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <rect width='800' height='450' fill='#0b1220'/>
        <rect x='110' y='85' width='580' height='280' rx='24' fill='none' stroke='#a7f3d0' stroke-width='5'/>
        <path d='M140 320 C 250 270, 320 250, 400 250 C 500 250, 575 270, 660 320' fill='none' stroke='#34d399' stroke-width='6'/>
        <circle cx='400' cy='250' r='10' fill='#a7f3d0'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>24mm Wide</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Wide scene • Mild perspective • Great for interiors</text>
      </svg>
    `),
    "35mm": miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <rect width='800' height='450' fill='#0b1220'/>
        <rect x='160' y='95' width='480' height='260' rx='22' fill='none' stroke='#fde68a' stroke-width='5'/>
        <path d='M180 315 C 280 285, 330 270, 400 270 C 470 270, 530 285, 620 315' fill='none' stroke='#fbbf24' stroke-width='6'/>
        <circle cx='400' cy='270' r='10' fill='#fde68a'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>35mm Wide/Normal</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Natural feel • Story coverage • Balanced framing</text>
      </svg>
    `),
    "50mm": miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <rect width='800' height='450' fill='#0b1220'/>
        <rect x='210' y='105' width='380' height='240' rx='20' fill='none' stroke='#fca5a5' stroke-width='5'/>
        <circle cx='400' cy='225' r='12' fill='#fecaca'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>50mm Normal</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Human-like perspective • Clean composition</text>
      </svg>
    `),
    "85mm": miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <rect width='800' height='450' fill='#0b1220'/>
        <rect x='260' y='115' width='280' height='220' rx='18' fill='none' stroke='#c4b5fd' stroke-width='5'/>
        <circle cx='400' cy='225' r='12' fill='#ddd6fe'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>85mm Portrait</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Flattering faces • Compressed background • Shallow DOF</text>
      </svg>
    `),
    "135mm": miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <rect width='800' height='450' fill='#0b1220'/>
        <rect x='300' y='125' width='200' height='200' rx='16' fill='none' stroke='#67e8f9' stroke-width='5'/>
        <circle cx='400' cy='225' r='12' fill='#a5f3fc'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>135mm Tele</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Strong compression • Isolated subject • Distant coverage</text>
      </svg>
    `),
  },
  lighting: {
    natural_window: miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <rect width='800' height='450' fill='#0b1220'/>
        <rect x='60' y='70' width='260' height='310' rx='18' fill='none' stroke='#93c5fd' stroke-width='5'/>
        <line x1='80' y1='120' x2='300' y2='120' stroke='#93c5fd' stroke-width='3'/>
        <line x1='80' y1='180' x2='300' y2='180' stroke='#93c5fd' stroke-width='3'/>
        <line x1='80' y1='240' x2='300' y2='240' stroke='#93c5fd' stroke-width='3'/>
        <line x1='80' y1='300' x2='300' y2='300' stroke='#93c5fd' stroke-width='3'/>
        <circle cx='540' cy='245' r='70' fill='none' stroke='#e5e7eb' stroke-width='5'/>
        <path d='M320 110 L 470 205' stroke='#60a5fa' stroke-width='6'/>
        <path d='M320 150 L 460 230' stroke='#60a5fa' stroke-width='6' opacity='0.8'/>
        <path d='M320 190 L 460 260' stroke='#60a5fa' stroke-width='6' opacity='0.6'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>Natural Window Light</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Soft directional key • Natural shadows • Cozy realism</text>
      </svg>
    `),
    softbox: miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <rect width='800' height='450' fill='#0b1220'/>
        <rect x='70' y='120' width='160' height='160' rx='18' fill='none' stroke='#a7f3d0' stroke-width='5'/>
        <text x='90' y='210' fill='#a7f3d0' font-family='Inter, system-ui' font-size='20'>SOFTBOX</text>
        <circle cx='520' cy='240' r='70' fill='none' stroke='#e5e7eb' stroke-width='5'/>
        <path d='M240 170 L 450 225' stroke='#34d399' stroke-width='7'/>
        <path d='M240 230 L 450 255' stroke='#34d399' stroke-width='7' opacity='0.7'/>
        <circle cx='650' cy='250' r='40' fill='none' stroke='#6ee7b7' stroke-width='5'/>
        <path d='M610 250 L 575 250' stroke='#6ee7b7' stroke-width='6'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>Softbox Key + Fill</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Soft flattering faces • Controlled look • Minimal harshness</text>
      </svg>
    `),
    rim: miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <rect width='800' height='450' fill='#0b1220'/>
        <circle cx='460' cy='240' r='75' fill='none' stroke='#e5e7eb' stroke-width='5'/>
        <circle cx='460' cy='240' r='82' fill='none' stroke='#f472b6' stroke-width='6' opacity='0.9'/>
        <circle cx='690' cy='240' r='42' fill='none' stroke='#fb7185' stroke-width='5'/>
        <path d='M648 240 L 545 240' stroke='#fb7185' stroke-width='7'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>Backlight / Rim</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Separation from background • Halo edge • Dramatic depth</text>
      </svg>
    `),
    neon: miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <rect width='800' height='450' fill='#0b1220'/>
        <rect x='70' y='90' width='260' height='90' rx='18' fill='none' stroke='#a78bfa' stroke-width='6'/>
        <text x='95' y='145' fill='#a78bfa' font-family='Inter, system-ui' font-size='34'>NEON</text>
        <circle cx='520' cy='260' r='70' fill='none' stroke='#e5e7eb' stroke-width='5'/>
        <path d='M330 140 L 450 230' stroke='#a78bfa' stroke-width='7'/>
        <path d='M120 180 L 450 270' stroke='#22d3ee' stroke-width='7' opacity='0.8'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>Neon / Practicals</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Colorful highlights • Mood • Nightlife energy</text>
      </svg>
    `),
    golden_hour: miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <rect width='800' height='450' fill='#0b1220'/>
        <circle cx='140' cy='140' r='62' fill='none' stroke='#fbbf24' stroke-width='6'/>
        <path d='M80 220 L 720 220' stroke='#fbbf24' stroke-width='5' opacity='0.6'/>
        <circle cx='520' cy='260' r='70' fill='none' stroke='#e5e7eb' stroke-width='5'/>
        <path d='M190 160 L 450 240' stroke='#f59e0b' stroke-width='8'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>Golden Hour</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Warm tones • Long shadows • Romantic vibe</text>
      </svg>
    `),
    overcast: miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <rect width='800' height='450' fill='#0b1220'/>
        <path d='M120 170 C 160 120, 250 120, 290 170 C 330 140, 410 150, 410 210 C 410 260, 360 280, 310 270 C 280 310, 200 310, 170 270 C 120 280, 90 250, 90 210 C 90 190, 100 180, 120 170 Z' fill='none' stroke='#9ca3af' stroke-width='6'/>
        <circle cx='520' cy='260' r='70' fill='none' stroke='#e5e7eb' stroke-width='5'/>
        <path d='M290 210 L 450 250' stroke='#9ca3af' stroke-width='7' opacity='0.8'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>Overcast / Diffused</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Low contrast • Even exposure • Subtle shadows</text>
      </svg>
    `),
    spot: miniSvgDataUri(`
      <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <rect width='800' height='450' fill='#0b1220'/>
        <polygon points='120,80 250,120 210,240 80,200' fill='none' stroke='#fca5a5' stroke-width='6'/>
        <circle cx='520' cy='260' r='70' fill='none' stroke='#e5e7eb' stroke-width='5'/>
        <path d='M230 150 L 450 250' stroke='#fb7185' stroke-width='8'/>
        <text x='60' y='52' fill='#e5e7eb' font-family='Inter, system-ui' font-size='26'>Hard Spotlight</text>
        <text x='60' y='410' fill='#9ca3af' font-family='Inter, system-ui' font-size='18'>Sharp shadows • High drama • Theater vibe</text>
      </svg>
    `),
  },
};

const DEFAULT_STATE = {
  task: "create_storyboard",
  project: {
    title: "",
    aspect_ratio: "16:9",
    visual_style: VISUAL_STYLE_PRESETS[0],
    consistency_id: "",
  },
  main_characters: [
    { id: "alex", description: "" },
    { id: "jordan", description: "" },
  ],
  shots: [
    {
      shot_number: 1,
      shot_type: "establishing",
      camera_angle: "wide, exterior",
      location: "",
      action: "",
      purpose: "",
      text_overlays: "none",
      // Optional camera/lighting detail block
      camera: {
        lens: "35mm",
        move: "static",
        dof: "medium",
      },
      lighting: {
        preset: "natural_window",
        notes: "",
      },
    },
  ],
  output: {
    layout: OUTPUT_LAYOUTS[0],
    labels: OUTPUT_LABELS[0],
    style: OUTPUT_STYLE[0],
  },
};

function normalizeStoryboard(state) {
  // Build JSON that matches the example shape, while keeping extra camera/lighting fields in each shot.
  const cleaned = {
    task: state.task || "create_storyboard",
    project: {
      title: state.project?.title?.trim() || "Untitled",
      aspect_ratio: state.project?.aspect_ratio || "16:9",
      visual_style: state.project?.visual_style?.trim() || "",
      consistency_id: state.project?.consistency_id?.trim() || "",
    },
    main_characters: (state.main_characters || [])
      .filter((c) => (c?.id || "").trim().length > 0)
      .map((c) => ({
        id: (c.id || "").trim(),
        description: (c.description || "").trim(),
      })),
    shots: (state.shots || [])
      .slice()
      .sort((a, b) => (a.shot_number ?? 0) - (b.shot_number ?? 0))
      .map((s, idx) => {
        const base = {
          shot_number: s.shot_number ?? idx + 1,
          shot_type: s.shot_type || "medium",
          camera_angle: s.camera_angle || "eye-level",
        };

        // Optional fields only when present
        const opt = {};
        if ((s.characters || []).length) opt.characters = s.characters;
        if ((s.location || "").trim()) opt.location = s.location.trim();
        if ((s.action || "").trim()) opt.action = s.action.trim();
        if ((s.purpose || "").trim()) opt.purpose = s.purpose.trim();
        if ((s.focus || "").trim()) opt.focus = s.focus.trim();
        if ((s.notes || "").trim()) opt.notes = s.notes.trim();
        if ((s.text_overlays || "").trim()) opt.text_overlays = s.text_overlays.trim();
        if ((s.emotional_tone || "").trim()) opt.emotional_tone = s.emotional_tone.trim();

        // Keep camera/lighting blocks if any meaningful value exists
        const camera = s.camera || {};
        const lighting = s.lighting || {};
        const cameraBlock = {
          lens: camera.lens || undefined,
          move: camera.move || undefined,
          dof: camera.dof || undefined,
          aperture: (camera.aperture || "").trim() || undefined,
          framing_notes: (camera.framing_notes || "").trim() || undefined,
        };
        const lightingBlock = {
          preset: lighting.preset || undefined,
          notes: (lighting.notes || "").trim() || undefined,
        };

        const cameraHasAny = Object.values(cameraBlock).some((v) => v !== undefined);
        const lightingHasAny = Object.values(lightingBlock).some((v) => v !== undefined);

        return {
          ...base,
          ...opt,
          ...(cameraHasAny ? { camera: cameraBlock } : {}),
          ...(lightingHasAny ? { lighting: lightingBlock } : {}),
        };
      }),
    output: {
      layout: state.output?.layout || OUTPUT_LAYOUTS[0],
      labels: state.output?.labels || OUTPUT_LABELS[0],
      style: state.output?.style || OUTPUT_STYLE[0],
    },
  };

  return cleaned;
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-2xl bg-muted p-2">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-lg font-semibold">{title}</div>
        {subtitle ? <div className="text-sm text-muted-foreground">{subtitle}</div> : null}
      </div>
    </div>
  );
}

function InlineHelp({ children }) {
  return (
    <div className="mt-2 text-xs text-muted-foreground leading-relaxed">{children}</div>
  );
}

function RefCard({ title, imgSrc, caption }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        <Badge variant="secondary" className="rounded-xl">
          Reference
        </Badge>
      </div>
      <div className="p-2">
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-auto rounded-xl border"
          draggable={false}
        />
        {caption ? (
          <div className="mt-2 text-xs text-muted-foreground">{caption}</div>
        ) : null}
      </div>
    </div>
  );
}

function ShotCard({
  shot,
  index,
  allCharacters,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
}) {
  const lensSrc = REF_IMAGES.lenses[shot.camera?.lens || "35mm"];
  const lightSrc = REF_IMAGES.lighting[shot.lighting?.preset || "natural_window"];

  const shotNum = shot.shot_number ?? index + 1;

  function set(path, value) {
    onChange((prev) => {
      const next = { ...prev };
      // shallow clone + mutate along path
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        cur[k] = Array.isArray(cur[k]) ? cur[k].slice() : { ...(cur[k] || {}) };
        cur = cur[k];
      }
      cur[path[path.length - 1]] = value;
      return next;
    });
  }

  function toggleCharacter(charId) {
    const current = shot.characters || [];
    const exists = current.includes(charId);
    const next = exists ? current.filter((c) => c !== charId) : [...current, charId];
    set(["shots", index, "characters"], next);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              Shot {shotNum}{" "}
              <span className="text-muted-foreground font-normal">• {shot.shot_type}</span>
            </CardTitle>
            <div className="text-xs text-muted-foreground mt-1">
              Use dropdowns for consistent vocabulary; add freeform notes where needed.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={() => onMove(index, -1)}
              disabled={index === 0}
            >
              ↑
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={() => onMove(index, 1)}
              disabled={false}
            >
              ↓
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={() => onDuplicate(index)}
              title="Duplicate shot"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl"
              onClick={() => onRemove(index)}
              title="Delete shot"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Shot #</Label>
            <Input
              type="number"
              value={shotNum}
              min={1}
              onChange={(e) =>
                set(["shots", index, "shot_number"],
                  clamp(parseInt(e.target.value || "1", 10), 1, 999)
                )
              }
            />
          </div>
          <div>
            <Label>Shot type</Label>
            <Select
              value={shot.shot_type || "medium"}
              onValueChange={(v) => set(["shots", index, "shot_type"], v)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select shot type" />
              </SelectTrigger>
              <SelectContent>
                {SHOT_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Camera angle</Label>
            <Select
              value={shot.camera_angle || "eye-level"}
              onValueChange={(v) => set(["shots", index, "camera_angle"], v)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select camera angle" />
              </SelectTrigger>
              <SelectContent>
                {CAMERA_ANGLES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Location</Label>
            <Textarea
              value={shot.location || ""}
              onChange={(e) => set(["shots", index, "location"], e.target.value)}
              placeholder="e.g., cozy city coffee shop on a rainy morning"
              className="min-h-[80px]"
            />
          </div>
          <div>
            <Label>Action</Label>
            <Textarea
              value={shot.action || ""}
              onChange={(e) => set(["shots", index, "action"], e.target.value)}
              placeholder="e.g., Alex reaches for the cup at the same time as Jordan"
              className="min-h-[80px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Purpose</Label>
            <Input
              value={shot.purpose || ""}
              onChange={(e) => set(["shots", index, "purpose"], e.target.value)}
              placeholder="e.g., set location and mood"
            />
          </div>
          <div>
            <Label>Focus (optional)</Label>
            <Input
              value={shot.focus || ""}
              onChange={(e) => set(["shots", index, "focus"], e.target.value)}
              placeholder="e.g., character introduction"
            />
          </div>
          <div>
            <Label>Emotional tone (optional)</Label>
            <Input
              value={shot.emotional_tone || ""}
              onChange={(e) => set(["shots", index, "emotional_tone"], e.target.value)}
              placeholder="e.g., light, awkward, charming"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Text overlays</Label>
            <Input
              value={shot.text_overlays || ""}
              onChange={(e) => set(["shots", index, "text_overlays"], e.target.value)}
              placeholder="none / title card / subtitle..."
            />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Input
              value={shot.notes || ""}
              onChange={(e) => set(["shots", index, "notes"], e.target.value)}
              placeholder="e.g., leave space on right side of frame for potential text"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Characters in this shot</Label>
          <div className="flex flex-wrap gap-2">
            {allCharacters.length === 0 ? (
              <div className="text-sm text-muted-foreground">Add main characters above first.</div>
            ) : (
              allCharacters.map((c) => {
                const active = (shot.characters || []).includes(c.id);
                return (
                  <Button
                    key={c.id}
                    variant={active ? "default" : "secondary"}
                    size="sm"
                    className="rounded-xl"
                    onClick={() => toggleCharacter(c.id)}
                  >
                    {c.id}
                  </Button>
                );
              })
            )}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid grid-cols-2 w-full rounded-2xl">
                <TabsTrigger value="camera" className="rounded-2xl">
                  <span className="inline-flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Camera
                  </span>
                </TabsTrigger>
                <TabsTrigger value="lighting" className="rounded-2xl">
                  <span className="inline-flex items-center gap-2">
                    <Sun className="h-4 w-4" /> Lighting
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="camera" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Lens</Label>
                    <Select
                      value={shot.camera?.lens || "35mm"}
                      onValueChange={(v) => set(["shots", index, "camera", "lens"], v)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select lens" />
                      </SelectTrigger>
                      <SelectContent>
                        {LENS_PRESETS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Camera move</Label>
                    <Select
                      value={shot.camera?.move || "static"}
                      onValueChange={(v) => set(["shots", index, "camera", "move"], v)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select movement" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMERA_MOVES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Depth of field</Label>
                    <Select
                      value={shot.camera?.dof || "medium"}
                      onValueChange={(v) => set(["shots", index, "camera", "dof"], v)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select DOF" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPTH_OF_FIELD.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Aperture (optional)</Label>
                    <Input
                      value={shot.camera?.aperture || ""}
                      onChange={(e) => set(["shots", index, "camera", "aperture"], e.target.value)}
                      placeholder="e.g., f/1.8, f/4"
                    />
                    <InlineHelp>
                      If you don’t care, leave blank. For shallow DOF, typical: f/1.4–f/2.8.
                    </InlineHelp>
                  </div>
                  <div>
                    <Label>Framing notes (optional)</Label>
                    <Input
                      value={shot.camera?.framing_notes || ""}
                      onChange={(e) => set(["shots", index, "camera", "framing_notes"], e.target.value)}
                      placeholder="e.g., rule of thirds, negative space on right"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="lighting" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Lighting preset</Label>
                    <Select
                      value={shot.lighting?.preset || "natural_window"}
                      onValueChange={(v) => set(["shots", index, "lighting", "preset"], v)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select lighting" />
                      </SelectTrigger>
                      <SelectContent>
                        {LIGHTING_PRESETS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InlineHelp>
                      Pick a baseline. Use notes for special practicals, motivated sources, color temps, etc.
                    </InlineHelp>
                  </div>
                  <div>
                    <Label>Lighting notes (optional)</Label>
                    <Input
                      value={shot.lighting?.notes || ""}
                      onChange={(e) => set(["shots", index, "lighting", "notes"], e.target.value)}
                      placeholder="e.g., warm practicals in background, soft rim on hair"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Reference images</div>
            <div className="grid grid-cols-1 gap-3">
              <RefCard
                title={`Lens reference • ${shot.camera?.lens || "35mm"}`}
                imgSrc={lensSrc}
                caption="Quick visual shorthand for FOV / perspective"
              />
              <RefCard
                title={`Lighting reference • ${shot.lighting?.preset || "natural_window"}`}
                imgSrc={lightSrc}
                caption="Quick visual shorthand for key direction / contrast"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StoryboardPromptJsonBuilder() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");

  const jsonObj = useMemo(() => normalizeStoryboard(state), [state]);
  const jsonText = useMemo(() => safeJsonStringify(jsonObj), [jsonObj]);

  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = jsonText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 1400);
    }
  }

  function updateProject(key, value) {
    setState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        [key]: value,
      },
    }));
  }

  function addCharacter() {
    setState((prev) => ({
      ...prev,
      main_characters: [...prev.main_characters, { id: `char_${prev.main_characters.length + 1}`, description: "" }],
    }));
  }

  function updateCharacter(index, key, value) {
    setState((prev) => {
      const next = prev.main_characters.slice();
      next[index] = { ...next[index], [key]: value };
      return { ...prev, main_characters: next };
    });
  }

  function removeCharacter(index) {
    setState((prev) => {
      const removed = prev.main_characters[index]?.id;
      const nextChars = prev.main_characters.filter((_, i) => i !== index);
      // also remove from shots.characters
      const nextShots = prev.shots.map((s) => {
        const chars = (s.characters || []).filter((c) => c !== removed);
        return { ...s, characters: chars };
      });
      return { ...prev, main_characters: nextChars, shots: nextShots };
    });
  }

  function addShot() {
    setState((prev) => {
      const nextNum = (prev.shots?.length || 0) + 1;
      const newShot = {
        shot_number: nextNum,
        shot_type: "medium",
        camera_angle: "eye-level",
        characters: [],
        location: "",
        action: "",
        purpose: "",
        focus: "",
        notes: "",
        text_overlays: "none",
        camera: { lens: "35mm", move: "static", dof: "medium" },
        lighting: { preset: "natural_window", notes: "" },
      };
      return { ...prev, shots: [...prev.shots, newShot] };
    });
  }

  function removeShot(index) {
    setState((prev) => ({
      ...prev,
      shots: prev.shots.filter((_, i) => i !== index),
    }));
  }

  function duplicateShot(index) {
    setState((prev) => {
      const s = prev.shots[index];
      const clone = JSON.parse(JSON.stringify(s));
      clone.shot_number = (prev.shots?.length || 0) + 1;
      return { ...prev, shots: [...prev.shots, clone] };
    });
  }

  function moveShot(index, delta) {
    setState((prev) => {
      const shots = prev.shots.slice();
      const j = index + delta;
      if (j < 0 || j >= shots.length) return prev;
      const tmp = shots[index];
      shots[index] = shots[j];
      shots[j] = tmp;
      return { ...prev, shots };
    });
  }

  function updateOutput(key, value) {
    setState((prev) => ({
      ...prev,
      output: {
        ...prev.output,
        [key]: value,
      },
    }));
  }

  function setFromTemplate(template) {
    setState(template);
    setActiveTab("builder");
  }

  const templates = useMemo(() => {
    const coffee = {
      ...DEFAULT_STATE,
      project: {
        title: "Coffee Shop Meet-Cute",
        aspect_ratio: "16:9",
        visual_style: "cinematic, soft film look, subtle grain",
        consistency_id: "coffee_meetcute_main_characters",
      },
      main_characters: [
        { id: "alex", description: "late 20s male, curly dark hair, casual sweater, glasses" },
        { id: "jordan", description: "late 20s female, shoulder-length brown hair, green cardigan" },
      ],
      shots: [
        {
          shot_number: 1,
          shot_type: "establishing",
          camera_angle: "wide, exterior",
          location: "cozy city coffee shop on a rainy morning",
          action: "people walking with umbrellas, warm light glowing from inside",
          purpose: "set location and mood",
          text_overlays: "none",
          camera: { lens: "24mm", move: "static", dof: "deep" },
          lighting: { preset: "overcast", notes: "warm practicals visible through windows" },
        },
        {
          shot_number: 2,
          shot_type: "medium",
          camera_angle: "interior, eye-level",
          characters: ["alex"],
          location: "inside coffee shop at the counter",
          action: "Alex orders coffee, slightly nervous, glancing at menu",
          focus: "character introduction",
          notes: "leave space on right side of frame for potential text",
          text_overlays: "none",
          camera: { lens: "35mm", move: "static", dof: "medium" },
          lighting: { preset: "natural_window", notes: "soft key from window camera-left" },
        },
        {
          shot_number: 3,
          shot_type: "medium two-shot",
          camera_angle: "eye-level, slightly to the side",
          characters: ["alex", "jordan"],
          location: "pickup counter",
          action: "Alex and Jordan both reach for the same cup at the same time, hands almost touch",
          focus: "moment of connection",
          emotional_tone: "light, awkward, charming",
          text_overlays: "none",
          camera: { lens: "50mm", move: "static", dof: "shallow", aperture: "f/2.0" },
          lighting: { preset: "softbox", notes: "soft fill to keep faces friendly" },
        },
        {
          shot_number: 4,
          shot_type: "close-up",
          camera_angle: "eye-level",
          characters: ["jordan"],
          focus: "Jordan’s amused smile and raised eyebrow",
          action: "Jordan realizes the mix-up and laughs",
          notes: "emphasize facial expression, keep background softly blurred",
          text_overlays: "none",
          camera: { lens: "85mm", move: "static", dof: "shallow", aperture: "f/1.8" },
          lighting: { preset: "natural_window", notes: "gentle rim from practicals behind" },
        },
      ],
      output: {
        layout: "4 panels on a single page",
        labels: "include shot_number and short caption under each frame",
        style: "clean storyboard frames, not fully rendered painting",
      },
    };

    const action = {
      ...DEFAULT_STATE,
      project: {
        title: "Rooftop Chase",
        aspect_ratio: "2.39:1",
        visual_style: "cinematic, high contrast, teal-orange, subtle grain",
        consistency_id: "rooftop_chase_core",
      },
      main_characters: [
        { id: "runner", description: "young adult, athletic, hoodie, determined" },
        { id: "pursuer", description: "adult, trench coat, focused, earpiece" },
      ],
      shots: [
        {
          shot_number: 1,
          shot_type: "establishing",
          camera_angle: "high angle",
          location: "night skyline, rooftops connected by narrow gaps",
          action: "Runner bursts onto roof, rain glistening on vents",
          purpose: "orient geography and stakes",
          text_overlays: "none",
          camera: { lens: "24mm", move: "crane", dof: "deep" },
          lighting: { preset: "neon", notes: "city neon reflections, wet surfaces" },
        },
        {
          shot_number: 2,
          shot_type: "tracking",
          camera_angle: "eye-level",
          characters: ["runner"],
          location: "rooftop corridor between HVAC units",
          action: "camera tracks alongside runner, footsteps splash",
          focus: "kinetic motion",
          text_overlays: "none",
          camera: { lens: "35mm", move: "tracking", dof: "medium" },
          lighting: { preset: "neon", notes: "motivated edge light from signage" },
        },
        {
          shot_number: 3,
          shot_type: "close-up",
          camera_angle: "low angle",
          characters: ["pursuer"],
          location: "roof edge",
          action: "pursuer raises radio, eyes locked forward",
          focus: "threat escalation",
          emotional_tone: "tense",
          text_overlays: "none",
          camera: { lens: "85mm", move: "static", dof: "shallow", aperture: "f/2.0" },
          lighting: { preset: "rim", notes: "strong rim to silhouette coat" },
        },
      ],
      output: {
        layout: "6 panels on a single page",
        labels: "include shot_number and short caption under each frame",
        style: "loose sketch lines, minimal shading",
      },
    };

    return [
      { id: "coffee", name: "Coffee Shop Meet-Cute", data: coffee },
      { id: "action", name: "Rooftop Chase", data: action },
    ];
  }, []);

  const allCharacters = useMemo(
    () => (state.main_characters || []).filter((c) => (c?.id || "").trim().length > 0),
    [state.main_characters]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-muted px-3 py-1 text-sm">
              <Sparkles className="h-4 w-4" />
              Storyboard Prompt Builder
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              Build a copyable JSON prompt for text-to-image storyboards
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Fill in project + characters + shots. The app generates clean JSON (with consistent vocab)
              and lets you copy it to paste into your prompt workflow.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="rounded-2xl"
              onClick={() => setActiveTab("templates")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" /> Templates
            </Button>
            <Button
              className="rounded-2xl"
              onClick={onCopy}
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied" : "Copy JSON"}
            </Button>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full rounded-2xl">
            <TabsTrigger value="builder" className="rounded-2xl">
              Builder
            </TabsTrigger>
            <TabsTrigger value="preview" className="rounded-2xl">
              JSON Preview
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-2xl">
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <SectionTitle
                      icon={FileJson}
                      title="Task + Project"
                      subtitle="High-level settings that apply to the whole storyboard."
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Task</Label>
                        <Input
                          value={state.task}
                          onChange={(e) => setState((p) => ({ ...p, task: e.target.value }))}
                          placeholder="create_storyboard"
                        />
                      </div>
                      <div>
                        <Label>Aspect ratio</Label>
                        <Select
                          value={state.project.aspect_ratio}
                          onValueChange={(v) => updateProject("aspect_ratio", v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select aspect ratio" />
                          </SelectTrigger>
                          <SelectContent>
                            {ASPECT_RATIOS.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Title</Label>
                      <Input
                        value={state.project.title}
                        onChange={(e) => updateProject("title", e.target.value)}
                        placeholder="e.g., Coffee Shop Meet-Cute"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Visual style preset</Label>
                        <Select
                          value={state.project.visual_style}
                          onValueChange={(v) => updateProject("visual_style", v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                            {VISUAL_STYLE_PRESETS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <InlineHelp>
                          You can also pick a preset then tweak it below.
                        </InlineHelp>
                      </div>
                      <div>
                        <Label>Consistency ID</Label>
                        <Input
                          value={state.project.consistency_id}
                          onChange={(e) => updateProject("consistency_id", e.target.value)}
                          placeholder="e.g., coffee_meetcute_main_characters"
                        />
                        <InlineHelp>
                          Use this as a handle to keep characters/style consistent across batches.
                        </InlineHelp>
                      </div>
                    </div>

                    <div>
                      <Label>Visual style (freeform)</Label>
                      <Textarea
                        value={state.project.visual_style}
                        onChange={(e) => updateProject("visual_style", e.target.value)}
                        className="min-h-[80px]"
                        placeholder="cinematic, soft film look, subtle grain"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <SectionTitle
                      icon={ImageIcon}
                      title="Main Characters"
                      subtitle="Create stable IDs you can reference inside shots."
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {state.main_characters.map((c, i) => (
                        <motion.div
                          key={`${c.id}_${i}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="rounded-2xl border p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                              <div>
                                <Label>ID</Label>
                                <Input
                                  value={c.id}
                                  onChange={(e) => updateCharacter(i, "id", e.target.value)}
                                  placeholder="e.g., alex"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label>Description</Label>
                                <Input
                                  value={c.description}
                                  onChange={(e) => updateCharacter(i, "description", e.target.value)}
                                  placeholder="late 20s male, curly dark hair, casual sweater, glasses"
                                />
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => removeCharacter(i)}
                              title="Remove character"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button className="rounded-2xl" onClick={addCharacter}>
                        <Plus className="h-4 w-4 mr-2" /> Add character
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Tip: keep IDs short (alex, jordan) so shots stay clean.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <SectionTitle
                      icon={Camera}
                      title="Shots"
                      subtitle="Each shot becomes a prompt chunk. Add camera/lighting details as needed."
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-5">
                      {state.shots.map((shot, idx) => (
                        <ShotCard
                          key={`${shot.shot_number ?? idx}_${idx}`}
                          shot={shot}
                          index={idx}
                          allCharacters={allCharacters}
                          onChange={(updater) => setState(updater)}
                          onRemove={removeShot}
                          onDuplicate={duplicateShot}
                          onMove={moveShot}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button className="rounded-2xl" onClick={addShot}>
                        <Plus className="h-4 w-4 mr-2" /> Add shot
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Keep shot_number unique. Reorder with ↑/↓ or just edit shot_number.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <SectionTitle
                      icon={LayoutGrid}
                      title="Output"
                      subtitle="How you want the storyboard frames delivered." 
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Layout</Label>
                        <Select
                          value={state.output.layout}
                          onValueChange={(v) => updateOutput("layout", v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select layout" />
                          </SelectTrigger>
                          <SelectContent>
                            {OUTPUT_LAYOUTS.map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Labels</Label>
                        <Select
                          value={state.output.labels}
                          onValueChange={(v) => updateOutput("labels", v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select labels" />
                          </SelectTrigger>
                          <SelectContent>
                            {OUTPUT_LABELS.map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Frame style</Label>
                        <Select
                          value={state.output.style}
                          onValueChange={(v) => updateOutput("style", v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                            {OUTPUT_STYLE.map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <SectionTitle
                      icon={Copy}
                      title="Live JSON"
                      subtitle="Copy/paste into your prompt workflow." 
                    />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Button className="rounded-2xl" onClick={onCopy}>
                        {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {copied ? "Copied" : "Copy JSON"}
                      </Button>
                      <Button
                        variant="secondary"
                        className="rounded-2xl"
                        onClick={() => {
                          setState(DEFAULT_STATE);
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                    <div className="rounded-2xl border bg-muted/40 overflow-hidden">
                      <pre className="p-4 text-xs overflow-auto max-h-[520px] leading-relaxed">
{jsonText}
                      </pre>
                    </div>
                    <InlineHelp>
                      Optional fields are omitted when blank, so the JSON stays clean.
                    </InlineHelp>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader>
                    <SectionTitle
                      icon={Sun}
                      title="Reference library"
                      subtitle="Quick cheat-sheets for FOV and lighting style."
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="text-sm font-medium">Lenses</div>
                      <div className="grid grid-cols-1 gap-3">
                        {LENS_PRESETS.slice(0, 3).map((l) => (
                          <RefCard
                            key={l.value}
                            title={l.label}
                            imgSrc={REF_IMAGES.lenses[l.value]}
                            caption="Use in shots → camera.lens"
                          />
                        ))}
                      </div>
                      <div className="text-sm font-medium mt-2">Lighting</div>
                      <div className="grid grid-cols-1 gap-3">
                        {LIGHTING_PRESETS.slice(0, 3).map((p) => (
                          <RefCard
                            key={p.value}
                            title={p.label}
                            imgSrc={REF_IMAGES.lighting[p.value]}
                            caption="Use in shots → lighting.preset"
                          />
                        ))}
                      </div>
                    </div>
                    <InlineHelp>
                      These are lightweight illustrations (SVG) so the app works offline.
                      Swap these with real photos later if you want.
                    </InlineHelp>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <SectionTitle icon={FileJson} title="JSON Preview" subtitle="This is exactly what gets copied." />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Button className="rounded-2xl" onClick={onCopy}>
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? "Copied" : "Copy JSON"}
                  </Button>
                  <Badge variant="secondary" className="rounded-xl">
                    {Math.max(0, state.shots.length)} shots
                  </Badge>
                  <Badge variant="secondary" className="rounded-xl">
                    {Math.max(0, state.main_characters.length)} characters
                  </Badge>
                </div>
                <div className="rounded-2xl border bg-muted/40 overflow-hidden">
                  <pre className="p-4 text-sm overflow-auto max-h-[70vh] leading-relaxed">
{jsonText}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <SectionTitle
                  icon={LayoutGrid}
                  title="Templates"
                  subtitle="Start from a working example, then customize."
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((t) => (
                    <motion.div
                      key={t.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                      className="rounded-2xl border p-4 bg-card shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold">{t.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {t.data.shots.length} shots • {t.data.project.aspect_ratio} • {t.data.project.title}
                          </div>
                        </div>
                        <Button
                          className="rounded-2xl"
                          onClick={() => setFromTemplate(t.data)}
                        >
                          Use
                        </Button>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <RefCard
                          title="Lens sample"
                          imgSrc={REF_IMAGES.lenses[t.data.shots[0]?.camera?.lens || "35mm"]}
                          caption=""
                        />
                        <RefCard
                          title="Lighting sample"
                          imgSrc={REF_IMAGES.lighting[t.data.shots[0]?.lighting?.preset || "natural_window"]}
                          caption=""
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold">Import / Export</div>
                    <div className="text-sm text-muted-foreground">
                      Paste JSON below to load it into the builder, or export current state.
                    </div>
                  </div>
                </div>

                <ImportExportPanel state={state} setState={setState} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="py-8 text-sm text-muted-foreground">
          Built for storyboard prompt generation. Add your own vocab lists (shot types, lenses, lighting)
          to match your team’s style guide.
        </footer>
      </div>
    </div>
  );
}

function ImportExportPanel({ state, setState }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const exportText = useMemo(() => safeJsonStringify(normalizeStoryboard(state)), [state]);

  function onLoad() {
    setErr("");
    try {
      const obj = JSON.parse(text);

      // Minimal compatibility: accept either builder-state shape or the exported normalized JSON.
      // If it's normalized JSON, map it back into builder state.
      if (obj && obj.project && Array.isArray(obj.shots)) {
        const builder = {
          task: obj.task || "create_storyboard",
          project: {
            title: obj.project.title || "",
            aspect_ratio: obj.project.aspect_ratio || "16:9",
            visual_style: obj.project.visual_style || VISUAL_STYLE_PRESETS[0],
            consistency_id: obj.project.consistency_id || "",
          },
          main_characters: Array.isArray(obj.main_characters) ? obj.main_characters : [],
          shots: obj.shots.map((s, i) => ({
            shot_number: s.shot_number ?? i + 1,
            shot_type: s.shot_type || "medium",
            camera_angle: s.camera_angle || "eye-level",
            characters: s.characters || [],
            location: s.location || "",
            action: s.action || "",
            purpose: s.purpose || "",
            focus: s.focus || "",
            notes: s.notes || "",
            text_overlays: s.text_overlays || "none",
            emotional_tone: s.emotional_tone || "",
            camera: {
              lens: s.camera?.lens || "35mm",
              move: s.camera?.move || "static",
              dof: s.camera?.dof || "medium",
              aperture: s.camera?.aperture || "",
              framing_notes: s.camera?.framing_notes || "",
            },
            lighting: {
              preset: s.lighting?.preset || "natural_window",
              notes: s.lighting?.notes || "",
            },
          })),
          output: {
            layout: obj.output?.layout || OUTPUT_LAYOUTS[0],
            labels: obj.output?.labels || OUTPUT_LABELS[0],
            style: obj.output?.style || OUTPUT_STYLE[0],
          },
        };

        setState(builder);
        setText("");
        return;
      }

      // If not matching, attempt to set directly (for future expansion)
      setState(obj);
      setText("");
    } catch (e) {
      setErr("Could not parse JSON. Make sure it is valid JSON (double quotes, no trailing commas).");
    }
  }

  async function onCopyExport() {
    try {
      await navigator.clipboard.writeText(exportText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = exportText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Import JSON</div>
          <Button variant="secondary" className="rounded-2xl" onClick={onLoad}>
            Load
          </Button>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-3 min-h-[180px]"
          placeholder="Paste JSON here..."
        />
        {err ? <div className="mt-2 text-sm text-red-500">{err}</div> : null}
      </div>

      <div className="rounded-2xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Export (normalized JSON)</div>
          <Button className="rounded-2xl" onClick={onCopyExport}>
            <Copy className="h-4 w-4 mr-2" /> Copy
          </Button>
        </div>
        <div className="mt-3 rounded-2xl border bg-muted/40 overflow-hidden">
          <pre className="p-3 text-xs overflow-auto max-h-[220px] leading-relaxed">{exportText}</pre>
        </div>
      </div>
    </div>
  );
}
