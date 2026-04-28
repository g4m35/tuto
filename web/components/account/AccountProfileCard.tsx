"use client";

import { UserProfile } from "@clerk/nextjs";

const accountAppearance = {
  variables: {
    borderRadius: "14px",
    colorBackground: "#111111",
    colorDanger: "#fafafa",
    colorInputBackground: "#161616",
    colorInputText: "#fafafa",
    colorNeutral: "#6b6b6b",
    colorPrimary: "#fafafa",
    colorText: "#fafafa",
    colorTextSecondary: "#a3a3a3",
    fontFamily: "var(--font-sans), Inter, ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "var(--font-sans), Inter, ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "w-full rounded-[14px] border border-white/[0.07] bg-[#111111] p-0 shadow-none",
    navbar: "border-b border-white/[0.07] bg-transparent",
    navbarButton: "text-[#a3a3a3] hover:bg-[#161616] hover:text-[#fafafa]",
    navbarButton__active: "bg-[#161616] text-[#fafafa]",
    pageScrollBox: "bg-transparent",
    profileSectionTitleText: "text-[#fafafa]",
    profileSectionContent: "text-[#a3a3a3]",
    formFieldLabel: "text-[#a3a3a3]",
    formFieldInput: "rounded-[10px] border-white/[0.07] bg-[#161616] text-[#fafafa] shadow-none focus:border-white/[0.16] focus:shadow-none",
    formButtonPrimary: "rounded-full bg-[#fafafa] text-[#0a0a0a] shadow-none hover:bg-[#d4d4d4] focus:shadow-none",
    badge: "border-white/[0.07] bg-[#161616] text-[#fafafa]",
    accordionTriggerButton: "text-[#fafafa] hover:bg-[#161616]",
    accordionContent: "text-[#a3a3a3]",
    alert: "rounded-[10px] border border-white/[0.16] bg-[#161616] text-[#fafafa]",
    alertText: "text-[#fafafa]",
  },
};

export function AccountProfileCard() {
  return (
    <UserProfile
      routing="hash"
      appearance={accountAppearance}
    />
  );
}
