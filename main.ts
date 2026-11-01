import { Plugin, Notice } from 'obsidian';
import { createSyntaxHighlightExtension } from 'syntaxHighlight';
import { NLSyntaxHighlightPluginSettings, DEFAULT_SETTINGS, NLSyntaxHighlightSettingTab, normalizeTheme, normalizeLegacyColors } from 'settings';
import { Extension } from '@codemirror/state';


export default class NLSyntaxHighlightPlugin extends Plugin {
	settings: NLSyntaxHighlightPluginSettings;
	extensions: Extension[];
	wordsToOverrideDict: {[word: string]: string};
	private disposed = false;

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


	onload(): void {
		void this.initialize().catch((error: unknown) => {
			console.error('Syntax Highlight Plus failed to load', error);
			new Notice('Syntax Highlight Plus could not load. See the console for details.');
		});
	}

	private async initialize() {
		await this.loadSettings();
		if (this.disposed) return;
		this.addSettingTab(new NLSyntaxHighlightSettingTab(this.app, this));
		this.applyTheme();

		this.loadWordsToOverrideDict();

		this.extensions = this.settings.enabled ? [createSyntaxHighlightExtension(this)] : [];
		this.registerEditorExtension(this.extensions);
		this.registerEvent(this.app.metadataCache.on('changed', () => {
			if (this.settings.classToApplyHighlightingTo.trim()) this.reloadEditorExtensions();
		}));
		


		this.addCommands();
	}

	onunload() {
		this.disposed = true;
		document.body.classList.remove("nlsh-theme-minimal", "nlsh-theme-high-contrast", "nlsh-theme-teaching");
	}

	async loadSettings() {
		const saved: unknown = await this.loadData();
		this.settings = { ...DEFAULT_SETTINGS };
		if (saved && typeof saved === "object") {
			for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof NLSyntaxHighlightPluginSettings)[]) {
				const value: unknown = (saved as Record<string, unknown>)[key];
				if (typeof value === typeof DEFAULT_SETTINGS[key]) {
					Object.assign(this.settings, { [key]: value });
				}
			}
		}
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
			this.extensions.push(createSyntaxHighlightExtension(this));
		} else {
			this.extensions.pop();
		}

		this.app.workspace.updateOptions(); 
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
			this.extensions.push(createSyntaxHighlightExtension(this));
		}
		this.app.workspace.updateOptions();
	}
}
