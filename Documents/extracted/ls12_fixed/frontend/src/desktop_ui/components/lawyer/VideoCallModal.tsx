import { Crown, Video } from "lucide-react";
import { BottomSheet } from "@desktop/components/common/BottomSheet";
import { Button } from "@desktop/components/common/Button";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import { useAuth } from "@desktop/contexts/AuthContext";
import { usePremium } from "@desktop/contexts/PremiumContext";
import type { Lawyer } from "@desktop/data/lawyers";

interface Props {
  lawyer: Lawyer | null;
  onClose: () => void;
  onConfirm?: () => void;
}

export const VideoCallModal = ({ lawyer, onClose, onConfirm }: Props) => {
  const { t } = useLanguage();
  const { isPremium } = useAuth();
  const { show } = usePremium();

  const open = !!lawyer;

  // If non-premium tries to open: redirect to upgrade modal instead
  if (open && !isPremium) {
    onClose();
    show("video_call");
    return null;
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t("videoCall")}
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>{t("cancel")}</Button>
          <Button className="flex-1" onClick={() => { onConfirm?.(); onClose(); }}>{t("confirm")}</Button>
        </div>
      }
    >
      <div className="py-3">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Video size={24} />
        </div>
        {lawyer && <p className="text-center text-sm font-semibold mt-3">{lawyer.name}</p>}
        <p className="text-sm text-muted-foreground text-center mt-3 leading-relaxed">{t("videoCallInfo")}</p>
        <p className="text-[11px] text-accent text-center inline-flex items-center justify-center gap-1 w-full mt-3 font-semibold">
          <Crown size={12} /> Premium
        </p>
      </div>
    </BottomSheet>
  );
};
