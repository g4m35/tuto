import type { Metadata } from "next";
import LandingPageClient from "@/components/marketing/LandingPageClient";

export const metadata: Metadata = {
  title: "PDF to Course | Tuto",
  description: "Turn a PDF into lessons, practice, and review.",
};

export default function PdfToCoursePage() {
  return <LandingPageClient variant="pdf" />;
}
