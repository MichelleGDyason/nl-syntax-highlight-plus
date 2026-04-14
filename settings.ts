import { App, PluginSettingTab, Setting, debounce } from 'obsidian';
import NLSyntaxHighlightPlugin from 'main';

export type NLSyntaxTheme =
  | "minimal"
  | "high-contrast"
  | "teaching";

const VALID_THEMES: NLSyntaxTheme[] = ["minimal", "high-contrast", "teaching"];

export function normalizeTheme(value: unknown): NLSyntaxTheme {
  return typeof value === "string" && VALID_THEMES.includes(value as NLSyntaxTheme)
    ? value as NLSyntaxTheme
    : "minimal";
}

export type NLSyntaxInterpretiveMode =
  | "grammar"
  | "structuralism"
  | "deleuzian"
  | "foucaultian"
  | "geontological";

type HighlightKey =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "article"
  | "preposition"
  | "conjunction"
  | "predicate"
  | "subject"
  | "object";

const MODE_DESCRIPTIONS: Record<NLSyntaxInterpretiveMode, Record<HighlightKey, string>> = {
  grammar: {
    noun: "person, place, thing, or idea",
    verb: "action, process, or state of being",
    adjective: "word that modifies a noun",
    adverb: "word that modifies a verb, adjective, or clause",
    pronoun: "word that stands in for a noun phrase",
    article: "determiner marking definiteness or indefiniteness",
    preposition: "word showing relation in space, time, or logic",
    conjunction: "word connecting words, phrases, or clauses",
    predicate: "verb or verb phrase that says something about the subject",
    subject: "who or what the clause is about",
    object: "who or what receives or is affected by the action",
  },
  structuralism: {
    noun: "signified content or conceptual unit",
    verb: "relation that links terms in the structure",
    adjective: "difference that qualifies a term",
    adverb: "modulation of how the relation operates",
    pronoun: "substitution within the signifying chain",
    article: "definiteness that frames a sign relation",
    preposition: "structural relation between terms",
    conjunction: "linkage that binds signifying units",
    predicate: "articulated claim formed inside the structure",
    subject: "grammatical subject marker retained across modes",
    object: "grammatical object marker retained across modes",
  },
  deleuzian: {
    noun: "assemblage or provisional consistency",
    verb: "becoming, movement, or transformation",
    adjective: "intensity or qualitative variation",
    adverb: "force shaping the movement",
    pronoun: "mobile point of reference within a field",
    article: "territorial framing or delimitation",
    preposition: "relation across flows, positions, or gradients",
    conjunction: "connection or disjunction in a series",
    predicate: "event or actualization in the line of becoming",
    subject: "grammatical subject marker retained across modes",
    object: "grammatical object marker retained across modes",
  },
  foucaultian: {
    noun: "discursive object constituted by discourse",
    verb: "regulation or operation of power",
    adjective: "norm that qualifies and orders discourse",
    adverb: "modulation of discursive force",
    pronoun: "subject position within discourse",
    article: "fixation that stabilizes reference",
    preposition: "relation in a discursive formation",
    conjunction: "articulation between statements",
    predicate: "discursive event asserted in a statement",
    subject: "grammatical subject marker retained across modes",
    object: "grammatical object marker retained across modes",
  },
  geontological: {
    noun: "entity or form of persistence",
    verb: "endurance, operation, or transition",
    adjective: "vital quality or mode of liveliness",
    adverb: "modulation of endurance or activity",
    pronoun: "reference point within a field of entities",
    article: "framing of an entity as given or specific",
    preposition: "governance relation across entities",
    conjunction: "binding across coexisting forms",
    predicate: "geo-event or asserted happening",
    subject: "grammatical subject marker retained across modes",
    object: "grammatical object marker retained across modes",
  },
};

function getDescriptionsForMode(mode: NLSyntaxInterpretiveMode) {
  return MODE_DESCRIPTIONS[mode] ?? MODE_DESCRIPTIONS.grammar;
}

const CANONICAL_LEGEND_COLORS: Record<HighlightKey, string> = {
  noun: "#ce4924",
  verb: "#177eb8",
  adjective: "#b97a0a",
  adverb: "#c333a7",
  pronoun: "#b90ab9",
  article: "#0a7ab9",
  preposition: "#178f96",
  conjunction: "#01934e",
  predicate: "hsl(2, 100%, 56%)",
  subject: "hsl(145, 100%, 66%)",
  object: "hsl(18, 60%, 31%)",
};

const VISUAL_DESCRIPTIONS: Record<HighlightKey, string> = {
  noun: "burnt-orange text",
  verb: "blue text",
  adjective: "ochre text",
  adverb: "magenta text",
  pronoun: "purple text",
  article: "blue article text",
  preposition: "teal text",
  conjunction: "green text",
  predicate: "red underline",
  subject: "bright-green underline",
  object: "earth-brown underline",
};

function applyLegendSwatchStyle(
  swatch: HTMLSpanElement,
  key: HighlightKey,
  settings: NLSyntaxHighlightPluginSettings
) {
  const color = CANONICAL_LEGEND_COLORS[key];

  swatch.className = `nlsh-legend-swatch ${key}`;
  swatch.style.display = "inline-block";
  swatch.style.width = "1.2rem";
  swatch.style.height = "1.2rem";
  swatch.style.boxSizing = "border-box";
  swatch.style.background = "none";
  swatch.style.backgroundColor = "transparent";
  swatch.style.border = "none";
  swatch.style.borderBottom = "none";
  swatch.style.borderRadius = "50%";
  swatch.style.boxShadow = "none";
  swatch.style.color = color;
  swatch.style.opacity = "1";

  if (key === "subject" || key === "object" || key === "predicate") {
    swatch.style.borderRadius = "0";
    swatch.style.height = "0.9rem";
    swatch.style.borderBottom = `2px solid ${color}`;
    return;
  }

  if (settings.theme === "teaching") {
    swatch.style.backgroundColor = `color-mix(in srgb, ${color} 25%, transparent)`;
    swatch.style.border = `1px solid ${color}`;
    return;
  }

  swatch.style.backgroundColor = color;

  if (settings.theme === "high-contrast") {
    swatch.style.boxShadow = `0 0 0 1px ${color}`;
  }
}

export interface NLSyntaxHighlightPluginSettings {
  theme: NLSyntaxTheme;
  interpretiveMode: NLSyntaxInterpretiveMode;

  adjectiveEnabled: boolean;
  adjectiveColor: string;
  nounEnabled: boolean;
  nounColor: string;
  adverbEnabled: boolean;
  adverbColor: string;
  verbEnabled: boolean;
  verbColor: string;
  conjunctionEnabled: boolean;
  conjunctionColor: string;
  articleEnabled: boolean;
  articleColor: string;
  pronounEnabled: boolean;
  pronounColor: string;
  prepositionEnabled: boolean;
  prepositionColor: string;
  predicateEnabled: boolean;
  predicateColor: string;
  subjectEnabled: boolean;
  subjectColor: string;
  objectEnabled: boolean;
  objectColor: string;

  classToApplyHighlightingTo: string;
  wordsToOverride: string;
  enabled: boolean;
}

export const DEFAULT_SETTINGS: NLSyntaxHighlightPluginSettings = {
  theme: "minimal",
  interpretiveMode: "grammar",

  adjectiveEnabled: true,
  adjectiveColor: "#b97a0a",
  nounEnabled: true,
  nounColor: "#ce4924",
  adverbEnabled: true,
  adverbColor: "#c333a7",
  verbEnabled: true,
  verbColor: "#177eB8",
  conjunctionEnabled: true,
  conjunctionColor: "#01934e",
  articleEnabled: true,
  articleColor: "#0a7ab9",
  pronounEnabled: true,
  pronounColor: "#b90ab9",
  prepositionEnabled: true,
  prepositionColor: "#178f96",
  predicateEnabled: true,
  predicateColor: "#ff241f",
  subjectEnabled: true,
  subjectColor: "#1f9d55",
  objectEnabled: true,
  objectColor: "#603820",

  classToApplyHighlightingTo: "",
  wordsToOverride: "",
  enabled: true,
};

export function normalizeLegacyColors(settings: NLSyntaxHighlightPluginSettings) {
  if (settings.articleColor === "#ff6600") settings.articleColor = DEFAULT_SETTINGS.articleColor;
  if (settings.pronounColor === "#0099cc") settings.pronounColor = DEFAULT_SETTINGS.pronounColor;
  if (settings.prepositionColor === "#ff00ff") settings.prepositionColor = DEFAULT_SETTINGS.prepositionColor;
  if (settings.predicateColor === "#00cc66") settings.predicateColor = DEFAULT_SETTINGS.predicateColor;
  if (["#d97706", "#7a4a24", "#6a3f22"].includes(settings.objectColor)) {
    settings.objectColor = DEFAULT_SETTINGS.objectColor;
  }
}

export class NLSyntaxHighlightSettingTab extends PluginSettingTab {
  plugin: NLSyntaxHighlightPlugin;

  constructor(app: App, plugin: NLSyntaxHighlightPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.classList.remove(
      "nlsh-theme-minimal",
      "nlsh-theme-high-contrast",
      "nlsh-theme-teaching"
    );
    containerEl.classList.add(`nlsh-theme-${this.plugin.settings.theme}`);

    // Theme selector
    new Setting(containerEl)
      .setName("Syntax highlight theme")
      .setDesc("Controls how parts of speech are visually styled")
      .addDropdown(dropdown => {
        dropdown
          .addOption("minimal", "Minimal")
          .addOption("high-contrast", "High Contrast")
          .addOption("teaching", "Teaching Mode")
          .setValue(this.plugin.settings.theme)
          .onChange(async value => {
            this.plugin.settings.theme = normalizeTheme(value);
            await this.plugin.saveSettings();
            this.plugin.applyTheme();
            this.display();
          });
      });

    new Setting(containerEl)
      .setName("Interpretive mode")
      .setDesc("Conceptual lens applied over grammatical highlighting")
      .addDropdown(dropdown => {
        dropdown
          .addOption("grammar", "Grammar")
          .addOption("structuralism", "Structuralism")
          .addOption("deleuzian", "Deleuzian")
          .addOption("foucaultian", "Foucaultian")
          .addOption("geontological", "Geontology")
          .setValue(this.plugin.settings.interpretiveMode)
          .onChange(async value => {
            this.plugin.settings.interpretiveMode = value as any;
            await this.plugin.saveSettings();
            this.plugin.reloadEditorExtensions();
            this.display();
          });
      });

    const descriptions = getDescriptionsForMode(this.plugin.settings.interpretiveMode);

    // POS ladder with toggles and swatches using addExtraButton
    const posList: {
      key: keyof NLSyntaxHighlightPluginSettings;
      conceptKey: HighlightKey;
      label: string;
    }[] = [
      { key: 'nounEnabled', conceptKey: 'noun', label: 'Noun' },
      { key: 'verbEnabled', conceptKey: 'verb', label: 'Verb' },
      { key: 'adjectiveEnabled', conceptKey: 'adjective', label: 'Adjective' },
      { key: 'adverbEnabled', conceptKey: 'adverb', label: 'Adverb' },
      { key: 'pronounEnabled', conceptKey: 'pronoun', label: 'Pronoun' },
      { key: 'articleEnabled', conceptKey: 'article', label: 'Article' },
      { key: 'prepositionEnabled', conceptKey: 'preposition', label: 'Preposition' },
      { key: 'conjunctionEnabled', conceptKey: 'conjunction', label: 'Conjunction' },
      { key: 'predicateEnabled', conceptKey: 'predicate', label: 'Predicate' },
      { key: 'subjectEnabled', conceptKey: 'subject', label: 'Subject' },
      { key: 'objectEnabled', conceptKey: 'object', label: 'Object' },
    ];

    posList.forEach(({ key, conceptKey, label }) => {
      const setting = new Setting(containerEl);

      const nameWrapper = document.createElement('div');
      nameWrapper.style.display = 'flex';
      nameWrapper.style.alignItems = 'center';
      nameWrapper.style.gap = '0.5rem';

      const swatch = document.createElement('span');
      applyLegendSwatchStyle(swatch, conceptKey, this.plugin.settings);

      const nameText = document.createElement('span');
      nameText.textContent = label;

      nameWrapper.appendChild(swatch);
      nameWrapper.appendChild(nameText);

      const nameFragment = document.createDocumentFragment();
      nameFragment.appendChild(nameWrapper);
      setting.setName(nameFragment);
      setting.setDesc(`${descriptions[conceptKey]} · shown as ${VISUAL_DESCRIPTIONS[conceptKey]}`);

      setting.addToggle(toggle => {
        toggle.setValue(this.plugin.settings[key] as boolean)
          .onChange(async (value: boolean) => {
            (this.plugin.settings[key as keyof NLSyntaxHighlightPluginSettings] as boolean) = value;
            await this.plugin.saveSettings();
            this.plugin.reloadEditorExtensions();
          });
      });
    });

    // Global enable toggle
    new Setting(containerEl)
      .setName('Enabled')
      .setDesc('Toggle the highlighting on or off')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.enabled)
          .onChange(async (value: boolean) => {
            this.plugin.settings.enabled = value;
            await this.plugin.saveSettings();
            this.plugin.updateExtensionEnabled(value);
          });
      });

    // Miscellaneous section
    new Setting(containerEl).setName('Misc').setHeading();

    new Setting(containerEl)
      .setName('Words to override')
      .setDesc('Occasionally, words may be misclassified. Use format: word: part of speech (POS) (e.g., snowy: adjective, that: conjunction, like: preposition, michelle: subject, report: object) each on a new line')
      .addTextArea(text => text
        .setValue(this.plugin.settings.wordsToOverride)
        .onChange(async value => {
          this.plugin.settings.wordsToOverride = value;
          this.plugin.loadWordsToOverrideDict();
          debounce(() => { this.plugin.reloadEditorExtensions(); }, 1000)();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('CSS class to apply syntax highlighting to')
      .setDesc('Apply highlighting only to notes with this YAML class')
      .addText(text => text
        .setValue(this.plugin.settings.classToApplyHighlightingTo)
        .onChange(async value => {
          this.plugin.settings.classToApplyHighlightingTo = value;
          await this.plugin.saveSettings();
          this.plugin.reloadStyle();
        })
      );
  }
}
