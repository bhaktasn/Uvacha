import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Trash2, Wand2, Plus, X } from "lucide-react";

/**
 * Text-to-Image Prompt JSON Builder
 * - Intuitive form with dropdowns where they make sense (camera, output).
 * - Produces a copyable JSON string.
 * - Includes reference image tiles (stylized SVG) at the bottom of Camera + Lighting sections.
 * - No external dependencies beyond shadcn/ui + framer-motion.
 */

// ---------- Helpers ----------
const clampInt = (v: string, fallback: number) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const safeJson = (obj: any) => JSON.stringify(obj, null, 2);

const downloadText = (filename: string, text: string) => {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const classNames = (...xs: Array<string | false | undefined | null>) => xs.filter(Boolean).join(" ");

// ---------- Reference “Images” (inline SVG posters) ----------
// Note: Real photographic examples would normally be actual images.
// Here we use inline SVG tiles that look like reference cards so this can run standalone.

function SvgPoster({ title, subtitle, icon = "lens" }: { title: string; subtitle: string; icon?: "lens" | "aperture" | "shutter" | "iso" | "light" | "bokeh" }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-black/0 to-black/10" />
      </div>
      <svg viewBox="0 0 400 240" className="w-full h-auto block">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgb(240,240,240)" />
            <stop offset="1" stopColor="rgb(225,225,225)" />
          </linearGradient>
          <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(210,210,210)" />
            <stop offset="1" stopColor="rgb(245,245,245)" />
          </linearGradient>
          <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.18)" />
          </filter>
        </defs>
        <rect x="0" y="0" width="400" height="240" fill="url(#g)" />
        <path d="M0,160 C80,140 120,200 200,180 C280,160 320,110 400,130 L400,240 L0,240 Z" fill="url(#g2)" />

        {/* Icon */}
        {icon === "lens" && (
          <g filter="url(#s)" transform="translate(38 48)">
            <rect x="0" y="0" width="132" height="132" rx="22" fill="white" />
            <circle cx="66" cy="66" r="40" fill="rgba(0,0,0,0.06)" />
            <circle cx="66" cy="66" r="30" fill="rgba(0,0,0,0.10)" />
            <circle cx="66" cy="66" r="14" fill="rgba(0,0,0,0.18)" />
            <path d="M66 30 L76 46 L96 50 L82 64 L84 84 L66 74 L48 84 L50 64 L36 50 L56 46 Z" fill="rgba(0,0,0,0.08)" />
          </g>
        )}
        {icon === "aperture" && (
          <g filter="url(#s)" transform="translate(38 48)">
            <rect x="0" y="0" width="132" height="132" rx="22" fill="white" />
            <circle cx="66" cy="66" r="46" fill="rgba(0,0,0,0.06)" />
            {[...Array(7)].map((_, i) => (
              <path
                key={i}
                d="M66 26 L90 56 L72 62 Z"
                fill="rgba(0,0,0,0.12)"
                transform={`rotate(${i * 360 / 7} 66 66)`}
              />
            ))}
            <circle cx="66" cy="66" r="16" fill="rgba(255,255,255,0.9)" />
          </g>
        )}
        {icon === "shutter" && (
          <g filter="url(#s)" transform="translate(38 48)">
            <rect x="0" y="0" width="132" height="132" rx="22" fill="white" />
            <circle cx="66" cy="66" r="46" fill="rgba(0,0,0,0.06)" />
            {[...Array(6)].map((_, i) => (
              <path
                key={i}
                d="M66 30 L96 60 L66 96 L36 60 Z"
                fill="rgba(0,0,0,0.10)"
                transform={`rotate(${i * 60} 66 66)`}
              />
            ))}
            <circle cx="66" cy="66" r="14" fill="rgba(255,255,255,0.92)" />
          </g>
        )}
        {icon === "iso" && (
          <g filter="url(#s)" transform="translate(38 48)">
            <rect x="0" y="0" width="132" height="132" rx="22" fill="white" />
            <rect x="28" y="36" width="76" height="20" rx="10" fill="rgba(0,0,0,0.10)" />
            <rect x="28" y="66" width="76" height="20" rx="10" fill="rgba(0,0,0,0.08)" />
            <rect x="28" y="96" width="76" height="20" rx="10" fill="rgba(0,0,0,0.06)" />
            <circle cx="58" cy="46" r="7" fill="rgba(0,0,0,0.18)" />
            <circle cx="74" cy="76" r="7" fill="rgba(0,0,0,0.18)" />
            <circle cx="90" cy="106" r="7" fill="rgba(0,0,0,0.18)" />
          </g>
        )}
        {icon === "light" && (
          <g filter="url(#s)" transform="translate(38 48)">
            <rect x="0" y="0" width="132" height="132" rx="22" fill="white" />
            <path d="M66 24 C88 24 104 42 104 62 C104 82 90 90 84 102 C80 110 80 116 80 120 L52 120 C52 116 52 110 48 102 C42 90 28 82 28 62 C28 42 44 24 66 24 Z" fill="rgba(0,0,0,0.10)" />
            <rect x="52" y="120" width="28" height="14" rx="7" fill="rgba(0,0,0,0.14)" />
            {[...Array(8)].map((_, i) => (
              <path
                key={i}
                d="M66 10 L66 22"
                stroke="rgba(0,0,0,0.14)"
                strokeWidth="4"
                strokeLinecap="round"
                transform={`rotate(${i * 45} 66 66)`}
              />
            ))}
          </g>
        )}
        {icon === "bokeh" && (
          <g filter="url(#s)" transform="translate(38 48)">
            <rect x="0" y="0" width="132" height="132" rx="22" fill="white" />
            <circle cx="44" cy="52" r="18" fill="rgba(0,0,0,0.08)" />
            <circle cx="82" cy="66" r="24" fill="rgba(0,0,0,0.10)" />
            <circle cx="64" cy="92" r="16" fill="rgba(0,0,0,0.06)" />
            <circle cx="92" cy="40" r="10" fill="rgba(0,0,0,0.06)" />
          </g>
        )}

        {/* Text area */}
        <g transform="translate(190 62)">
          <text x="0" y="0" fontSize="18" fontWeight="700" fill="rgba(0,0,0,0.85)">
            {title}
          </text>
          <text x="0" y="26" fontSize="13" fill="rgba(0,0,0,0.55)">
            {subtitle}
          </text>
          <rect x="0" y="44" width="180" height="10" rx="5" fill="rgba(0,0,0,0.08)" />
          <rect x="0" y="62" width="160" height="10" rx="5" fill="rgba(0,0,0,0.06)" />
          <rect x="0" y="80" width="140" height="10" rx="5" fill="rgba(0,0,0,0.05)" />
        </g>
      </svg>
      <div className="p-3">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}

// ---------- Tag editor ----------
function TagEditor({
  label,
  description,
  tags,
  onChange,
  placeholder = "Add item and press Enter",
}: {
  label: string;
  description?: string;
  tags: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return;
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...tags, trimmed]);
    setDraft("");
  };

  const remove = (idx: number) => {
    const next = tags.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-sm">{label}</Label>
        {description ? (
          <div className="text-xs text-muted-foreground">{description}</div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t, idx) => (
          <Badge key={`${t}-${idx}`} variant="secondary" className="gap-1 pr-1">
            <span className="max-w-[260px] truncate">{t}</span>
            <button
              type="button"
              className="ml-1 inline-flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5"
              onClick={() => remove(idx)}
              aria-label={`Remove ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          }
        }}
      />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => add(draft)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([])}
          className={classNames(tags.length === 0 && "opacity-50")}
          disabled={tags.length === 0}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Clear
        </Button>
      </div>
    </div>
  );
}

// ---------- Main App ----------
const defaultState = {
  task: "create_photo",
  subject: {
    type: "person",
    age: "late 20s",
    gender: "female",
    ethnicity: "East Asian",
    clothing: "casual streetwear, oversized denim jacket, white sneakers",
    expression: "subtle smile, relaxed",
    pose: "standing, hands in pockets, looking slightly to the left",
  },
  environment: {
    location: "nighttime city street in Tokyo",
    background_elements: [
      "neon signs in Japanese",
      "slightly wet pavement reflecting lights",
      "soft bokeh traffic in distance",
    ],
    mood: "cinematic, moody but vibrant",
  },
  camera: {
    camera_type: "DSLR",
    lens: "35mm",
    aperture: "f/1.8",
    shutter_speed: "1/160",
    iso: 800,
    framing: "medium shot, subject centered",
    focus: "eyes perfectly sharp, background blurred",
    color_grading: "teal and orange, high contrast",
  },
  lighting: {
    style: "mixed natural and artificial",
    key_light: "neon signs to the right of subject",
    fill_light: "soft ambient city glow",
    highlights: "gentle specular highlights on jacket",
    shadows: "soft shadows, no crushed blacks",
  },
  output: {
    format: "16:9",
    resolution: "4K",
    style: "hyper-realistic, no painterly artifacts",
    consistency_id: "street_portrait_tokyo_01",
  },
} as const;

const TASKS = [
  { value: "create_photo", label: "Create photo" },
  { value: "create_illustration", label: "Create illustration" },
  { value: "create_product_photo", label: "Create product photo" },
  { value: "create_scene", label: "Create scene" },
];

const SUBJECT_TYPES = [
  "person",
  "animal",
  "object",
  "vehicle",
  "architecture",
  "food",
  "character",
  "creature",
];

const GENDERS = ["female", "male", "non-binary", "unspecified"];

const CAMERA_TYPES = ["DSLR", "Mirrorless", "Medium format", "Film", "Smartphone"];

const LENSES = [
  { value: "24mm", label: "24mm (wide)" },
  { value: "35mm", label: "35mm (street)" },
  { value: "50mm", label: "50mm (standard)" },
  { value: "85mm", label: "85mm (portrait)" },
  { value: "105mm", label: "105mm (tele/portrait)" },
  { value: "135mm", label: "135mm (tele)" },
];

const APERTURES = [
  "f/1.2",
  "f/1.4",
  "f/1.8",
  "f/2.0",
  "f/2.8",
  "f/4",
  "f/5.6",
  "f/8",
  "f/11",
  "f/16",
];

const SHUTTER_SPEEDS = [
  "1/30",
  "1/60",
  "1/80",
  "1/100",
  "1/125",
  "1/160",
  "1/200",
  "1/250",
  "1/320",
  "1/500",
  "1/1000",
  "1/2000",
];

const ISOS = [100, 200, 400, 800, 1600, 3200, 6400];

const ASPECTS = ["1:1", "4:5", "3:2", "16:9", "9:16", "21:9"];

const RESOLUTIONS = [
  { value: "1080p", label: "1080p" },
  { value: "2K", label: "2K" },
  { value: "4K", label: "4K" },
  { value: "8K", label: "8K" },
];

const RENDER_STYLES = [
  "hyper-realistic",
  "cinematic",
  "editorial",
  "film still",
  "clean studio",
  "vintage film",
  "analog grain",
  "3D render",
  "anime",
  "watercolor",
  "oil painting",
  "comic",
];

const LIGHTING_STYLES = [
  "natural",
  "studio",
  "mixed natural and artificial",
  "neon",
  "golden hour",
  "overcast softbox",
  "hard flash",
  "low-key dramatic",
  "high-key",
];

function FieldRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={classNames("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>{children}</div>;
}

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-lg font-semibold">{title}</div>
        {subtitle ? <div className="text-sm text-muted-foreground">{subtitle}</div> : null}
      </div>
      {right}
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<any>(() => {
    // Restore from localStorage if present
    try {
      const raw = localStorage.getItem("prompt_json_builder_state_v1");
      if (raw) return { ...defaultState, ...JSON.parse(raw) };
    } catch {}
    return defaultState;
  });

  const [compact, setCompact] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const outRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("prompt_json_builder_state_v1", JSON.stringify(state));
    } catch {}
  }, [state]);

  const jsonObj = useMemo(() => {
    // Keep the schema minimal: omit empty arrays/strings if user wants compact mode.
    // Compact mode here affects JSON cleanliness (not spacing) by pruning empties.
    const prune = (o: any): any => {
      if (Array.isArray(o)) {
        const arr = o.map(prune).filter((x) => !(typeof x === "string" && x.trim() === ""));
        return arr;
      }
      if (o && typeof o === "object") {
        const out: any = {};
        for (const [k, v] of Object.entries(o)) {
          const pv = prune(v);
          const isEmptyString = typeof pv === "string" && pv.trim() === "";
          const isEmptyArray = Array.isArray(pv) && pv.length === 0;
          const isEmptyObj = pv && typeof pv === "object" && !Array.isArray(pv) && Object.keys(pv).length === 0;
          if (compact) {
            if (pv === null || pv === undefined || isEmptyString || isEmptyArray || isEmptyObj) continue;
          }
          out[k] = pv;
        }
        return out;
      }
      return o;
    };

    try {
      setJsonError(null);
      return prune(state);
    } catch (e: any) {
      setJsonError(e?.message ?? "Unknown error building JSON");
      return state;
    }
  }, [state, compact]);

  const jsonText = useMemo(() => safeJson(jsonObj), [jsonObj]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Fallback: select and let user copy
      outRef.current?.focus();
      outRef.current?.select();
    }
  };

  const reset = () => {
    setState(defaultState);
  };

  const setDeep = (path: string[], value: any) => {
    setState((prev: any) => {
      const next = structuredClone(prev);
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        if (!cur[k] || typeof cur[k] !== "object") cur[k] = {};
        cur = cur[k];
      }
      cur[path[path.length - 1]] = value;
      return next;
    });
  };

  // Quick suggestions (light “magic”): generate a consistency id
  const genConsistency = () => {
    const s = state;
    const bits = [
      s?.subject?.type,
      (s?.environment?.location || "").split(" ").slice(0, 2).join("_"),
      (s?.output?.style || "").split(",")[0]?.trim()?.replace(/\s+/g, "_"),
      new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    ]
      .filter(Boolean)
      .map((x: string) => String(x).toLowerCase().replace(/[^a-z0-9_]+/g, "_"))
      .join("_");
    setDeep(["output", "consistency_id"], bits || "prompt_01");
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-bold tracking-tight">Prompt JSON Builder</div>
              <div className="text-sm text-muted-foreground">
                Fill the fields → copy a clean JSON blob for text-to-image prompting.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
                <Switch checked={compact} onCheckedChange={setCompact} id="compact" />
                <Label htmlFor="compact" className="text-sm">Prune empty fields</Label>
              </div>
              <Button variant="secondary" onClick={copy} className="gap-2">
                <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy JSON"}
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadText("prompt.json", jsonText)}
                className="gap-2"
              >
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="ghost" onClick={reset} className="gap-2">
                <Trash2 className="h-4 w-4" /> Reset
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Form */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Inputs</CardTitle>
                <CardDescription>
                  Use dropdowns for camera/output and free-text for creative intent.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Tabs defaultValue="subject" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="subject">Subject</TabsTrigger>
                    <TabsTrigger value="environment">Env</TabsTrigger>
                    <TabsTrigger value="camera">Camera</TabsTrigger>
                    <TabsTrigger value="lighting">Light</TabsTrigger>
                    <TabsTrigger value="output">Output</TabsTrigger>
                  </TabsList>

                  {/* Subject */}
                  <TabsContent value="subject" className="mt-4 space-y-5">
                    <SectionHeader
                      title="Task"
                      subtitle="The top-level intent (you can extend later)."
                    />
                    <FieldRow>
                      <div className="space-y-2">
                        <Label>Task</Label>
                        <Select value={state.task} onValueChange={(v) => setDeep(["task"], v)}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select task" />
                          </SelectTrigger>
                          <SelectContent>
                            {TASKS.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Consistency ID</Label>
                        <div className="flex gap-2">
                          <Input
                            className="rounded-xl"
                            value={state.output.consistency_id}
                            onChange={(e) => setDeep(["output", "consistency_id"], e.target.value)}
                            placeholder="street_portrait_tokyo_01"
                          />
                          <Button variant="secondary" onClick={genConsistency} className="gap-2">
                            <Wand2 className="h-4 w-4" /> Gen
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Helpful for reruns/variations: keep the ID stable for a “series”.
                        </div>
                      </div>
                    </FieldRow>

                    <Separator />

                    <SectionHeader
                      title="Subject"
                      subtitle="Describe who/what the model should depict."
                    />
                    <FieldRow>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={state.subject.type}
                          onValueChange={(v) => setDeep(["subject", "type"], v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBJECT_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Age</Label>
                        <Input
                          className="rounded-xl"
                          value={state.subject.age}
                          onChange={(e) => setDeep(["subject", "age"], e.target.value)}
                          placeholder="late 20s"
                        />
                      </div>
                    </FieldRow>

                    <FieldRow>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select
                          value={state.subject.gender}
                          onValueChange={(v) => setDeep(["subject", "gender"], v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENDERS.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Ethnicity</Label>
                        <Input
                          className="rounded-xl"
                          value={state.subject.ethnicity}
                          onChange={(e) => setDeep(["subject", "ethnicity"], e.target.value)}
                          placeholder="East Asian"
                        />
                      </div>
                    </FieldRow>

                    <div className="space-y-2">
                      <Label>Clothing</Label>
                      <Textarea
                        className="rounded-xl min-h-[90px]"
                        value={state.subject.clothing}
                        onChange={(e) => setDeep(["subject", "clothing"], e.target.value)}
                        placeholder="casual streetwear, oversized denim jacket, white sneakers"
                      />
                    </div>

                    <FieldRow>
                      <div className="space-y-2">
                        <Label>Expression</Label>
                        <Input
                          className="rounded-xl"
                          value={state.subject.expression}
                          onChange={(e) => setDeep(["subject", "expression"], e.target.value)}
                          placeholder="subtle smile, relaxed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pose</Label>
                        <Input
                          className="rounded-xl"
                          value={state.subject.pose}
                          onChange={(e) => setDeep(["subject", "pose"], e.target.value)}
                          placeholder="standing, hands in pockets, looking slightly to the left"
                        />
                      </div>
                    </FieldRow>
                  </TabsContent>

                  {/* Environment */}
                  <TabsContent value="environment" className="mt-4 space-y-5">
                    <SectionHeader
                      title="Environment"
                      subtitle="Where it happens + what’s in the background."
                    />
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        className="rounded-xl"
                        value={state.environment.location}
                        onChange={(e) => setDeep(["environment", "location"], e.target.value)}
                        placeholder="nighttime city street in Tokyo"
                      />
                    </div>

                    <TagEditor
                      label="Background elements"
                      description="Add multiple details for better composition control."
                      tags={state.environment.background_elements}
                      onChange={(v) => setDeep(["environment", "background_elements"], v)}
                      placeholder="e.g., neon signs in Japanese"
                    />

                    <div className="space-y-2">
                      <Label>Mood</Label>
                      <Input
                        className="rounded-xl"
                        value={state.environment.mood}
                        onChange={(e) => setDeep(["environment", "mood"], e.target.value)}
                        placeholder="cinematic, moody but vibrant"
                      />
                      <div className="text-xs text-muted-foreground">
                        Tip: include adjectives for vibe + constraints like “no haze”, “clean shadows”.
                      </div>
                    </div>
                  </TabsContent>

                  {/* Camera */}
                  <TabsContent value="camera" className="mt-4 space-y-5">
                    <SectionHeader
                      title="Camera"
                      subtitle="Photographic intent: lens, exposure, framing, focus, grading."
                    />
                    <FieldRow>
                      <div className="space-y-2">
                        <Label>Camera type</Label>
                        <Select
                          value={state.camera.camera_type}
                          onValueChange={(v) => setDeep(["camera", "camera_type"], v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {CAMERA_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Lens</Label>
                        <Select
                          value={state.camera.lens}
                          onValueChange={(v) => setDeep(["camera", "lens"], v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {LENSES.map((l) => (
                              <SelectItem key={l.value} value={l.value}>
                                {l.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FieldRow>

                    <FieldRow>
                      <div className="space-y-2">
                        <Label>Aperture</Label>
                        <Select
                          value={state.camera.aperture}
                          onValueChange={(v) => setDeep(["camera", "aperture"], v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {APERTURES.map((a) => (
                              <SelectItem key={a} value={a}>
                                {a}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Shutter speed</Label>
                        <Select
                          value={state.camera.shutter_speed}
                          onValueChange={(v) => setDeep(["camera", "shutter_speed"], v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {SHUTTER_SPEEDS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FieldRow>

                    <FieldRow>
                      <div className="space-y-2">
                        <Label>ISO</Label>
                        <Select
                          value={String(state.camera.iso)}
                          onValueChange={(v) => setDeep(["camera", "iso"], clampInt(v, 800))}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {ISOS.map((i) => (
                              <SelectItem key={i} value={String(i)}>
                                {i}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Framing</Label>
                        <Input
                          className="rounded-xl"
                          value={state.camera.framing}
                          onChange={(e) => setDeep(["camera", "framing"], e.target.value)}
                          placeholder="medium shot, subject centered"
                        />
                      </div>
                    </FieldRow>

                    <div className="space-y-2">
                      <Label>Focus</Label>
                      <Input
                        className="rounded-xl"
                        value={state.camera.focus}
                        onChange={(e) => setDeep(["camera", "focus"], e.target.value)}
                        placeholder="eyes perfectly sharp, background blurred"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Color grading</Label>
                      <Input
                        className="rounded-xl"
                        value={state.camera.color_grading}
                        onChange={(e) => setDeep(["camera", "color_grading"], e.target.value)}
                        placeholder="teal and orange, high contrast"
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">Camera reference cards</div>
                          <div className="text-xs text-muted-foreground">
                            Visual reminders for “what changing this does”. (Swap these for real photos later.)
                          </div>
                        </div>
                        <Badge variant="secondary">Reference</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <SvgPoster title="35mm" subtitle="Natural perspective, street/editorial" icon="lens" />
                        <SvgPoster title="85mm" subtitle="Compressed background, portrait look" icon="lens" />
                        <SvgPoster title="f/1.8" subtitle="Shallow DoF, strong subject separation" icon="aperture" />
                        <SvgPoster title="1/160" subtitle="Freezes walk-level motion" icon="shutter" />
                        <SvgPoster title="ISO 800" subtitle="Indoor/night tradeoffs (noise)" icon="iso" />
                        <SvgPoster title="Bokeh" subtitle="Blur circles, highlight softness" icon="bokeh" />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Lighting */}
                  <TabsContent value="lighting" className="mt-4 space-y-5">
                    <SectionHeader
                      title="Lighting"
                      subtitle="Key/fill + highlights/shadows. Use this to “lock in” the look." 
                    />

                    <div className="space-y-2">
                      <Label>Style</Label>
                      <Select
                        value={state.lighting.style}
                        onValueChange={(v) => setDeep(["lighting", "style"], v)}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {LIGHTING_STYLES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <FieldRow>
                      <div className="space-y-2">
                        <Label>Key light</Label>
                        <Input
                          className="rounded-xl"
                          value={state.lighting.key_light}
                          onChange={(e) => setDeep(["lighting", "key_light"], e.target.value)}
                          placeholder="neon signs to the right of subject"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fill light</Label>
                        <Input
                          className="rounded-xl"
                          value={state.lighting.fill_light}
                          onChange={(e) => setDeep(["lighting", "fill_light"], e.target.value)}
                          placeholder="soft ambient city glow"
                        />
                      </div>
                    </FieldRow>

                    <FieldRow>
                      <div className="space-y-2">
                        <Label>Highlights</Label>
                        <Input
                          className="rounded-xl"
                          value={state.lighting.highlights}
                          onChange={(e) => setDeep(["lighting", "highlights"], e.target.value)}
                          placeholder="gentle specular highlights on jacket"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Shadows</Label>
                        <Input
                          className="rounded-xl"
                          value={state.lighting.shadows}
                          onChange={(e) => setDeep(["lighting", "shadows"], e.target.value)}
                          placeholder="soft shadows, no crushed blacks"
                        />
                      </div>
                    </FieldRow>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">Lighting reference cards</div>
                          <div className="text-xs text-muted-foreground">
                            Common setups you can map to prompt language.
                          </div>
                        </div>
                        <Badge variant="secondary">Reference</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <SvgPoster title="Key + Fill" subtitle="Soft key, subtle fill, controlled contrast" icon="light" />
                        <SvgPoster title="Low-key" subtitle="Deep shadows, bright highlights, dramatic" icon="light" />
                        <SvgPoster title="Neon" subtitle="Colored practicals, rim light, wet reflections" icon="light" />
                        <SvgPoster title="Overcast" subtitle="Even soft light, minimal speculars" icon="light" />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Output */}
                  <TabsContent value="output" className="mt-4 space-y-5">
                    <SectionHeader
                      title="Output"
                      subtitle="Aspect ratio, resolution, and rendering style constraints."
                    />

                    <FieldRow>
                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Select
                          value={state.output.format}
                          onValueChange={(v) => setDeep(["output", "format"], v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {ASPECTS.map((a) => (
                              <SelectItem key={a} value={a}>
                                {a}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Resolution</Label>
                        <Select
                          value={state.output.resolution}
                          onValueChange={(v) => setDeep(["output", "resolution"], v)}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {RESOLUTIONS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FieldRow>

                    <div className="space-y-2">
                      <Label>Style</Label>
                      <Select
                        value={state.output.style}
                        onValueChange={(v) => setDeep(["output", "style"], v)}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {RENDER_STYLES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-muted-foreground">
                        Add constraints like “no painterly artifacts”, “no extra fingers”, etc. as needed.
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Fine style notes</Label>
                      <Textarea
                        className="rounded-xl min-h-[90px]"
                        value={state.output.style_notes ?? ""}
                        onChange={(e) => setDeep(["output", "style_notes"], e.target.value)}
                        placeholder="Optional: e.g., no painterly artifacts, natural skin texture, realistic lighting..."
                      />
                      <div className="text-xs text-muted-foreground">
                        This is optional and will be removed if you enable “Prune empty fields”.
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* RIGHT: JSON */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Generated JSON</CardTitle>
                <CardDescription>
                  Copy this into your prompt pipeline (or store it as metadata).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {jsonError ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <div className="font-semibold text-destructive">JSON error</div>
                    <div className="text-muted-foreground">{jsonError}</div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={copy} className="gap-2">
                    <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => downloadText("prompt.json", jsonText)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" /> Download
                  </Button>
                  <Button variant="outline" onClick={() => {
                    outRef.current?.focus();
                    outRef.current?.select();
                  }}>
                    Select all
                  </Button>
                </div>

                <Textarea
                  ref={outRef}
                  className="rounded-2xl min-h-[520px] font-mono text-xs leading-5"
                  value={jsonText}
                  onChange={(e) => {
                    // Allow advanced users to edit JSON directly and sync back.
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setState((prev: any) => ({ ...prev, ...parsed }));
                      setJsonError(null);
                    } catch (err: any) {
                      setJsonError("Direct edit: invalid JSON (fix syntax to re-sync)");
                    }
                  }}
                />

                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="text-sm font-semibold">Schema notes</div>
                  <ul className="mt-2 text-xs text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Arrays: use background_elements for multiple compositional hints.</li>
                    <li>Camera: lens + aperture + shutter + ISO helps steer DoF & motion.</li>
                    <li>Lighting: key/fill/highlights/shadows is usually enough for realism.</li>
                    <li>Output: keep format + resolution stable across variations.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>How to extend this app</CardTitle>
              <CardDescription>
                Add fields for negative prompts, seed, model, sampler, CFG, and reference image URLs.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">negative_prompt</Badge>
                <Badge variant="secondary">seed</Badge>
                <Badge variant="secondary">model</Badge>
                <Badge variant="secondary">sampler</Badge>
                <Badge variant="secondary">steps</Badge>
                <Badge variant="secondary">cfg_scale</Badge>
                <Badge variant="secondary">reference_images[]</Badge>
              </div>
              <div>
                If you want real “reference images” in the UI, replace the SVG posters with actual images
                (e.g., your own curated lens/aperture examples) and add a <span className="font-medium">reference_images</span>
                list in the JSON.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
