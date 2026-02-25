import type { Metadata } from "next";
import { StoryboardSplitter } from "./StoryboardSplitter";

export const metadata: Metadata = {
  title: "Storyboard Image Splitter | Uvacha Tools",
  description:
    "Upload a storyboard image, choose rows and columns, and split it into downloadable panel images.",
};

export default function StoryboardSplitterPage() {
  return <StoryboardSplitter />;
}
