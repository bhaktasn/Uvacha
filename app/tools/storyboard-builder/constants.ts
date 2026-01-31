export const ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:2", "2.39:1", "21:9"];

export const VISUAL_STYLE_PRESETS = [
  "cinematic, soft film look, subtle grain",
  "clean digital, sharp, high contrast",
  "anime, vibrant, cel-shaded",
  "noir, high contrast, rain-soaked",
  "dreamy, pastel, bloom, soft focus",
  "documentary, handheld, natural light",
  "photoreal, studio lighting, crisp",
];

export const SHOT_TYPES = [
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

export const CAMERA_ANGLES = [
  "eye-level",
  "high angle",
  "low angle",
  "dutch angle",
  "top-down",
  "wide, exterior",
  "interior, eye-level",
  "eye-level, slightly to the side",
];

export const CAMERA_MOVES = [
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

export const LENS_PRESETS = [
  { label: "14mm (ultra-wide)", value: "14mm" },
  { label: "24mm (wide)", value: "24mm" },
  { label: "35mm (wide/normal)", value: "35mm" },
  { label: "50mm (normal)", value: "50mm" },
  { label: "85mm (portrait)", value: "85mm" },
  { label: "135mm (tele)", value: "135mm" },
];

export const DEPTH_OF_FIELD = [
  { label: "Deep (everything sharp)", value: "deep" },
  { label: "Medium", value: "medium" },
  { label: "Shallow (background blur)", value: "shallow" },
];

export const LIGHTING_PRESETS = [
  { label: "Natural window light", value: "natural_window" },
  { label: "Softbox key + fill", value: "softbox" },
  { label: "Backlit / rim light", value: "rim" },
  { label: "Neon / practicals", value: "neon" },
  { label: "Golden hour", value: "golden_hour" },
  { label: "Overcast / diffused", value: "overcast" },
  { label: "Hard spotlight", value: "spot" },
];

export const OUTPUT_LAYOUTS = [
  "4 panels on a single page",
  "6 panels on a single page",
  "9 panels grid",
  "one shot per page",
];

export const OUTPUT_LABELS = [
  "include shot_number and short caption under each frame",
  "shot_number only",
  "caption only",
  "no labels",
];

export const OUTPUT_STYLE = [
  "clean storyboard frames, not fully rendered painting",
  "loose sketch lines, minimal shading",
  "photographic frames with overlays",
  "comic panel style with gutters",
];

