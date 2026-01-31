"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Textarea,
  Select,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
} from "@/components/ui";
import { ChatPanel } from "@/components/ChatPanel";

import {
  ASPECT_RATIOS,
  VISUAL_STYLE_PRESETS,
  SHOT_TYPES,
  CAMERA_ANGLES,
  CAMERA_MOVES,
  LENS_PRESETS,
  DEPTH_OF_FIELD,
  LIGHTING_PRESETS,
  OUTPUT_LAYOUTS,
  OUTPUT_LABELS,
  OUTPUT_STYLE,
} from "./constants";

import type { StoryboardState, Shot, Character } from "./types";

// Icons
const IconSparkles = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
  </svg>
);

const IconCopy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const IconCamera = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const IconSun = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const IconArrowUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6" />
  </svg>
);

const IconArrowDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
  </svg>
);

const DEFAULT_STATE: StoryboardState = {
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
      camera: { lens: "35mm", move: "static", dof: "medium" },
      lighting: { preset: "natural_window", notes: "" },
    },
  ],
  output: {
    layout: OUTPUT_LAYOUTS[0],
    labels: OUTPUT_LABELS[0],
    style: OUTPUT_STYLE[0],
  },
};

function normalizeStoryboard(state: StoryboardState) {
  return {
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
        const base: Record<string, unknown> = {
          shot_number: s.shot_number ?? idx + 1,
          shot_type: s.shot_type || "medium",
          camera_angle: s.camera_angle || "eye-level",
        };

        if ((s.characters || []).length) base.characters = s.characters;
        if ((s.location || "").trim()) base.location = s.location?.trim();
        if ((s.action || "").trim()) base.action = s.action?.trim();
        if ((s.purpose || "").trim()) base.purpose = s.purpose?.trim();
        if ((s.focus || "").trim()) base.focus = s.focus?.trim();
        if ((s.notes || "").trim()) base.notes = s.notes?.trim();
        if ((s.text_overlays || "").trim()) base.text_overlays = s.text_overlays?.trim();
        if ((s.emotional_tone || "").trim()) base.emotional_tone = s.emotional_tone?.trim();

        const camera = s.camera || {};
        const lighting = s.lighting || {};
        
        const cameraBlock: Record<string, string | undefined> = {
          lens: camera.lens || undefined,
          move: camera.move || undefined,
          dof: camera.dof || undefined,
          aperture: (camera.aperture || "").trim() || undefined,
          framing_notes: (camera.framing_notes || "").trim() || undefined,
        };
        const lightingBlock: Record<string, string | undefined> = {
          preset: lighting.preset || undefined,
          notes: (lighting.notes || "").trim() || undefined,
        };

        const cameraHasAny = Object.values(cameraBlock).some((v) => v !== undefined);
        const lightingHasAny = Object.values(lightingBlock).some((v) => v !== undefined);

        return {
          ...base,
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
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// Section title component
function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-xl bg-white/5 border border-white/10 p-2.5 text-[#f5d67b]">
        {icon}
      </div>
      <div>
        <div className="text-lg font-semibold text-white">{title}</div>
        {subtitle && <div className="text-sm text-white/50">{subtitle}</div>}
      </div>
    </div>
  );
}

// Inline help text
function InlineHelp({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 text-xs text-white/40 leading-relaxed">{children}</div>;
}

// Shot card component
function ShotCard({
  shot,
  index,
  allCharacters,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
}: {
  shot: Shot;
  index: number;
  allCharacters: Character[];
  onChange: (updater: (prev: StoryboardState) => StoryboardState) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
  onMove: (index: number, delta: number) => void;
}) {
  const [cameraTab, setCameraTab] = useState<"camera" | "lighting">("camera");

  const set = useCallback((path: (string | number)[], value: unknown) => {
    onChange((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as StoryboardState;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cur: any = next;
      for (let i = 0; i < path.length - 1; i++) {
        cur = cur[path[i]];
      }
      cur[path[path.length - 1]] = value;
      return next;
    });
  }, [onChange]);

  const toggleCharacter = (charId: string) => {
    const current = shot.characters || [];
    const exists = current.includes(charId);
    const next = exists ? current.filter((c) => c !== charId) : [...current, charId];
    set(["shots", index, "characters"], next);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>
              Shot {shot.shot_number}{" "}
              <span className="text-white/50 font-normal">• {shot.shot_type}</span>
            </CardTitle>
            <div className="text-xs text-white/40 mt-1">
              Use dropdowns for consistent vocabulary; add freeform notes where needed.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onMove(index, -1)} disabled={index === 0} title="Move up">
              <IconArrowUp />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onMove(index, 1)} title="Move down">
              <IconArrowDown />
            </Button>
            <Button variant="secondary" size="icon" onClick={() => onDuplicate(index)} title="Duplicate">
              <IconPlus />
            </Button>
            <Button variant="destructive" size="icon" onClick={() => onRemove(index)} title="Delete">
              <IconTrash />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Row 1: Shot #, Type, Angle */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Shot #</Label>
            <Input
              type="number"
              value={shot.shot_number}
              min={1}
              onChange={(e) => set(["shots", index, "shot_number"], clamp(parseInt(e.target.value || "1", 10), 1, 999))}
            />
          </div>
          <div>
            <Label>Shot type</Label>
            <Select
              value={shot.shot_type || "medium"}
              onChange={(e) => set(["shots", index, "shot_type"], e.target.value)}
              options={SHOT_TYPES.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Camera angle</Label>
            <Select
              value={shot.camera_angle || "eye-level"}
              onChange={(e) => set(["shots", index, "camera_angle"], e.target.value)}
              options={CAMERA_ANGLES.map((s) => ({ value: s, label: s }))}
            />
          </div>
        </div>

        {/* Row 2: Location, Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Location</Label>
            <Textarea
              value={shot.location || ""}
              onChange={(e) => set(["shots", index, "location"], e.target.value)}
              placeholder="e.g., cozy city coffee shop on a rainy morning"
            />
          </div>
          <div>
            <Label>Action</Label>
            <Textarea
              value={shot.action || ""}
              onChange={(e) => set(["shots", index, "action"], e.target.value)}
              placeholder="e.g., Alex reaches for the cup at the same time as Jordan"
            />
          </div>
        </div>

        {/* Row 3: Purpose, Focus, Emotional tone */}
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

        {/* Row 4: Text overlays, Notes */}
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
              placeholder="e.g., leave space on right side of frame"
            />
          </div>
        </div>

        {/* Characters */}
        <div className="space-y-3">
          <Label>Characters in this shot</Label>
          <div className="flex flex-wrap gap-2">
            {allCharacters.length === 0 ? (
              <div className="text-sm text-white/40">Add main characters above first.</div>
            ) : (
              allCharacters.map((c) => {
                const active = (shot.characters || []).includes(c.id);
                return (
                  <Button
                    key={c.id}
                    variant={active ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => toggleCharacter(c.id)}
                  >
                    {c.id}
                  </Button>
                );
              })
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-white/10" />

        {/* Camera / Lighting tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCameraTab("camera")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.15em] transition-all ${
                  cameraTab === "camera"
                    ? "bg-[#f5d67b] text-black"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <IconCamera /> Camera
              </button>
              <button
                onClick={() => setCameraTab("lighting")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.15em] transition-all ${
                  cameraTab === "lighting"
                    ? "bg-[#f5d67b] text-black"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <IconSun /> Lighting
              </button>
            </div>

            {cameraTab === "camera" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Lens</Label>
                    <Select
                      value={shot.camera?.lens || "35mm"}
                      onChange={(e) => set(["shots", index, "camera", "lens"], e.target.value)}
                      options={LENS_PRESETS}
                    />
                  </div>
                  <div>
                    <Label>Camera move</Label>
                    <Select
                      value={shot.camera?.move || "static"}
                      onChange={(e) => set(["shots", index, "camera", "move"], e.target.value)}
                      options={CAMERA_MOVES.map((m) => ({ value: m, label: m }))}
                    />
                  </div>
                  <div>
                    <Label>Depth of field</Label>
                    <Select
                      value={shot.camera?.dof || "medium"}
                      onChange={(e) => set(["shots", index, "camera", "dof"], e.target.value)}
                      options={DEPTH_OF_FIELD}
                    />
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
                    <InlineHelp>For shallow DOF, typical: f/1.4–f/2.8</InlineHelp>
                  </div>
                  <div>
                    <Label>Framing notes (optional)</Label>
                    <Input
                      value={shot.camera?.framing_notes || ""}
                      onChange={(e) => set(["shots", index, "camera", "framing_notes"], e.target.value)}
                      placeholder="e.g., rule of thirds"
                    />
                  </div>
                </div>
              </div>
            )}

            {cameraTab === "lighting" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Lighting preset</Label>
                  <Select
                    value={shot.lighting?.preset || "natural_window"}
                    onChange={(e) => set(["shots", index, "lighting", "preset"], e.target.value)}
                    options={LIGHTING_PRESETS}
                  />
                  <InlineHelp>Pick a baseline. Use notes for special sources.</InlineHelp>
                </div>
                <div>
                  <Label>Lighting notes (optional)</Label>
                  <Input
                    value={shot.lighting?.notes || ""}
                    onChange={(e) => set(["shots", index, "lighting", "notes"], e.target.value)}
                    placeholder="e.g., warm practicals in background"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reference info */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              Current settings
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Lens</span>
                <Badge variant="gold">{shot.camera?.lens || "35mm"}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Move</span>
                <Badge>{shot.camera?.move || "static"}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">DOF</span>
                <Badge>{shot.camera?.dof || "medium"}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Lighting</span>
                <Badge variant="gold">{shot.lighting?.preset || "natural_window"}</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Templates
const TEMPLATES: { id: string; name: string; data: StoryboardState }[] = [
  {
    id: "coffee",
    name: "Coffee Shop Meet-Cute",
    data: {
      task: "create_storyboard",
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
          focus: "Jordan's amused smile and raised eyebrow",
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
    },
  },
  {
    id: "action",
    name: "Rooftop Chase",
    data: {
      task: "create_storyboard",
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
    },
  },
];

export function StoryboardBuilder() {
  const [state, setState] = useState<StoryboardState>(DEFAULT_STATE);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const jsonObj = useMemo(() => normalizeStoryboard(state), [state]);
  const jsonText = useMemo(() => JSON.stringify(jsonObj, null, 2), [jsonObj]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = jsonText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 1400);
  };

  const updateProject = (key: keyof StoryboardState["project"], value: string) => {
    setState((prev) => ({ ...prev, project: { ...prev.project, [key]: value } }));
  };

  const addCharacter = () => {
    setState((prev) => ({
      ...prev,
      main_characters: [...prev.main_characters, { id: `char_${prev.main_characters.length + 1}`, description: "" }],
    }));
  };

  const updateCharacter = (index: number, key: keyof Character, value: string) => {
    setState((prev) => {
      const next = prev.main_characters.slice();
      next[index] = { ...next[index], [key]: value };
      return { ...prev, main_characters: next };
    });
  };

  const removeCharacter = (index: number) => {
    setState((prev) => {
      const removed = prev.main_characters[index]?.id;
      const nextChars = prev.main_characters.filter((_, i) => i !== index);
      const nextShots = prev.shots.map((s) => ({
        ...s,
        characters: (s.characters || []).filter((c) => c !== removed),
      }));
      return { ...prev, main_characters: nextChars, shots: nextShots };
    });
  };

  const addShot = () => {
    setState((prev) => {
      const nextNum = (prev.shots?.length || 0) + 1;
      const newShot: Shot = {
        shot_number: nextNum,
        shot_type: "medium",
        camera_angle: "eye-level",
        characters: [],
        location: "",
        action: "",
        purpose: "",
        text_overlays: "none",
        camera: { lens: "35mm", move: "static", dof: "medium" },
        lighting: { preset: "natural_window", notes: "" },
      };
      return { ...prev, shots: [...prev.shots, newShot] };
    });
  };

  const removeShot = (index: number) => {
    setState((prev) => ({ ...prev, shots: prev.shots.filter((_, i) => i !== index) }));
  };

  const duplicateShot = (index: number) => {
    setState((prev) => {
      const s = prev.shots[index];
      const clone: Shot = JSON.parse(JSON.stringify(s));
      clone.shot_number = (prev.shots?.length || 0) + 1;
      return { ...prev, shots: [...prev.shots, clone] };
    });
  };

  const moveShot = (index: number, delta: number) => {
    setState((prev) => {
      const shots = prev.shots.slice();
      const j = index + delta;
      if (j < 0 || j >= shots.length) return prev;
      [shots[index], shots[j]] = [shots[j], shots[index]];
      return { ...prev, shots };
    });
  };

  const updateOutput = (key: keyof StoryboardState["output"], value: string) => {
    setState((prev) => ({ ...prev, output: { ...prev.output, [key]: value } }));
  };

  const allCharacters = useMemo(
    () => (state.main_characters || []).filter((c) => (c?.id || "").trim().length > 0),
    [state.main_characters]
  );

  // Handle state updates from chat
  const handleChatStateUpdate = useCallback((update: Record<string, unknown>) => {
    setState((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as StoryboardState;
      
      // Merge project
      if (update.project && typeof update.project === "object") {
        next.project = { ...next.project, ...(update.project as Partial<typeof next.project>) };
      }
      
      // Merge or replace main_characters
      if (Array.isArray(update.main_characters)) {
        next.main_characters = update.main_characters as typeof next.main_characters;
      }
      
      // Merge or replace shots
      if (Array.isArray(update.shots)) {
        next.shots = update.shots as typeof next.shots;
      }
      
      // Merge output
      if (update.output && typeof update.output === "object") {
        next.output = { ...next.output, ...(update.output as Partial<typeof next.output>) };
      }
      
      // Merge task
      if (typeof update.task === "string") {
        next.task = update.task;
      }
      
      return next;
    });
    // Switch to builder tab to show the changes
    setActiveTab("builder");
  }, []);

  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute inset-x-0 top-10 mx-auto h-72 w-[80%] rounded-[50%] bg-[#f5d67b]/5 blur-[200px]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50 hover:text-[#f5d67b] transition mb-4"
            >
              <IconArrowLeft /> Back to Tools
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5d67b]">
              <IconSparkles />
              Storyboard Prompt Builder
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white">
              Build a copyable JSON prompt for text-to-image storyboards
            </h1>
            <p className="mt-2 text-white/60 max-w-2xl">
              Fill in project + characters + shots. The app generates clean JSON (with consistent vocab)
              and lets you copy it to paste into your prompt workflow.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setActiveTab("templates")}>
              Templates
            </Button>
            <Button onClick={onCopy}>
              {copied ? <IconCheck /> : <IconCopy />}
              {copied ? "Copied" : "Copy JSON"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="builder" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="chat">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="preview">JSON Preview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 min-h-[600px]">
                <ChatPanel
                  tool="storyboard"
                  currentState={state as unknown as Record<string, unknown>}
                  onStateUpdate={handleChatStateUpdate}
                />
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <SectionTitle icon={<IconCopy />} title="Live JSON" subtitle="Preview of current form state." />
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                      <pre className="p-4 text-xs overflow-auto max-h-[400px] leading-relaxed text-white/70">
                        {jsonText}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <SectionTitle 
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4" />
                          <path d="M12 8h.01" />
                        </svg>
                      } 
                      title="Tips" 
                      subtitle="Get the most out of AI assistance."
                    />
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-white/60 space-y-2">
                      <li>• Describe your scene, characters, and mood</li>
                      <li>• Ask for specific shots or camera angles</li>
                      <li>• Request changes to existing content</li>
                      <li>• Click &quot;Apply to form&quot; to use suggestions</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="builder" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Task + Project */}
                <Card>
                  <CardHeader>
                    <SectionTitle
                      icon={<IconSparkles />}
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
                          onChange={(e) => updateProject("aspect_ratio", e.target.value)}
                          options={ASPECT_RATIOS.map((r) => ({ value: r, label: r }))}
                        />
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
                          onChange={(e) => updateProject("visual_style", e.target.value)}
                          options={VISUAL_STYLE_PRESETS.map((s) => ({ value: s, label: s }))}
                        />
                        <InlineHelp>You can also pick a preset then tweak it below.</InlineHelp>
                      </div>
                      <div>
                        <Label>Consistency ID</Label>
                        <Input
                          value={state.project.consistency_id}
                          onChange={(e) => updateProject("consistency_id", e.target.value)}
                          placeholder="e.g., coffee_meetcute_main_characters"
                        />
                        <InlineHelp>Use this as a handle to keep characters/style consistent.</InlineHelp>
                      </div>
                    </div>

                    <div>
                      <Label>Visual style (freeform)</Label>
                      <Textarea
                        value={state.project.visual_style}
                        onChange={(e) => updateProject("visual_style", e.target.value)}
                        placeholder="cinematic, soft film look, subtle grain"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Main Characters */}
                <Card>
                  <CardHeader>
                    <SectionTitle
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      }
                      title="Main Characters"
                      subtitle="Create stable IDs you can reference inside shots."
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {state.main_characters.map((c, i) => (
                        <div key={`${c.id}_${i}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
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
                            <Button variant="destructive" size="icon" onClick={() => removeCharacter(i)} title="Remove">
                              <IconTrash />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="secondary" onClick={addCharacter}>
                        <IconPlus /> Add character
                      </Button>
                      <span className="text-sm text-white/40">Tip: keep IDs short (alex, jordan).</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Shots */}
                <Card>
                  <CardHeader>
                    <SectionTitle
                      icon={<IconCamera />}
                      title="Shots"
                      subtitle="Each shot becomes a prompt chunk. Add camera/lighting details as needed."
                    />
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-5">
                      {state.shots.map((shot, idx) => (
                        <ShotCard
                          key={`${shot.shot_number ?? idx}_${idx}`}
                          shot={shot}
                          index={idx}
                          allCharacters={allCharacters}
                          onChange={setState}
                          onRemove={removeShot}
                          onDuplicate={duplicateShot}
                          onMove={moveShot}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="secondary" onClick={addShot}>
                        <IconPlus /> Add shot
                      </Button>
                      <span className="text-sm text-white/40">Keep shot_number unique.</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Output */}
                <Card>
                  <CardHeader>
                    <SectionTitle
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="M3 9h18" />
                          <path d="M9 21V9" />
                        </svg>
                      }
                      title="Output"
                      subtitle="How you want the storyboard frames delivered."
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Layout</Label>
                        <Select
                          value={state.output.layout}
                          onChange={(e) => updateOutput("layout", e.target.value)}
                          options={OUTPUT_LAYOUTS.map((o) => ({ value: o, label: o }))}
                        />
                      </div>
                      <div>
                        <Label>Labels</Label>
                        <Select
                          value={state.output.labels}
                          onChange={(e) => updateOutput("labels", e.target.value)}
                          options={OUTPUT_LABELS.map((o) => ({ value: o, label: o }))}
                        />
                      </div>
                      <div>
                        <Label>Frame style</Label>
                        <Select
                          value={state.output.style}
                          onChange={(e) => updateOutput("style", e.target.value)}
                          options={OUTPUT_STYLE.map((o) => ({ value: o, label: o }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <SectionTitle icon={<IconCopy />} title="Live JSON" subtitle="Copy/paste into your prompt workflow." />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Button onClick={onCopy}>
                        {copied ? <IconCheck /> : <IconCopy />}
                        {copied ? "Copied" : "Copy JSON"}
                      </Button>
                      <Button variant="ghost" onClick={() => setState(DEFAULT_STATE)}>
                        Reset
                      </Button>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                      <pre className="p-4 text-xs overflow-auto max-h-[520px] leading-relaxed text-white/70">
                        {jsonText}
                      </pre>
                    </div>
                    <InlineHelp>Optional fields are omitted when blank, so the JSON stays clean.</InlineHelp>
                  </CardContent>
                </Card>

                {/* Quick reference */}
                <Card>
                  <CardHeader>
                    <SectionTitle icon={<IconSun />} title="Quick Reference" subtitle="Cheat-sheets for lens and lighting." />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">Lenses</div>
                      <div className="grid grid-cols-2 gap-2">
                        {LENS_PRESETS.map((l) => (
                          <div key={l.value} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/70">
                            <span className="text-[#f5d67b]">{l.value}</span> — {l.label.split("(")[1]?.replace(")", "") || ""}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">Lighting</div>
                      <div className="space-y-1">
                        {LIGHTING_PRESETS.map((l) => (
                          <div key={l.value} className="text-xs text-white/60">
                            <span className="text-[#f5d67b]">{l.value}</span> — {l.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    </svg>
                  }
                  title="JSON Preview"
                  subtitle="This is exactly what gets copied."
                />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Button onClick={onCopy}>
                    {copied ? <IconCheck /> : <IconCopy />}
                    {copied ? "Copied" : "Copy JSON"}
                  </Button>
                  <Badge>{state.shots.length} shots</Badge>
                  <Badge>{state.main_characters.length} characters</Badge>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  <pre className="p-4 text-sm overflow-auto max-h-[70vh] leading-relaxed text-white/70">
                    {jsonText}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <SectionTitle
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                  }
                  title="Templates"
                  subtitle="Start from a working example, then customize."
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TEMPLATES.map((t) => (
                    <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-[#f5d67b]/40 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold text-white">{t.name}</div>
                          <div className="text-sm text-white/50 mt-1">
                            {t.data.shots.length} shots • {t.data.project.aspect_ratio}
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setState(t.data);
                            setActiveTab("builder");
                          }}
                        >
                          Use
                        </Button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {t.data.main_characters.map((c) => (
                          <Badge key={c.id} variant="secondary">{c.id}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 my-6" />

                <ImportExportPanel state={state} setState={setState} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="py-8 text-sm text-white/40">
          Built for storyboard prompt generation. Add your own vocab lists (shot types, lenses, lighting)
          to match your team&apos;s style guide.
        </footer>
      </div>
    </div>
  );
}

// Import/Export Panel
function ImportExportPanel({
  state,
  setState,
}: {
  state: StoryboardState;
  setState: (s: StoryboardState) => void;
}) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const exportText = useMemo(() => JSON.stringify(normalizeStoryboard(state), null, 2), [state]);

  const onLoad = () => {
    setErr("");
    try {
      const obj = JSON.parse(text);
      if (obj && obj.project && Array.isArray(obj.shots)) {
        const builder: StoryboardState = {
          task: obj.task || "create_storyboard",
          project: {
            title: obj.project.title || "",
            aspect_ratio: obj.project.aspect_ratio || "16:9",
            visual_style: obj.project.visual_style || VISUAL_STYLE_PRESETS[0],
            consistency_id: obj.project.consistency_id || "",
          },
          main_characters: Array.isArray(obj.main_characters) ? obj.main_characters : [],
          shots: obj.shots.map((s: Record<string, unknown>, i: number) => ({
            shot_number: (s.shot_number as number) ?? i + 1,
            shot_type: (s.shot_type as string) || "medium",
            camera_angle: (s.camera_angle as string) || "eye-level",
            characters: (s.characters as string[]) || [],
            location: (s.location as string) || "",
            action: (s.action as string) || "",
            purpose: (s.purpose as string) || "",
            focus: (s.focus as string) || "",
            notes: (s.notes as string) || "",
            text_overlays: (s.text_overlays as string) || "none",
            emotional_tone: (s.emotional_tone as string) || "",
            camera: {
              lens: ((s.camera as Record<string, string>)?.lens) || "35mm",
              move: ((s.camera as Record<string, string>)?.move) || "static",
              dof: ((s.camera as Record<string, string>)?.dof) || "medium",
              aperture: ((s.camera as Record<string, string>)?.aperture) || "",
              framing_notes: ((s.camera as Record<string, string>)?.framing_notes) || "",
            },
            lighting: {
              preset: ((s.lighting as Record<string, string>)?.preset) || "natural_window",
              notes: ((s.lighting as Record<string, string>)?.notes) || "",
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
      setState(obj);
      setText("");
    } catch {
      setErr("Could not parse JSON. Make sure it is valid JSON.");
    }
  };

  const onCopyExport = async () => {
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
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm font-semibold text-white">Import JSON</div>
          <Button variant="secondary" size="sm" onClick={onLoad}>
            Load
          </Button>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[180px]"
          placeholder="Paste JSON here..."
        />
        {err && <div className="mt-2 text-sm text-red-400">{err}</div>}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm font-semibold text-white">Export (normalized JSON)</div>
          <Button variant="secondary" size="sm" onClick={onCopyExport}>
            <IconCopy /> Copy
          </Button>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <pre className="p-3 text-xs overflow-auto max-h-[220px] leading-relaxed text-white/60">{exportText}</pre>
        </div>
      </div>
    </div>
  );
}

