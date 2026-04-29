import type { Metadata } from "next";
import LandingPageClient from "@/components/marketing/LandingPageClient";

export const metadata: Metadata = {
  title: "PDF to Course | Tuto",
  description: "Turn a trusted PDF into a guided course with lessons, practice, and review.",
};

export default function PdfToCoursePage() {
  return <LandingPageClient variant="pdf" />;
}
