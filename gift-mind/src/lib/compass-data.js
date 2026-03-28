export const compassForks = [
  {
    id: "step0_recipient",
    question: "Who are you gifting?",
    subtitle: "Pick the closest match",
    options: [
      { label: "Partner / Spouse", value: "partner", emoji: "💑" },
      { label: "Mom or Dad", value: "parent", emoji: "👨‍👩‍👧" },
      { label: "Sibling", value: "sibling", emoji: "👫" },
      { label: "Close Friend", value: "friend", emoji: "🫂" },
      { label: "Someone I don't know well", value: "acquaintance", emoji: "🤝" }
    ]
  },
  {
    id: "step1_occasion",
    question: "What's the occasion?",
    subtitle: "Or the closest vibe",
    options: [
      { label: "Birthday", value: "birthday", emoji: "🎂" },
      { label: "Festival (Diwali, Rakhi, etc.)", value: "festival", emoji: "🪔" },
      { label: "Wedding / Anniversary", value: "wedding_anniversary", emoji: "💍" },
      { label: "Just because / Thank you", value: "just_because", emoji: "💛" },
      { label: "Housewarming / New chapter", value: "new_chapter", emoji: "🏡" }
    ]
  },
  {
    id: "step2_experience",
    question: "Something to DO together, or something they enjoy on their own?",
    options: [
      { label: "An experience we share together", value: "together", emoji: "👥" },
      { label: "Something they enjoy solo", value: "solo", emoji: "🧘" },
      { label: "Not sure — surprise me", value: "surprise", emoji: "✨" }
    ]
  },
  {
    id: "step3_vibe",
    question: "What should this gift feel like?",
    options: [
      { label: "Makes a regular day feel special", value: "daily_special", emoji: "☀️" },
      { label: "Tied to a memory or milestone", value: "milestone_memory", emoji: "📸" },
      { label: "Something completely unexpected", value: "unexpected", emoji: "🎁" }
    ]
  },
  {
    id: "step4_nature",
    question: "What kind of gift resonates more?",
    options: [
      { label: "Something they've never tried", value: "new_experience", emoji: "🆕" },
      { label: "Something they already love, but elevated", value: "elevated", emoji: "⬆️" },
      { label: "Something handmade or deeply personal", value: "handmade_personal", emoji: "🤲" }
    ]
  },
  {
    id: "step5_practical",
    question: "Last one — lean practical or lean sentimental?",
    options: [
      { label: "Practical — they'll use it daily", value: "practical", emoji: "🔧" },
      { label: "Sentimental — it's about the feeling", value: "sentimental", emoji: "💝" },
      { label: "A mix of both", value: "both", emoji: "⚖️" }
    ]
  }
];

/**
 * @param {string} forkId
 * @param {string} value
 * @returns {string}
 */
export function labelForForkSelection(forkId, value) {
  const fork = compassForks.find((f) => f.id === forkId);
  const opt = fork?.options?.find((o) => o.value === value);
  return opt?.label || String(value || "").replace(/_/g, " ") || "—";
}
