import { QuizQuestion } from "./types";

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    text: "You discover an ancient, humming mirror in an overgrown forest chapel. What reflects back to you in the dusty glass?",
    options: [
      {
        text: "A blinding, wing-like light searching restlessly for the upper skies.",
        affinity: "Celestial",
        valueEffects: { purity: 18, power: 8, weight: -8 }
      },
      {
        text: "An endless starlit nebula echoing with silent, forgotten languages.",
        affinity: "Stardust",
        valueEffects: { purity: 10, power: 12, weight: 0 }
      },
      {
        text: "A horned shadow that smiles back warm, knowing eyes.",
        affinity: "Abyssal",
        valueEffects: { purity: -16, power: 14, weight: 18 }
      },
      {
        text: "An absolute void. Empty air—cold, perfect, and silent.",
        affinity: "Void",
        valueEffects: { purity: 0, power: 6, weight: -20 }
      }
    ]
  },
  {
    id: 2,
    text: "An ancient temporal guardian offers to trade you absolute wisdom in exchange for your most cherished memory. Do you accept?",
    options: [
      {
        text: "Refuse. My fragile mortal memories are the only anchor of my identity.",
        affinity: "Verdant",
        valueEffects: { purity: 14, power: 4, weight: 12 }
      },
      {
        text: "Accept, but only if we can negotiate and debate its exact philosophical worth first.",
        affinity: "Chronos",
        valueEffects: { purity: 6, power: 14, weight: 6 }
      },
      {
        text: "Concede instantly. Some memories are heavy burdens better left forgotten.",
        affinity: "Infernal",
        valueEffects: { purity: -12, power: 16, weight: -8 }
      },
      {
        text: "Trick the guardian. I absorb their wisdom directly, shifting my weight.",
        affinity: "Void",
        valueEffects: { purity: -18, power: 22, weight: 15 }
      }
    ]
  },
  {
    id: 3,
    text: "Which primal, earthly sensation does your dormant spirit ache for when tethered to physical forms?",
    options: [
      {
        text: "The cool, mossy scent of a primeval wilderness after a heavy downpour.",
        affinity: "Verdant",
        valueEffects: { purity: 16, power: 4, weight: 8 }
      },
      {
        text: "The roaring, untamed fire of a hearth defying a freezing blizzard.",
        affinity: "Infernal",
        valueEffects: { purity: -4, power: 18, weight: 10 }
      },
      {
        text: "The complete, weightless suspension of floating in deep solar orbit.",
        affinity: "Stardust",
        valueEffects: { purity: 8, power: 10, weight: -16 }
      },
      {
        text: "The hypnotic, eternal clicking of a single grandfather clock in an empty estate.",
        affinity: "Chronos",
        valueEffects: { purity: 4, power: 10, weight: 8 }
      }
    ]
  },
  {
    id: 4,
    text: "When your vessel returns to ash and your record has ended, what do you wish to leave behind?",
    options: [
      {
        text: "A quiet ripples of gentle kindness, helping minor flowers grow.",
        affinity: "Celestial",
        valueEffects: { purity: 22, power: 4, weight: 4 }
      },
      {
        text: "An absolute empire of accomplishments carved in unyielding volcanic glass.",
        affinity: "Infernal",
        valueEffects: { purity: -12, power: 18, weight: 26 }
      },
      {
        text: "A cryptic, unverified myth whispered by subsequent generations.",
        affinity: "Abyssal",
        valueEffects: { purity: -6, power: 10, weight: 16 }
      },
      {
        text: "Absolute nothingness. I seek to evaporate like dew before the sun.",
        affinity: "Void",
        valueEffects: { purity: 4, power: 4, weight: -26 }
      }
    ]
  }
];
