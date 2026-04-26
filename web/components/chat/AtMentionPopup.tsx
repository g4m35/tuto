"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next";

interface AtMentionPopupProps {
  open: boolean;
  onSelectNotebook: () => void;
  onSelectHistory: () => void;
  onSelectQuestionBank: () => void;
}

export default memo(function AtMentionPopup({
  open,
  onSelectNotebook,
  onSelectHistory,
  onSelectQuestionBank,
}: AtMentionPopupProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="surface-panel absolute bottom-full left-0 z-[70] mb-2 w-56 rounded-[var(--radius-md)] p-2 animate-[t-scale-in_180ms_var(--ease-signature)_both]">
      <button
        onClick={onSelectNotebook}
        className="w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-[14px] font-medium text-[var(--text)] transition-colors duration-200 ease-[var(--ease-signature)] hover:bg-[var(--bg-elev-2)]"
      >
        {t("Notebook")}
      </button>
      <button
        onClick={onSelectHistory}
        className="w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-[14px] font-medium text-[var(--text)] transition-colors duration-200 ease-[var(--ease-signature)] hover:bg-[var(--bg-elev-2)]"
      >
        {t("Chat History")}
      </button>
      <button
        onClick={onSelectQuestionBank}
        className="w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-[14px] font-medium text-[var(--text)] transition-colors duration-200 ease-[var(--ease-signature)] hover:bg-[var(--bg-elev-2)]"
      >
        {t("Question Bank")}
      </button>
    </div>
  );
});
