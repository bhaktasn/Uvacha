import type { Metadata } from "next";
import { ImagePromptBuilder } from "./ImagePromptBuilder";

export const metadata: Metadata = {
  title: "Image Prompt Builder | Uvacha Tools",
  description:
    "Build structured JSON prompts for text-to-image AI models. Define subjects, environments, camera settings, and lighting.",
};

export default function ImagePromptBuilderPage() {
  return <ImagePromptBuilder />;
}

