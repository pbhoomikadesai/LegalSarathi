import { useState } from "react";
import { Camera } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/TextField";
import { Toast } from "@/components/common/Toast";
import { LanguageSwitcherSheet } from "@/components/language/LanguageSwitcherSheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const EditProfile = () => {
  const { t, meta } = useLanguage();
  const { phone } = useAuth();
  const [name, setName] = useState("Priya Desai");
  const [email, setEmail] = useState("priya@example.com");
  const [city, setCity] = useState("Bengaluru");
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Required";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) next.email = "Invalid email";
    setErrors(next);
    if (Object.keys(next).length) return;
    setToast(true);
    setDirty(false);
  };

  return (
    <ScreenShell>
      <StickyHeader
        title={t("editProfile")}
        showBack
        showLanguagePill
        rightAction={
          <button
            onClick={submit}
            disabled={!dirty}
            className={`text-xs font-semibold px-2 tap ${dirty ? "text-primary" : "text-muted-foreground"}`}
          >
            {t("save")}
          </button>
        }
      />
      <div className="px-6 pt-4 pb-32 space-y-5">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground text-2xl font-semibold flex items-center justify-center">PD</div>
            <button aria-label="Change photo" className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
              <Camera size={16} />
            </button>
          </div>
        </div>

        <Group title="Personal">
          <TextField label={t("fullName")} value={name} onChange={(e) => onChange(setName)(e.target.value)} error={errors.name} />
        </Group>

        <Group title="Contact">
          <TextField label={t("phoneLabel")} value={phone ?? ""} disabled rightAddon={<span className="pr-3 text-[10px] text-success font-bold">VERIFIED</span>} />
          <TextField label="Email" type="email" value={email} onChange={(e) => onChange(setEmail)(e.target.value)} error={errors.email} />
          <TextField label="City" value={city} onChange={(e) => onChange(setCity)(e.target.value)} />
        </Group>

        <Group title={t("language")}>
          <button onClick={() => setLangOpen(true)} className="ls-card w-full px-4 h-[52px] flex items-center justify-between tap">
            <span className="text-sm font-medium">{t("language")}</span>
            <span className="text-sm font-native text-muted-foreground">{meta.native}</span>
          </button>
        </Group>

        <div className="pt-2 space-y-2">
          <Button fullWidth onClick={submit} disabled={!dirty}>{t("saveChanges")}</Button>
          <Button fullWidth variant="ghost" onClick={() => history.back()}>{t("cancel")}</Button>
        </div>
      </div>

      {toast && <Toast message={t("profileUpdated")} variant="success" onClose={() => setToast(false)} />}
      <LanguageSwitcherSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </ScreenShell>
  );
};

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
    {children}
  </section>
);

export default EditProfile;
