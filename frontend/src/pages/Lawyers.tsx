import { useState, useMemo } from "react";
import { ExternalLink, MapPin, Search, ChevronDown, X, Scale, Phone, Mail, Globe, Building2, CheckCircle2 } from "lucide-react";
import { ScreenShell } from "@/components/layout/ScreenShell";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CITIES,
  CATEGORY_META,
  LAWYERS,
  buildLawratoUrl,
  buildVakilSearchUrl,
  type LawyerCategory,
  type LawyerCard,
} from "@/data/lawyers";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as LawyerCategory[];

const Lawyers = () => {
  const { t } = useLanguage();

  const [selectedCity, setSelectedCity] = useState<string>("bangalore");
  const [selectedCategory, setSelectedCategory] = useState<LawyerCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Filter individual lawyers by city + category + search
  const filteredLawyers = useMemo(() => {
    return LAWYERS.filter((lawyer) => {
      if (lawyer.citySlug !== selectedCity) return false;
      if (selectedCategory && !lawyer.categories.includes(selectedCategory)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          lawyer.firm_name.toLowerCase().includes(q) ||
          lawyer.practice_area.toLowerCase().includes(q) ||
          (lawyer.area && lawyer.area.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [selectedCity, selectedCategory, searchQuery]);

  const handleOpenLawrato = () => {
    const url = buildLawratoUrl(card.citySlug, card.category);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenVakilSearch = (card: LawyerCard) => {
    const url = buildVakilSearchUrl(card.citySlug, card.category);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleExploreAll = () => {
    const url = buildLawratoUrl(selectedCity, selectedCategory);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <ScreenShell>
      <StickyHeader title={t("findLawyer")} showLanguagePill />

      <div className="px-4 pt-3 pb-32 space-y-4">

        {/* City selector */}
        <div className="relative">
          <button
            onClick={() => setCityDropdownOpen((v) => !v)}
            className="w-full flex items-center gap-2 ls-card h-11 px-3 text-sm font-medium"
          >
            <MapPin size={15} className="text-primary shrink-0" />
            <span className="flex-1 text-left">{CITIES[selectedCity]}</span>
            <ChevronDown size={15} className={cn("text-muted-foreground transition-transform", cityDropdownOpen && "rotate-180")} />
          </button>

          {cityDropdownOpen && (
            <div className="absolute top-12 left-0 right-0 z-30 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
              <div className="p-2 grid grid-cols-3 gap-1 max-h-60 overflow-y-auto">
                {Object.entries(CITIES).map(([slug, label]) => (
                  <button
                    key={slug}
                    onClick={() => { setSelectedCity(slug); setCityDropdownOpen(false); }}
                    className={cn(
                      "py-2 px-2 rounded-xl text-xs font-medium text-center transition-colors tap",
                      selectedCity === slug
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 ls-card h-11 px-3">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder={t("searchLawyers")}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "ls-chip whitespace-nowrap tap shrink-0",
              !selectedCategory ? "bg-primary text-primary-foreground border-primary" : ""
            )}
          >
            {t("catAll")}
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={cn(
                "ls-chip whitespace-nowrap tap shrink-0 gap-1",
                selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : ""
              )}
            >
              <span>{CATEGORY_META[cat].icon}</span>
              {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>

        {/* Info banner */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2.5 flex items-start gap-2.5">
          <Scale size={14} className="text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-foreground/75 leading-relaxed">
            Lawyer profiles are sourced from{" "}
            <span className="font-semibold text-primary">Lawrato.com</span> — India's largest verified lawyer directory. Tapping a card opens real lawyer listings.
          </p>
        </div>

        {/* Cards */}
        {filteredLawyers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <div className="text-3xl mb-3">🔍</div>
            <p>No results in {CITIES[selectedCity]} for that filter.</p>
            <button
              onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
              className="mt-3 text-primary text-xs underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLawyers.map((lawyer) => (
              <article key={lawyer.id} className="ls-card p-4 space-y-3 hover-lift">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                    👨‍⚖️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-[15px] leading-snug text-primary">
                      {lawyer.firm_name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin size={10} /> {lawyer.area || CITIES[selectedCity]}
                      {lawyer.verified && (
                        <span className="text-green-500 font-medium flex items-center gap-0.5 ml-1">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {lawyer.categories.map((cat: string) => (
                    <span key={cat} className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-md">
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Highlight */}
                <p className="text-xs text-foreground/75 leading-relaxed border-l-2 border-primary/30 pl-2.5">
                  <strong>Practice:</strong> {lawyer.practice_area}
                </p>

                {/* Contact Info */}
                <div className="grid grid-cols-1 gap-1.5 text-[11px] text-muted-foreground">
                  {lawyer.phone && lawyer.phone !== "N/A" && (
                    <div className="flex items-center gap-2"><Phone size={11} /> {lawyer.phone} {lawyer.phone_2 ? `/ ${lawyer.phone_2}` : ''}</div>
                  )}
                  {lawyer.email && lawyer.email !== "N/A" && (
                    <div className="flex items-center gap-2"><Mail size={11} /> {lawyer.email}</div>
                  )}
                  {lawyer.office_address && lawyer.office_address !== "N/A" && (
                    <div className="flex items-start gap-2"><Building2 size={11} className="mt-0.5 shrink-0" /> <span className="line-clamp-2">{lawyer.office_address}</span></div>
                  )}
                </div>

                {/* CTA buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {lawyer.website && lawyer.website !== "N/A" ? (
                    <button
                      onClick={() => window.open(lawyer.website, "_blank")}
                      className="flex items-center justify-center gap-1.5 h-10 rounded-button bg-primary text-primary-foreground text-xs font-semibold tap"
                    >
                      <Globe size={13} />
                      Website
                    </button>
                  ) : (
                    <button disabled className="flex items-center justify-center gap-1.5 h-10 rounded-button bg-muted text-muted-foreground/50 text-xs font-semibold">
                      <Globe size={13} />
                      No Website
                    </button>
                  )}
                  
                  {lawyer.google_maps_link && lawyer.google_maps_link !== "N/A" ? (
                    <button
                      onClick={() => window.open(lawyer.google_maps_link, "_blank")}
                      className="flex items-center justify-center gap-1.5 h-10 rounded-button border border-border text-foreground text-xs font-medium tap hover:border-primary/50"
                    >
                      <MapPin size={13} />
                      Map
                    </button>
                  ) : (
                    <button disabled className="flex items-center justify-center gap-1.5 h-10 rounded-button border border-border/50 text-foreground/50 text-xs font-medium">
                      <MapPin size={13} />
                      No Map
                    </button>
                  )}
                </div>
              </article>
            ))}

            {/* Explore all CTA */}
            <button
              onClick={handleExploreAll}
              className="w-full h-12 rounded-2xl border-2 border-dashed border-primary/30 text-primary text-sm font-medium flex items-center justify-center gap-2 tap hover:bg-primary/5 transition-colors"
            >
              <ExternalLink size={15} />
              Browse more {CITIES[selectedCity]} lawyers on Lawrato
            </button>
          </div>
        )}

        {/* Footer note */}
        <p className="text-[10px] text-muted-foreground text-center pb-2">
          LegalSarathi directs you to Lawrato.com & VakilSearch.com, independent platforms. Verify credentials before engaging any lawyer.
        </p>
      </div>
    </ScreenShell>
  );
};

export default Lawyers;
