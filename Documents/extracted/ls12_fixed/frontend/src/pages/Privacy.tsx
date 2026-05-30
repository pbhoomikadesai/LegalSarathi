import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { useLanguage } from "@/contexts/LanguageContext";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="ls-card p-4">
    <h2 className="font-display font-semibold text-sm mb-2">{title}</h2>
    <div className="text-xs text-foreground/80 leading-relaxed space-y-2">{children}</div>
  </section>
);

const Privacy = () => {
  const { t } = useLanguage();
  return (
    <ScreenShell>
      <StickyHeader title={t("privacyTitle")} showBack showLanguagePill />
      <div className="px-6 pt-4 pb-10 space-y-4">
        <p className="text-[11px] text-muted-foreground">Last updated: April 2026</p>

        <Section title="1. Information we collect">
          <p>We collect your phone number for authentication, your selected state and language for personalization, and your chat history to improve responses. We do not sell or share personal data with third parties.</p>
        </Section>

        <Section title="2. How we use your data">
          <p>Your data is used solely to deliver legal guidance, connect you with lawyers, and notify you about laws relevant to your interests. AI conversations are used to improve responses for everyone, in aggregate and anonymized form.</p>
        </Section>

        <Section title="3. Data storage">
          <p>Your profile and case data are stored securely on your device. When you sign in, encrypted backups may be stored in the cloud. You can delete your account at any time from Settings.</p>
        </Section>

        <Section title="4. Your rights">
          <p>You have the right to access, correct, export, or delete your data. Email us at privacy@legalsarathi.in for any request. We respond within 7 days as required under the Digital Personal Data Protection Act, 2023.</p>
        </Section>

        <Section title="5. Children">
          <p>LegalSarathi is intended for users 18 years and above. Minors should use the app only under parental supervision.</p>
        </Section>

        <Section title="6. Contact">
          <p>For privacy concerns, write to <a className="text-primary underline" href="mailto:privacy@legalsarathi.in">privacy@legalsarathi.in</a>.</p>
        </Section>
      </div>
    </ScreenShell>
  );
};

export default Privacy;
