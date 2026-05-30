import { Scale, ShieldCheck, Sparkles, Users } from "lucide-react";
import { ScreenShell } from "@desktop/components/layout/ScreenShell";
import { StickyHeader } from "@desktop/components/layout/StickyHeader";
import { useLanguage } from "@desktop/contexts/LanguageContext";

const About = () => {
  const { t } = useLanguage();
  return (
    <ScreenShell>
      <StickyHeader title={t("aboutTitle")} showBack showLanguagePill />
      <div className="px-8 pt-4 pb-10 space-y-5">
        <section className="ls-card p-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Scale size={22} />
          </div>
          <h1 className="font-display font-bold text-xl">LegalSarathi</h1>
          <p className="text-xs text-muted-foreground mt-1">Apna Kanoon, Apni Bhasha</p>
          <p className="text-sm text-foreground/80 mt-3 leading-relaxed">
            LegalSarathi is India's multilingual legal companion — built to make laws accessible to every citizen,
            in their own language, on their own phone. From RTI filings to consumer complaints to women's safety,
            we guide you through the law with verified information and connect you to qualified lawyers when needed.
          </p>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Our mission</h2>
          <div className="ls-card p-4 space-y-3">
            {[
              { icon: <Sparkles size={16} />, label: "Plain-language legal information in 8+ Indian languages" },
              { icon: <Users size={16} />, label: "Connect citizens with verified, affordable lawyers" },
              { icon: <ShieldCheck size={16} />, label: "Free emergency SOS for women's safety and abuse cases" },
            ].map((it) => (
              <div key={it.label} className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">{it.icon}</span>
                <p className="text-sm leading-relaxed pt-1">{it.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Important notice</h2>
          <div className="ls-card p-4 border-l-4 border-l-primary">
            <p className="text-xs leading-relaxed text-foreground/80">
              LegalSarathi provides general legal information based on Indian statutes and regulations.
              We do <strong>not</strong> provide legal advice. For your specific situation, please consult
              a qualified advocate. AI responses may contain errors — always verify with a professional.
            </p>
          </div>
        </section>

        <p className="text-center text-[11px] text-muted-foreground">v1.0.0 · Made in India 🇮🇳</p>
      </div>
    </ScreenShell>
  );
};

export default About;
