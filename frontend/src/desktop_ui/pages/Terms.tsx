import { ScreenShell } from "@desktop/components/layout/ScreenShell";
import { StickyHeader } from "@desktop/components/layout/StickyHeader";
import { useLanguage } from "@desktop/contexts/LanguageContext";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="ls-card p-4">
    <h2 className="font-display font-semibold text-sm mb-2">{title}</h2>
    <div className="text-xs text-foreground/80 leading-relaxed space-y-2">{children}</div>
  </section>
);

const Terms = () => {
  const { t } = useLanguage();
  return (
    <ScreenShell>
      <StickyHeader title={t("termsTitle")} showBack showLanguagePill />
      <div className="px-8 pt-4 pb-10 space-y-4">
        <p className="text-[11px] text-muted-foreground">Last updated: April 2026</p>

        <Section title="1. Service description">
          <p>LegalSarathi provides AI-powered legal information, document templates, and a directory of verified lawyers. We do <strong>not</strong> provide legal advice and are not a substitute for a qualified advocate.</p>
        </Section>

        <Section title="2. User responsibilities">
          <p>You agree to provide accurate information, use the service lawfully, and not impersonate others. You are responsible for verifying all information before relying on it for legal action.</p>
        </Section>

        <Section title="3. Lawyer connections">
          <p>Lawyers listed are independent professionals. Fees, advice, and conduct are between you and the lawyer. LegalSarathi is not a party to your engagement.</p>
        </Section>

        <Section title="4. Premium features">
          <p>Premium subscriptions provide unlimited AI chat, video calls, and saved documents. Cancellation is available anytime; refunds follow our standard policy.</p>
        </Section>

        <Section title="5. Limitation of liability">
          <p>LegalSarathi is provided "as is". We are not liable for damages arising from reliance on AI-generated content. Always consult a qualified advocate for binding advice.</p>
        </Section>

        <Section title="6. Governing law">
          <p>These terms are governed by Indian law. Disputes are subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.</p>
        </Section>
      </div>
    </ScreenShell>
  );
};

export default Terms;
