import { PluginSettingTab, Setting } from 'obsidian';
import type { App, SettingDefinitionRender } from 'obsidian';
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

function applyLegendSwatchStyle(swatch: HTMLSpanElement, key: HighlightKey) {
  swatch.className = `nlsh-legend-swatch ${key}`;
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

type SearchableSetting = Omit<SettingDefinitionRender, "render"> & {
  render: (setting: Setting) => void;
};

type RefreshableSettingTab = {
  update?: () => void;
};

export class NLSyntaxHighlightSettingTab extends PluginSettingTab {
  plugin: NLSyntaxHighlightPlugin;

  constructor(app: App, plugin: NLSyntaxHighlightPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private refreshSettings(): void {
    // Obsidian 1.13+ provides update(); older supported versions use the
    // imperative settings page below. The compatibility shape avoids calling
    // a newer API directly when the plugin is running on an older version.
    const refreshable = this as unknown as RefreshableSettingTab;
    if (typeof refreshable.update === "function") refreshable.update();
    else this.renderSettings();
  }

  getSettingDefinitions(): SearchableSetting[] {
    const descriptions = getDescriptionsForMode(this.plugin.settings.interpretiveMode);
    const roles = Object.keys(VISUAL_DESCRIPTIONS) as HighlightKey[];
    return [
      {
        name: "Syntax highlight theme",
        desc: "Controls how parts of speech are visually styled.",
        aliases: ["colours", "colors", "minimal", "high contrast", "teaching"],
        render: setting => {
          setting.addDropdown(dropdown => dropdown
            .addOption("minimal", "Minimal")
            .addOption("high-contrast", "High Contrast")
            .addOption("teaching", "Teaching Mode")
            .setValue(this.plugin.settings.theme)
            .onChange(async value => {
              this.plugin.settings.theme = normalizeTheme(value);
              await this.plugin.saveSettings();
              this.plugin.applyTheme();
              this.refreshSettings();
            }));
        },
      },
      {
        name: "Interpretive mode",
        desc: "Playful conceptual lenses over grammatical highlighting.",
        aliases: ["grammar", "structuralism", "Deleuzian", "Foucaultian", "geontology", "philosophy"],
        render: setting => {
          setting.addDropdown(dropdown => dropdown
            .addOption("grammar", "Grammar")
            .addOption("structuralism", "Structuralism")
            .addOption("deleuzian", "Deleuzian")
            .addOption("foucaultian", "Foucaultian")
            .addOption("geontological", "Geontology")
            .setValue(this.plugin.settings.interpretiveMode)
            .onChange(async value => {
              this.plugin.settings.interpretiveMode = value as NLSyntaxInterpretiveMode;
              await this.plugin.saveSettings();
              this.plugin.reloadEditorExtensions();
              this.refreshSettings();
            }));
        },
      },
      ...roles.map((role): SearchableSetting => {
        const key: `${HighlightKey}Enabled` = `${role}Enabled`;
        const label = role.charAt(0).toUpperCase() + role.slice(1);
        return {
          name: label,
          desc: `${descriptions[role]} · shown as ${VISUAL_DESCRIPTIONS[role]}`,
          aliases: ["highlight", "colour", "color", role, VISUAL_DESCRIPTIONS[role]],
          render: setting => {
            const wrapper = createDiv({ cls: "nlsh-setting-name" });
            const swatch = wrapper.createSpan();
            applyLegendSwatchStyle(swatch, role);
            wrapper.createSpan({ text: label });
            const fragment = createFragment();
            fragment.appendChild(wrapper);
            setting.setName(fragment);
            setting.addToggle(toggle => toggle
              .setValue(this.plugin.settings[key])
              .onChange(async value => {
                this.plugin.settings[key] = value;
                await this.plugin.saveSettings();
                this.plugin.reloadEditorExtensions();
              }));
          },
        };
      }),
      {
        name: "Enabled",
        desc: "Toggle syntax highlighting on or off.",
        aliases: ["enable", "disable", "highlighting"],
        render: setting => {
          setting.addToggle(toggle => toggle
            .setValue(this.plugin.settings.enabled)
            .onChange(async value => {
              this.plugin.settings.enabled = value;
              await this.plugin.saveSettings();
              this.plugin.updateExtensionEnabled(value);
            }));
        },
      },
      {
        name: "Words to override",
        desc: "Correct misclassified words using one word: part-of-speech pair per line, for example snowy: adjective or report: object.",
        aliases: ["dictionary", "corrections", "classification"],
        render: setting => {
          setting.addTextArea(text => text
            .setValue(this.plugin.settings.wordsToOverride)
            .onChange(async value => {
              this.plugin.settings.wordsToOverride = value;
              this.plugin.loadWordsToOverrideDict();
              await this.plugin.saveSettings();
              this.plugin.reloadEditorExtensions();
            }));
        },
      },
      {
        name: "CSS class to apply syntax highlighting to",
        desc: "Only highlight notes with this class in their cssclasses property. Leave blank to highlight all notes.",
        aliases: ["scope", "frontmatter", "YAML", "cssclasses"],
        render: setting => {
          setting.addText(text => text
            .setValue(this.plugin.settings.classToApplyHighlightingTo)
            .onChange(async value => {
              this.plugin.settings.classToApplyHighlightingTo = value;
              await this.plugin.saveSettings();
              this.plugin.reloadEditorExtensions();
            }));
        },
      },
    ];
  }

  private renderSettings(): void {
    this.containerEl.empty();
    for (const definition of this.getSettingDefinitions()) {
      const setting = new Setting(this.containerEl).setName(definition.name);
      if (definition.desc) setting.setDesc(definition.desc);
      definition.render(setting);
    }
  }

  // Older Obsidian versions render the same definitions through the legacy API.
  display(): void {
    this.renderSettings();
  }
}
