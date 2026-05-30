import type { TranslationKey } from "@desktop/i18n/translations";

export interface RightCard {
  id: string;
  titleKey: TranslationKey;
  bulletKeys: TranslationKey[];
  iconBg: string;
  prefilledQuestion: string; // English seed
}

export const RIGHTS_CARDS: RightCard[] = [
  {
    id: "property",
    titleKey: "rightProperty",
    bulletKeys: ["propB1", "propB2", "propB3", "propB4", "propB5"],
    iconBg: "from-primary/15 to-primary/5",
    prefilledQuestion: "Tell me about my property rights in India",
  },
  {
    id: "women",
    titleKey: "rightWomen",
    bulletKeys: ["womB1", "womB2", "womB3", "womB4", "womB5"],
    iconBg: "from-accent/15 to-accent/5",
    prefilledQuestion: "Tell me about women's legal rights in India",
  },
  {
    id: "labour",
    titleKey: "rightLabour",
    bulletKeys: ["labB1", "labB2", "labB3", "labB4", "labB5"],
    iconBg: "from-primary/15 to-primary/5",
    prefilledQuestion: "Tell me about labour law and salary rights",
  },
  {
    id: "consumer",
    titleKey: "rightConsumer",
    bulletKeys: ["conB1", "conB2", "conB3", "conB4", "conB5"],
    iconBg: "from-accent/15 to-accent/5",
    prefilledQuestion: "Tell me about consumer rights in India",
  },
  {
    id: "education",
    titleKey: "rightEdu",
    bulletKeys: ["eduB1", "eduB2", "eduB3", "eduB4", "eduB5"],
    iconBg: "from-primary/15 to-primary/5",
    prefilledQuestion: "Tell me about the Right to Education",
  },
];
