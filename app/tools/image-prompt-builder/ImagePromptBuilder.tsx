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
  Switch,
} from "@/components/ui";
import { ChatPanel } from "@/components/ChatPanel";

import {
  TASKS,
  SUBJECT_TYPES,
  GENDERS,
  CAMERA_TYPES,
  LENSES,
  APERTURES,
  SHUTTER_SPEEDS,
  ISOS,
  ASPECTS,
  RESOLUTIONS,
  RENDER_STYLES,
  LIGHTING_STYLES,
} from "./constants";

import type { ImagePromptState } from "./types";

// Icons
const IconWand = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" />
    <path d="M17.8 11.8 19 13" /><path d="M15 9h.01" /><path d="M17.8 6.2 19 5" />
    <path d="m3 21 9-9" /><path d="M12.2 6.2 11 5" />
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

const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
);

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
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

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
    <path d="M15 5.764v15" /><path d="M9 3.236v15" />
  </svg>
);

const IconImage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const DEFAULT_STATE: ImagePromptState = {
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
    style: "hyper-realistic",
    style_notes: "",
    consistency_id: "street_portrait_tokyo_01",
  },
};

// Prune empty fields from object
function pruneEmpty(obj: unknown, shouldPrune: boolean): unknown {
  if (Array.isArray(obj)) {
    const arr = obj.map((item) => pruneEmpty(item, shouldPrune)).filter(
      (x) => !(typeof x === "string" && x.trim() === "")
    );
    return arr;
  }
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const pv = pruneEmpty(v, shouldPrune);
      const isEmptyString = typeof pv === "string" && pv.trim() === "";
      const isEmptyArray = Array.isArray(pv) && pv.length === 0;
      const isEmptyObj = pv && typeof pv === "object" && !Array.isArray(pv) && Object.keys(pv).length === 0;
      if (shouldPrune && (pv === null || pv === undefined || isEmptyString || isEmptyArray || isEmptyObj)) {
        continue;
      }
      out[k] = pv;
    }
    return out;
  }
  return obj;
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Tag editor component
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
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        {description && <div className="text-xs text-white/40 mt-1">{description}</div>}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t, idx) => (
          <Badge key={`${t}-${idx}`} variant="secondary" className="gap-1.5 pr-1.5">
            <span className="max-w-[200px] truncate">{t}</span>
            <button
              type="button"
              className="ml-1 inline-flex items-center justify-center rounded-full hover:bg-white/10 p-0.5"
              onClick={() => remove(idx)}
              aria-label={`Remove ${t}`}
            >
              <IconX />
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
          <IconPlus /> Add
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([])}
          disabled={tags.length === 0}
        >
          <IconTrash /> Clear
        </Button>
      </div>
    </div>
  );
}

// Section header
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <div className="text-lg font-semibold text-white">{title}</div>
      {subtitle && <div className="text-sm text-white/50">{subtitle}</div>}
    </div>
  );
}

// Field row
function FieldRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>{children}</div>;
}

// Reference card
function ReferenceCard({ title, subtitle, icon }: { title: string; subtitle: string; icon: "lens" | "aperture" | "iso" | "light" }) {
  const iconColors = {
    lens: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    aperture: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    iso: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    light: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition">
      <div className="flex items-start gap-3">
        <div className={`rounded-lg border p-2 ${iconColors[icon]}`}>
          {icon === "lens" && <IconCamera />}
          {icon === "aperture" && <IconImage />}
          {icon === "iso" && <IconWand />}
          {icon === "light" && <IconSun />}
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs text-white/50">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

export function ImagePromptBuilder() {
  const [state, setState] = useState<ImagePromptState>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("uvacha_image_prompt_builder_v1");
        if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
      } catch {
        // ignore
      }
    }
    return DEFAULT_STATE;
  });

  const [compact, setCompact] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("subject");
  const outRef = useRef<HTMLTextAreaElement | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("uvacha_image_prompt_builder_v1", JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const jsonObj = useMemo(() => pruneEmpty(state, compact), [state, compact]);
  const jsonText = useMemo(() => JSON.stringify(jsonObj, null, 2), [jsonObj]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
    } catch {
      outRef.current?.focus();
      outRef.current?.select();
    }
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 1200);
  };

  const reset = () => {
    setState(DEFAULT_STATE);
    try {
      localStorage.removeItem("uvacha_image_prompt_builder_v1");
    } catch {
      // ignore
    }
  };

  const setDeep = useCallback((path: string[], value: unknown) => {
    setState((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as ImagePromptState;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cur: any = next;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        if (!cur[k] || typeof cur[k] !== "object") cur[k] = {};
        cur = cur[k];
      }
      cur[path[path.length - 1]] = value;
      return next;
    });
  }, []);

  const genConsistency = () => {
    const bits = [
      state.subject?.type,
      (state.environment?.location || "").split(" ").slice(0, 2).join("_"),
      (state.output?.style || "").split(",")[0]?.trim()?.replace(/\s+/g, "_"),
      new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    ]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase().replace(/[^a-z0-9_]+/g, "_"))
      .join("_");
    setDeep(["output", "consistency_id"], bits || "prompt_01");
  };

  // Handle state updates from chat
  const handleChatStateUpdate = useCallback((update: Record<string, unknown>) => {
    setState((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as ImagePromptState;
      
      // Merge task
      if (typeof update.task === "string") {
        next.task = update.task;
      }
      
      // Merge subject
      if (update.subject && typeof update.subject === "object") {
        next.subject = { ...next.subject, ...(update.subject as Partial<typeof next.subject>) };
      }
      
      // Merge environment
      if (update.environment && typeof update.environment === "object") {
        const env = update.environment as Partial<typeof next.environment>;
        next.environment = { 
          ...next.environment, 
          ...env,
          background_elements: Array.isArray(env.background_elements) 
            ? env.background_elements 
            : next.environment.background_elements 
        };
      }
      
      // Merge camera
      if (update.camera && typeof update.camera === "object") {
        next.camera = { ...next.camera, ...(update.camera as Partial<typeof next.camera>) };
      }
      
      // Merge lighting
      if (update.lighting && typeof update.lighting === "object") {
        next.lighting = { ...next.lighting, ...(update.lighting as Partial<typeof next.lighting>) };
      }
      
      // Merge output
      if (update.output && typeof update.output === "object") {
        next.output = { ...next.output, ...(update.output as Partial<typeof next.output>) };
      }
      
      return next;
    });
    // Switch to subject tab to show the changes
    setActiveTab("subject");
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
              <IconImage />
              Image Prompt Builder
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white">
              Build structured JSON for text-to-image prompts
            </h1>
            <p className="mt-2 text-white/60 max-w-2xl">
              Fill the fields → copy a clean JSON blob for your AI image generation workflow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <Switch checked={compact} onCheckedChange={setCompact} id="compact" />
              <Label htmlFor="compact" className="text-xs mb-0">Prune empty</Label>
            </div>
            <Button onClick={copy}>
              {copied ? <IconCheck /> : <IconCopy />}
              {copied ? "Copied" : "Copy JSON"}
            </Button>
            <Button variant="secondary" onClick={() => downloadText("prompt.json", jsonText)}>
              <IconDownload /> Download
            </Button>
            <Button variant="ghost" onClick={reset}>
              <IconTrash /> Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <div className="text-sm text-white/50">
                Use dropdowns for camera/output and free-text for creative intent.
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="subject" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="chat">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                    AI
                  </TabsTrigger>
                  <TabsTrigger value="subject">Subject</TabsTrigger>
                  <TabsTrigger value="environment">Env</TabsTrigger>
                  <TabsTrigger value="camera">Camera</TabsTrigger>
                  <TabsTrigger value="lighting">Light</TabsTrigger>
                  <TabsTrigger value="output">Output</TabsTrigger>
                </TabsList>

                {/* Chat Tab */}
                <TabsContent value="chat" className="space-y-5">
                  <div className="min-h-[500px]">
                    <ChatPanel
                      tool="image-prompt"
                      currentState={state as unknown as Record<string, unknown>}
                      onStateUpdate={handleChatStateUpdate}
                    />
                  </div>
                </TabsContent>

                {/* Subject Tab */}
                <TabsContent value="subject" className="space-y-5">
                  <SectionHeader title="Task" subtitle="The top-level intent (you can extend later)." />
                  
                  <FieldRow>
                    <div>
                      <Label>Task</Label>
                      <Select
                        value={state.task}
                        onChange={(e) => setDeep(["task"], e.target.value)}
                        options={TASKS}
                      />
                    </div>
                    <div>
                      <Label>Consistency ID</Label>
                      <div className="flex gap-2">
                        <Input
                          value={state.output.consistency_id}
                          onChange={(e) => setDeep(["output", "consistency_id"], e.target.value)}
                          placeholder="street_portrait_tokyo_01"
                        />
                        <Button variant="secondary" size="sm" onClick={genConsistency} title="Generate ID">
                          <IconWand />
                        </Button>
                      </div>
                      <div className="text-xs text-white/40 mt-1">Helpful for reruns/variations.</div>
                    </div>
                  </FieldRow>

                  <div className="border-t border-white/10 my-6" />

                  <SectionHeader title="Subject" subtitle="Describe who/what the model should depict." />
                  
                  <FieldRow>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={state.subject.type}
                        onChange={(e) => setDeep(["subject", "type"], e.target.value)}
                        options={SUBJECT_TYPES.map((t) => ({ value: t, label: t }))}
                      />
                    </div>
                    <div>
                      <Label>Age</Label>
                      <Input
                        value={state.subject.age}
                        onChange={(e) => setDeep(["subject", "age"], e.target.value)}
                        placeholder="late 20s"
                      />
                    </div>
                  </FieldRow>

                  <FieldRow>
                    <div>
                      <Label>Gender</Label>
                      <Select
                        value={state.subject.gender}
                        onChange={(e) => setDeep(["subject", "gender"], e.target.value)}
                        options={GENDERS.map((g) => ({ value: g, label: g }))}
                      />
                    </div>
                    <div>
                      <Label>Ethnicity</Label>
                      <Input
                        value={state.subject.ethnicity}
                        onChange={(e) => setDeep(["subject", "ethnicity"], e.target.value)}
                        placeholder="East Asian"
                      />
                    </div>
                  </FieldRow>

                  <div>
                    <Label>Clothing</Label>
                    <Textarea
                      value={state.subject.clothing}
                      onChange={(e) => setDeep(["subject", "clothing"], e.target.value)}
                      placeholder="casual streetwear, oversized denim jacket, white sneakers"
                    />
                  </div>

                  <FieldRow>
                    <div>
                      <Label>Expression</Label>
                      <Input
                        value={state.subject.expression}
                        onChange={(e) => setDeep(["subject", "expression"], e.target.value)}
                        placeholder="subtle smile, relaxed"
                      />
                    </div>
                    <div>
                      <Label>Pose</Label>
                      <Input
                        value={state.subject.pose}
                        onChange={(e) => setDeep(["subject", "pose"], e.target.value)}
                        placeholder="standing, hands in pockets"
                      />
                    </div>
                  </FieldRow>
                </TabsContent>

                {/* Environment Tab */}
                <TabsContent value="environment" className="space-y-5">
                  <SectionHeader title="Environment" subtitle="Where it happens + what's in the background." />
                  
                  <div>
                    <Label>Location</Label>
                    <Input
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

                  <div>
                    <Label>Mood</Label>
                    <Input
                      value={state.environment.mood}
                      onChange={(e) => setDeep(["environment", "mood"], e.target.value)}
                      placeholder="cinematic, moody but vibrant"
                    />
                    <div className="text-xs text-white/40 mt-1">
                      Tip: include adjectives for vibe + constraints like "no haze".
                    </div>
                  </div>
                </TabsContent>

                {/* Camera Tab */}
                <TabsContent value="camera" className="space-y-5">
                  <SectionHeader title="Camera" subtitle="Photographic intent: lens, exposure, framing, focus, grading." />
                  
                  <FieldRow>
                    <div>
                      <Label>Camera type</Label>
                      <Select
                        value={state.camera.camera_type}
                        onChange={(e) => setDeep(["camera", "camera_type"], e.target.value)}
                        options={CAMERA_TYPES.map((t) => ({ value: t, label: t }))}
                      />
                    </div>
                    <div>
                      <Label>Lens</Label>
                      <Select
                        value={state.camera.lens}
                        onChange={(e) => setDeep(["camera", "lens"], e.target.value)}
                        options={LENSES}
                      />
                    </div>
                  </FieldRow>

                  <FieldRow>
                    <div>
                      <Label>Aperture</Label>
                      <Select
                        value={state.camera.aperture}
                        onChange={(e) => setDeep(["camera", "aperture"], e.target.value)}
                        options={APERTURES.map((a) => ({ value: a, label: a }))}
                      />
                    </div>
                    <div>
                      <Label>Shutter speed</Label>
                      <Select
                        value={state.camera.shutter_speed}
                        onChange={(e) => setDeep(["camera", "shutter_speed"], e.target.value)}
                        options={SHUTTER_SPEEDS.map((s) => ({ value: s, label: s }))}
                      />
                    </div>
                  </FieldRow>

                  <FieldRow>
                    <div>
                      <Label>ISO</Label>
                      <Select
                        value={String(state.camera.iso)}
                        onChange={(e) => setDeep(["camera", "iso"], parseInt(e.target.value, 10) || 800)}
                        options={ISOS.map((i) => ({ value: String(i), label: String(i) }))}
                      />
                    </div>
                    <div>
                      <Label>Framing</Label>
                      <Input
                        value={state.camera.framing}
                        onChange={(e) => setDeep(["camera", "framing"], e.target.value)}
                        placeholder="medium shot, subject centered"
                      />
                    </div>
                  </FieldRow>

                  <div>
                    <Label>Focus</Label>
                    <Input
                      value={state.camera.focus}
                      onChange={(e) => setDeep(["camera", "focus"], e.target.value)}
                      placeholder="eyes perfectly sharp, background blurred"
                    />
                  </div>

                  <div>
                    <Label>Color grading</Label>
                    <Input
                      value={state.camera.color_grading}
                      onChange={(e) => setDeep(["camera", "color_grading"], e.target.value)}
                      placeholder="teal and orange, high contrast"
                    />
                  </div>

                  <div className="border-t border-white/10 my-6" />

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-white">Camera reference cards</div>
                      <div className="text-xs text-white/40">Visual reminders for "what changing this does".</div>
                    </div>
                    <Badge variant="secondary">Reference</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ReferenceCard title="35mm" subtitle="Natural perspective, street/editorial" icon="lens" />
                    <ReferenceCard title="85mm" subtitle="Compressed background, portrait look" icon="lens" />
                    <ReferenceCard title="f/1.8" subtitle="Shallow DoF, strong subject separation" icon="aperture" />
                    <ReferenceCard title="ISO 800" subtitle="Indoor/night tradeoffs (noise)" icon="iso" />
                  </div>
                </TabsContent>

                {/* Lighting Tab */}
                <TabsContent value="lighting" className="space-y-5">
                  <SectionHeader title="Lighting" subtitle="Key/fill + highlights/shadows. Use this to 'lock in' the look." />
                  
                  <div>
                    <Label>Style</Label>
                    <Select
                      value={state.lighting.style}
                      onChange={(e) => setDeep(["lighting", "style"], e.target.value)}
                      options={LIGHTING_STYLES.map((s) => ({ value: s, label: s }))}
                    />
                  </div>

                  <FieldRow>
                    <div>
                      <Label>Key light</Label>
                      <Input
                        value={state.lighting.key_light}
                        onChange={(e) => setDeep(["lighting", "key_light"], e.target.value)}
                        placeholder="neon signs to the right of subject"
                      />
                    </div>
                    <div>
                      <Label>Fill light</Label>
                      <Input
                        value={state.lighting.fill_light}
                        onChange={(e) => setDeep(["lighting", "fill_light"], e.target.value)}
                        placeholder="soft ambient city glow"
                      />
                    </div>
                  </FieldRow>

                  <FieldRow>
                    <div>
                      <Label>Highlights</Label>
                      <Input
                        value={state.lighting.highlights}
                        onChange={(e) => setDeep(["lighting", "highlights"], e.target.value)}
                        placeholder="gentle specular highlights on jacket"
                      />
                    </div>
                    <div>
                      <Label>Shadows</Label>
                      <Input
                        value={state.lighting.shadows}
                        onChange={(e) => setDeep(["lighting", "shadows"], e.target.value)}
                        placeholder="soft shadows, no crushed blacks"
                      />
                    </div>
                  </FieldRow>

                  <div className="border-t border-white/10 my-6" />

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-white">Lighting reference cards</div>
                      <div className="text-xs text-white/40">Common setups you can map to prompt language.</div>
                    </div>
                    <Badge variant="secondary">Reference</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ReferenceCard title="Key + Fill" subtitle="Soft key, subtle fill, controlled contrast" icon="light" />
                    <ReferenceCard title="Low-key" subtitle="Deep shadows, bright highlights, dramatic" icon="light" />
                    <ReferenceCard title="Neon" subtitle="Colored practicals, rim light, wet reflections" icon="light" />
                    <ReferenceCard title="Overcast" subtitle="Even soft light, minimal speculars" icon="light" />
                  </div>
                </TabsContent>

                {/* Output Tab */}
                <TabsContent value="output" className="space-y-5">
                  <SectionHeader title="Output" subtitle="Aspect ratio, resolution, and rendering style constraints." />
                  
                  <FieldRow>
                    <div>
                      <Label>Format</Label>
                      <Select
                        value={state.output.format}
                        onChange={(e) => setDeep(["output", "format"], e.target.value)}
                        options={ASPECTS.map((a) => ({ value: a, label: a }))}
                      />
                    </div>
                    <div>
                      <Label>Resolution</Label>
                      <Select
                        value={state.output.resolution}
                        onChange={(e) => setDeep(["output", "resolution"], e.target.value)}
                        options={RESOLUTIONS}
                      />
                    </div>
                  </FieldRow>

                  <div>
                    <Label>Style</Label>
                    <Select
                      value={state.output.style}
                      onChange={(e) => setDeep(["output", "style"], e.target.value)}
                      options={RENDER_STYLES.map((s) => ({ value: s, label: s }))}
                    />
                    <div className="text-xs text-white/40 mt-1">
                      Add constraints like "no painterly artifacts" as needed.
                    </div>
                  </div>

                  <div>
                    <Label>Fine style notes (optional)</Label>
                    <Textarea
                      value={state.output.style_notes || ""}
                      onChange={(e) => setDeep(["output", "style_notes"], e.target.value)}
                      placeholder="e.g., no painterly artifacts, natural skin texture..."
                    />
                    <div className="text-xs text-white/40 mt-1">
                      This is optional and will be removed if you enable "Prune empty".
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Right: JSON Output */}
          <Card>
            <CardHeader>
              <CardTitle>Generated JSON</CardTitle>
              <div className="text-sm text-white/50">
                Copy this into your prompt pipeline (or store it as metadata).
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={copy}>
                  {copied ? <IconCheck /> : <IconCopy />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="secondary" onClick={() => downloadText("prompt.json", jsonText)}>
                  <IconDownload /> Download
                </Button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <pre className="p-4 text-xs overflow-auto max-h-[520px] leading-relaxed text-white/70 font-mono">
                  {jsonText}
                </pre>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-sm font-semibold text-white mb-2">Schema notes</div>
                <ul className="text-xs text-white/50 list-disc pl-5 space-y-1">
                  <li>Arrays: use background_elements for multiple compositional hints.</li>
                  <li>Camera: lens + aperture + shutter + ISO helps steer DoF & motion.</li>
                  <li>Lighting: key/fill/highlights/shadows is usually enough for realism.</li>
                  <li>Output: keep format + resolution stable across variations.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extension hints */}
        <Card>
          <CardHeader>
            <CardTitle>How to extend this app</CardTitle>
            <div className="text-sm text-white/50">
              Add fields for negative prompts, seed, model, sampler, CFG, and reference image URLs.
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">negative_prompt</Badge>
              <Badge variant="secondary">seed</Badge>
              <Badge variant="secondary">model</Badge>
              <Badge variant="secondary">sampler</Badge>
              <Badge variant="secondary">steps</Badge>
              <Badge variant="secondary">cfg_scale</Badge>
              <Badge variant="secondary">reference_images[]</Badge>
            </div>
            <div className="text-sm text-white/50">
              If you want real "reference images" in the UI, replace the reference cards with actual images
              and add a <span className="text-white/70 font-medium">reference_images</span> list in the JSON.
            </div>
          </CardContent>
        </Card>

        <footer className="py-8 text-sm text-white/40">
          Built for structured AI image prompting. Persists your last session to localStorage.
        </footer>
      </div>
    </div>
  );
}

