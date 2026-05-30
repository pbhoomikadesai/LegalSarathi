export function detectUrgency(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  const keywords = [
    "arrest", "police", "violence", "beaten", "fir", 
    "bail", "jail", "urgent", "emergency", "threat", 
    "kidnap", "murder", "assault", "assassination"
  ];
  return keywords.some((k) => t.includes(k));
}
