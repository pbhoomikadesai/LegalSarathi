import { useState, useMemo } from "react";
import { ExternalLink, MapPin, Search, ChevronDown, X, Scale } from "lucide-react";
import { ScreenShell } from "@desktop/components/layout/ScreenShell";
import { StickyHeader } from "@desktop/components/layout/StickyHeader";
import { useLanguage } from "@desktop/contexts/LanguageContext";
import {
  CITIES,
  CATEGORY_META,
  LAWYER_CARDS,
  buildLawratoUrl,
  buildVakilSearchUrl,
  type LawyerCategory,
  type LawyerCard,
} from "@desktop/data/lawyers";
import { cn } from "@desktop/lib/utils";

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as LawyerCategory[];

const Lawyers = () => {
  const { t } = useLanguage();

  const [selectedCity, setSelectedCity] = useState<string>("bangalore");
  const [selectedCategory, setSelectedCategory] = useState<LawyerCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const filtered = useMemo(() => {
    return LAWYER_CARDS.filter((card) => {
      if (card.citySlug !== selectedCity) return false;
      if (selectedCategory && card.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          card.category.toLowerCase().includes(q) ||
          card.highlight.toLowerCase().includes(q) ||
          CATEGORY_META[card.category].description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCity, selectedCategory, searchQuery]);

  const handleOpenLawrato = (card: LawyerCard) => {
    window.open(buildLawratoUrl(card.citySlug, card.category), "_blank", "noopener,noreferrer");
  };

  const handleOpenVakilSearch = (card: LawyerCard) => {
    window.open(buildVakilSearchUrl(card.citySlug, card.category), "_blank", "noopener,noreferrer");
  };

  const handleExploreAll = () => {
    window.open(buildLawratoUrl(selectedCity, selectedCategory), "_blank", "noopener,noreferrer");
  };

  return (
    <ScreenShell>
      <StickyHeader title={t("findLawyer")} showLanguagePill />

      <div className="px-8 pt-6 pb-12 max-w-6xl space-y-5">

        {/* Top bar: city selector + search */}
        <div className="flex items-center gap-4">
          {/* City dropdown */}
          <div className="relative">
            <button
              onClick={() => setCityDropdownOpen((v) => !v)}
              className="flex items-center gap-2 ls-card h-11 px-4 text-sm font-medium min-w-[160px]"
            >
              <MapPin size={14} className="text-primary shrink-0" />
              <span className="flex-1 text-left">{CITIES[selectedCity]}</span>
              <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", cityDropdownOpen && "rotate-180")} />
            </button>

            {cityDropdownOpen && (
              <div className="absolute top-12 left-0 z-30 w-64 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                <div className="p-2 grid grid-cols-2 gap-1 max-h-64 overflow-y-auto">
                  {Object.entries(CITIES).map(([slug, label]) => (
                    <button
                      key={slug}
                      onClick={() => { setSelectedCity(slug); setCityDropdownOpen(false); }}
                      className={cn(
                        "py-2 px-3 rounded-xl text-sm font-medium text-left transition-colors tap",
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
          <div className="flex-1 flex items-center gap-2 ls-card h-11 px-4">
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

          {/* Explore all */}
          <button
            onClick={handleExploreAll}
            className="flex items-center gap-2 h-11 px-5 rounded-button bg-primary text-primary-foreground text-sm font-semibold tap whitespace-nowrap"
          >
            <ExternalLink size={14} />
            All {CITIES[selectedCity]} Lawyers
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "ls-chip whitespace-nowrap tap",
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
                "ls-chip whitespace-nowrap tap gap-1.5",
                selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : ""
              )}
            >
              <span>{CATEGORY_META[cat].icon}</span>
              {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>

        {/* Info banner */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <Scale size={15} className="text-primary shrink-0" />
          <p className="text-xs text-foreground/75 leading-relaxed">
            Profiles sourced from <span className="font-semibold text-primary">Lawrato.com</span> &amp; <span className="font-semibold text-primary">VakilSearch.com</span> — India's top verified lawyer directories. Clicking a card opens the live listing filtered to your city and legal area.
          </p>
        </div>

        {/* Cards grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-sm">No results in {CITIES[selectedCity]} for that filter.</p>
            <button
              onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
              className="mt-4 text-primary text-xs underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {filtered.map((card) => {
                const meta = CATEGORY_META[card.category];
                return (
                  <article key={card.id} className="ls-card p-5 space-y-3 flex flex-col">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                        {card.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-base leading-snug">
                          {meta.label} Lawyers
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin size={10} /> {card.displayCity}
                          <span className="mx-1">·</span>
                          <span className="font-semibold text-primary">{card.lawyerCount} lawyers</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          ★ {card.ratingRange}
                        </div>
                      </div>
                    </div>

                    {/* Highlight */}
                    <p className="text-xs text-foreground/75 leading-relaxed border-l-2 border-primary/30 pl-3">
                      {card.highlight}
                    </p>

                    {/* Tags + fee */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] bg-muted text-foreground font-medium px-2 py-0.5 rounded-md">
                        {meta.description}
                      </span>
                      <span className="ml-auto text-[11px] text-muted-foreground font-medium">
                        {card.avgFee}
                      </span>
                    </div>

                    {/* CTAs */}
                    <div className="grid grid-cols-2 gap-2 mt-auto pt-1">
                      <button
                        onClick={() => handleOpenLawrato(card)}
                        className="flex items-center justify-center gap-1.5 h-9 rounded-button bg-primary text-primary-foreground text-xs font-semibold tap"
                      >
                        <ExternalLink size={12} />
                        View on Lawrato
                      </button>
                      <button
                        onClick={() => handleOpenVakilSearch(card)}
                        className="flex items-center justify-center gap-1.5 h-9 rounded-button border border-border text-foreground text-xs font-medium tap hover:border-primary/50"
                      >
                        <ExternalLink size={12} />
                        VakilSearch
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Explore all */}
            <button
              onClick={handleExploreAll}
              className="w-full h-14 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-medium flex items-center justify-center gap-2 tap hover:bg-primary/5 transition-colors"
            >
              <ExternalLink size={16} />
              Browse all {CITIES[selectedCity]} lawyers on Lawrato
            </button>
          </>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          LegalSarathi connects you to Lawrato.com & VakilSearch.com, independent platforms. Always verify credentials before engaging a lawyer.
        </p>
      </div>
    </ScreenShell>
  );
};

export default Lawyers;
