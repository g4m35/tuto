import type { Metadata } from "next";
import LandingPageClient from "@/components/marketing/LandingPageClient";

export const metadata: Metadata = {
  title: "AI Study Course From Notes | Tuto",
  description: "Turn class notes or a focused topic into lessons, practice, and review.",
};

export default function AiStudyCoursePage() {
  return <LandingPageClient variant="notes" />;
}
