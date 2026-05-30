export interface DocumentTemplate {
  id: string;
  category: string;
  name: string;
  description: string;
  estMinutes: number;
  featured?: boolean;
  generatedThisMonth?: number;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [];

export const DOCUMENT_CATEGORIES = [
  "All",
  "Affidavit",
  "RTI",
  "Rent Agreement",
  "Consumer Complaint",
  "FIR Draft",
  "Bail Application",
  "Will",
  "Power of Attorney",
];
