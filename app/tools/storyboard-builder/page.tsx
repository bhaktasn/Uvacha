import type { Metadata } from "next";
import { StoryboardBuilder } from "./StoryboardBuilder";

export const metadata: Metadata = {
  title: "Storyboard Prompt Builder | Uvacha Tools",
  description:
    "Build copyable JSON prompts for text-to-image storyboards. Define shots, camera angles, lighting, and characters.",
};

export default function StoryboardBuilderPage() {
  return <StoryboardBuilder />;
}

