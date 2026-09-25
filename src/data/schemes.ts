export type Category = "condition" | "enemy" | "turn";

export interface Scheme {
  id: string;
  name: string;
  cat: Category;
  reveal: string;
  scoring: string;
  bonus: string;
  next: string[];
}

export const CAT_LABEL: Record<Category, string> = {
  condition: "Condition-triggered",
  enemy: "Enemy Activation Ends",
  turn: "End of Turn",
};

export const SCHEMES: Scheme[] = [
  {
    id: "AP",
    name: "Awaken Power",
    cat: "condition",
    reveal:
      "After a friendly model within 2\" of a table quarter's center Interacts to make a Scheme marker, with friendly models in 2 other quarters too.",
    scoring: "1 VP on reveal.",
    bonus:
      '+1 VP: remove a friendly Scheme marker from within 2" of two different quarter centers.',
    next: ["UA", "RB", "PE"],
  },
  {
    id: "BT",
    name: "Breakthrough",
    cat: "enemy",
    reveal: "When an enemy model ends its activation.",
    scoring:
      '1 VP: remove a friendly Scheme marker in the enemy deployment zone with no enemy model within 2".',
    bonus:
      "+1 VP: also remove one marker from the centerline and one from your deployment zone.",
    next: ["GDE", "MILA", "OR", "FJ"],
  },
  {
    id: "CRH",
    name: "Caught Red-Handed",
    cat: "condition",
    reveal:
      'When an enemy model removes a friendly non-Strategy marker within 6" of a friendly model.',
    scoring: "1 VP on reveal.",
    bonus:
      "+1 VP: the triggering enemy model is engaged or killed by end of turn.",
    next: ["BT", "GDE", "THG"],
  },
  {
    id: "FJ",
    name: "Frame Job",
    cat: "condition",
    reveal:
      "Secretly pick a friendly model. Reveal after it suffers damage from an enemy attack while on the enemy table half.",
    scoring: "1 VP on reveal.",
    bonus:
      '+1 VP: remove a friendly Scheme marker within 2" of the chosen model.',
    next: ["RC", "MSNF", "SC", "WTB"],
  },
  {
    id: "GDE",
    name: "Get the Drop on 'Em",
    cat: "condition",
    reveal:
      "After a friendly Charge that drops from a higher to lower elevation and lands a successful attack.",
    scoring: "1 VP on reveal.",
    bonus: "+1 VP: the attacked enemy model is killed by end of turn.",
    next: ["MILA", "PD", "AP", "WTB"],
  },
  {
    id: "LTB",
    name: "Lay the Bait",
    cat: "enemy",
    reveal: "When an enemy model ends its activation.",
    scoring:
      '1 VP: remove a friendly Scheme marker within 4" of that enemy model.',
    bonus: '+1 VP: the removed marker was within 2" of the enemy model.',
    next: ["LYM", "WTB", "PS"],
  },
  {
    id: "LYM",
    name: "Leave Your Mark",
    cat: "turn",
    reveal: "At the end of any turn.",
    scoring:
      '1 VP: more friendly than enemy Scheme markers within 1" of the centerpoint; then remove those friendly markers.',
    bonus:
      "+1 VP: friendly markers outnumbered enemy markers there by 2 or more.",
    next: ["WTB", "PS", "FJ"],
  },
  {
    id: "MILA",
    name: "Make It Look Like an Accident",
    cat: "condition",
    reveal: "When an enemy model suffers damage from falling.",
    scoring: "1 VP on reveal.",
    bonus: "+1 VP: that model is killed or below half health by end of turn.",
    next: ["PD", "FJ", "LTB"],
  },
  {
    id: "MSNF",
    name: "Make Sure They're Not Found",
    cat: "condition",
    reveal:
      "Secretly pick a unique enemy model at half+ health. Reveal after it is killed.",
    scoring: "1 VP on reveal.",
    bonus:
      '+1 VP: remove its Remains marker plus a friendly Scheme marker within 1", same activation window.',
    next: ["RTL", "THG", "UA"],
  },
  {
    id: "OR",
    name: "Organ Retrieval",
    cat: "condition",
    reveal:
      "First time a friendly model Interacts an enemy Remains marker onto your crew card.",
    scoring: "1 VP on reveal.",
    bonus:
      "+1 VP: two or more Remains markers collected this way by end of turn.",
    next: ["AP", "UA", "PS"],
  },
  {
    id: "PE",
    name: "Plant Evidence",
    cat: "turn",
    reveal: "At the end of any turn.",
    scoring:
      '1 VP: remove three friendly Scheme markers within 2" of enemy model(s).',
    bonus: "+1 VP: remove one additional qualifying marker.",
    next: ["CRH", "BT", "RTL"],
  },
  {
    id: "PD",
    name: "Public Demonstration",
    cat: "turn",
    reveal:
      "Secretly pick a unique enemy model. Reveal at the end of any turn.",
    scoring:
      '1 VP: two or more friendly minions within 2" of the chosen model.',
    bonus:
      '+1 VP: remove a friendly Scheme marker within 1" of the chosen model.',
    next: ["FJ", "RC", "RB"],
  },
  {
    id: "PS",
    name: "Pure Spite",
    cat: "condition",
    reveal:
      "First time a friendly model Interacts an enemy Scheme marker onto your crew card.",
    scoring: "1 VP on reveal.",
    bonus:
      "+1 VP: two or more enemy Scheme markers collected this way in the turn.",
    next: ["PE", "CRH", "MSNF", "PD"],
  },
  {
    id: "RC",
    name: "Reconnaissance",
    cat: "enemy",
    reveal: "When an enemy model ends its activation.",
    scoring:
      "1 VP: remove friendly Scheme markers near two non-touching terrain pieces on the enemy half.",
    bonus: "+1 VP: do it for a third qualifying terrain piece.",
    next: ["MSNF", "RTL", "SAC"],
  },
  {
    id: "RTL",
    name: "Reshape the Land",
    cat: "turn",
    reveal: "Secretly pick a marker type. Reveal at the end of any turn.",
    scoring:
      "1 VP: four friendly markers of that type on the enemy table half.",
    bonus: "+1 VP: five friendly markers of that type there.",
    next: ["THG", "OR", "LYM"],
  },
  {
    id: "RB",
    name: "Runic Binding",
    cat: "enemy",
    reveal: "When an enemy model ends its activation.",
    scoring:
      '1 VP: choose 3 friendly Scheme markers within 14" of each other with an enemy model between them; remove the markers.',
    bonus: "+1 VP: the enemy models caught there cost 15+ combined.",
    next: ["SC", "SAC", "BT"],
  },
  {
    id: "SAC",
    name: "Stake a Claim",
    cat: "turn",
    reveal: "At the end of any turn.",
    scoring: '1 VP: remove two centerline Scheme markers more than 8" apart.',
    bonus: "+1 VP: remove one additional qualifying marker.",
    next: ["LTB", "LYM", "MILA"],
  },
  {
    id: "SC",
    name: "Supply Cache",
    cat: "turn",
    reveal: "At the end of any turn.",
    scoring:
      '1 VP: remove two Scheme markers at elevation 2+, 6"+ from each other and your deployment zone.',
    bonus: "+1 VP: remove one more, completely on the enemy table half.",
    next: ["SAC", "LTB", "GDE"],
  },
  {
    id: "THG",
    name: "Take the High Ground",
    cat: "turn",
    reveal: "At the end of any turn.",
    scoring: "1 VP: control two or more Ht 2+ terrain pieces.",
    bonus: "+1 VP: control three or more.",
    next: ["OR", "AP", "PD"],
  },
  {
    id: "UA",
    name: "Undercover Agent",
    cat: "turn",
    reveal:
      "Secretly pick a unique friendly model. Reveal at the end of any turn.",
    scoring:
      "1 VP: the model is on the enemy table half with no enemy LoS to it.",
    bonus:
      "+1 VP: it's completely in the enemy deployment zone with no enemy LoS.",
    next: ["RB", "SC", "CRH"],
  },
  {
    id: "WTB",
    name: "Watch Them Burn",
    cat: "enemy",
    reveal:
      "Secretly pick a token type outside this game's strategy. Reveal when an enemy model ends its activation.",
    scoring:
      "1 VP: three or more enemy models carry a friendly copy of that token.",
    bonus:
      "+1 VP: the next enemy model carrying it is killed on your half this turn.",
    next: ["PS", "PE", "RC"],
  },
];

// Each scheme's `next` list includes the scheme immediately after it here.
export const CYCLE: string[] = [
  "AP",
  "UA",
  "RB",
  "SC",
  "SAC",
  "LTB",
  "LYM",
  "WTB",
  "PE",
  "CRH",
  "BT",
  "GDE",
  "MILA",
  "PD",
  "FJ",
  "RC",
  "RTL",
  "OR",
  "PS",
  "MSNF",
  "THG",
];
