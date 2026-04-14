import { Plugin } from 'obsidian';
import { NLSyntaxHighlightViewPlugin } from 'syntaxHighlight';
import { NLSyntaxHighlightPluginSettings, DEFAULT_SETTINGS, NLSyntaxHighlightSettingTab, normalizeTheme, normalizeLegacyColors } from 'settings';
import { Extension } from '@codemirror/state';


export default class NLSyntaxHighlightPlugin extends Plugin {
	settings: NLSyntaxHighlightPluginSettings;
	extensions: Extension[];
	wordsToOverrideDict: {[word: string]: string};
	styleEl: Element;

	applyTheme() {
		const themeClass = `nlsh-theme-${this.settings.theme}`;
	  
		document.body.classList.remove(
		  "nlsh-theme-minimal",
		  "nlsh-theme-high-contrast",
		  "nlsh-theme-teaching",
		  "nlsh-theme-deleuzian"
		);
	  
		document.body.classList.add(themeClass);
	  }


	async onload() {
		await this.loadSettings();
		this.addSettingTab(new NLSyntaxHighlightSettingTab(this.app, this));
		this.applyTheme();

		this.loadWordsToOverrideDict();

		this.extensions = this.settings.enabled ? [NLSyntaxHighlightViewPlugin.extension] : [];
		this.registerEditorExtension(this.extensions);
		
		this.styleEl = document.head.createEl("style");
		this.reloadStyle();

		this.addCommands();
	}

	onunload() {
		this.styleEl.remove();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.settings.theme = normalizeTheme(this.settings.theme);
		normalizeLegacyColors(this.settings);
		await this.saveData(this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	addCommands() {
		this.addCommand({
			id: "toggle-enabled",
			name: "Toggle on/off",
			callback: async () => {
				this.settings.enabled = !this.settings.enabled;
				await this.saveSettings();
				this.updateExtensionEnabled(this.settings.enabled);
			}
		})
	}

	updateExtensionEnabled(enabled: boolean) {
		if (enabled) {
			this.extensions.push(NLSyntaxHighlightViewPlugin.extension);
		} else {
			this.extensions.pop();
		}

		this.app.workspace.updateOptions(); 
	}

	convertSettingsToStyle(settings: NLSyntaxHighlightPluginSettings) {
		if (settings.classToApplyHighlightingTo.length === 0) {
			return "";
		}

		let style = "";

		// Map each POS to its settings property names
		const posList = [
			{ key: "adjective", enabled: settings.adjectiveEnabled, color: settings.adjectiveColor },
			{ key: "noun", enabled: settings.nounEnabled, color: settings.nounColor },
			{ key: "adverb", enabled: settings.adverbEnabled, color: settings.adverbColor },
			{ key: "verb", enabled: settings.verbEnabled, color: settings.verbColor },
			{ key: "conjunction", enabled: settings.conjunctionEnabled, color: settings.conjunctionColor },
			{ key: "article", enabled: settings.articleEnabled, color: settings.articleColor },
			{ key: "pronoun", enabled: settings.pronounEnabled, color: settings.pronounColor },
			{ key: "preposition", enabled: settings.prepositionEnabled, color: settings.prepositionColor },
			{ key: "predicate", enabled: settings.predicateEnabled, color: settings.predicateColor },
			{ key: "subject", enabled: settings.subjectEnabled, color: settings.subjectColor },
			{ key: "object", enabled: settings.objectEnabled, color: settings.objectColor }
		];

		const classPrefix = settings.classToApplyHighlightingTo.length > 0
			? `.${settings.classToApplyHighlightingTo} `
			: "";

		for (const pos of posList) {
			if (!pos.enabled) continue;
			// Predicate is a separate underline, while subject/object stay additive role markers.
			if (pos.key === "predicate") {
				style += `${classPrefix}.predicate { color: inherit; background-image: linear-gradient(${pos.color}, ${pos.color}); background-repeat: no-repeat; background-size: 100% 2px; background-position: 0 100%; }\n`;
			} else if (pos.key === "subject") {
				style += `${classPrefix}.subject { color: inherit; background-image: linear-gradient(${pos.color}, ${pos.color}); background-repeat: no-repeat; background-size: 100% 2px; background-position: 0 calc(100% - 3px); }\n`;
			} else if (pos.key === "object") {
				style += `${classPrefix}.object { color: inherit; background-image: linear-gradient(${pos.color}, ${pos.color}); background-repeat: no-repeat; background-size: 100% 2px; background-position: 0 calc(100% - 3px); }\n`;
			} else if (pos.key === "adjective") {
				style += `${classPrefix}.adjective { color: ${pos.color}; }\n`;
			} else {
				style += `${classPrefix}.${pos.key} { color: ${pos.color}; }\n`;
			}
		}

		return style;
	}

	reloadStyle() {
		this.styleEl.textContent = this.convertSettingsToStyle(this.settings);
	}

	loadWordsToOverrideDict() {
		const dict: {[word: string]: string} = {};

		const lines = this.settings.wordsToOverride.split("\n");
		lines.forEach(val => {
			const line = val.replaceAll(" ", "").split(":");

			if (line[1])
				dict[line[0]] = line[1];
		});

		this.wordsToOverrideDict = dict;
	}

	reloadEditorExtensions() {
		if (this.settings.enabled) {
			this.extensions.pop();
			this.app.workspace.updateOptions();
			this.extensions.push(NLSyntaxHighlightViewPlugin.extension);
		}
		this.app.workspace.updateOptions();
	}
}
