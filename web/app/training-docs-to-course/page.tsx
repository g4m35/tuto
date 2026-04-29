import type { Metadata } from "next";
import LandingPageClient from "@/components/marketing/LandingPageClient";

export const metadata: Metadata = {
  title: "Training Docs to Guided Practice | Tuto",
  description: "Turn onboarding packets, SOPs, and training docs into guided practice.",
};

export default function TrainingDocsToCoursePage() {
  return <LandingPageClient variant="training" />;
}
