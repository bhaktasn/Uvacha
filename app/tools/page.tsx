import Link from "next/link";

const tools = [
  {
    id: "storyboard-builder",
    title: "Storyboard Prompt Builder",
    description:
      "Build copyable JSON prompts for text-to-image storyboards. Define shots, camera angles, lighting, and characters with consistent vocabulary.",
    tag: "Storyboards",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
  },
  {
    id: "image-prompt-builder",
    title: "Image Prompt Builder",
    description:
      "Build structured JSON prompts for text-to-image AI models. Define subjects, environments, camera settings, lighting, and output preferences.",
    tag: "Image Gen",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    ),
  },
] as const;

export const metadata = {
  title: "Creator Tools | Uvacha",
  description:
    "A curated collection of tools for AI-powered creators—prompts, storyboards, and more.",
};

export default function ToolsPage() {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute inset-x-0 top-10 mx-auto h-72 w-[80%] rounded-[50%] bg-[#f5d67b]/5 blur-[200px]" />
      </div>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#f5d67b]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              <path d="M20 3v4" />
              <path d="M22 5h-4" />
            </svg>
            Creator Tools
          </span>

          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Build smarter, create faster.
          </h1>
          <p className="max-w-2xl text-lg text-white/70">
            Curated utilities for modern AI-powered creators. Each tool is
            designed to streamline a specific part of your workflow—from
            prompting to production.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.id}`}
              className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] transition duration-200 hover:-translate-y-1 hover:border-[#f5d67b]/60 hover:bg-white/[0.05]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#f5d67b]">
                {tool.icon}
              </div>

              <span className="mb-3 inline-flex w-fit rounded-full border border-white/10 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-white/50">
                {tool.tag}
              </span>

              <h2 className="text-xl font-semibold text-white group-hover:text-[#f5d67b] transition-colors">
                {tool.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-white/60">
                {tool.description}
              </p>

              <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f5d67b]">
                Open tool
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-1"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}

          {/* Coming soon placeholder */}
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>
            <p className="text-sm text-white/40">More tools coming soon</p>
          </div>
        </div>
      </section>
    </div>
  );
}

