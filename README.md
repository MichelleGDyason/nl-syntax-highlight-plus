# Natural Language Syntax Highlight Plus

**Fork of:** [nl-syntax-highlighting](https://github.com/artisticat1/nl-syntax-highlighting)

Highlight parts of speech and sentence roles in your notes, with optional playful interpretive modes inspired by philosophy. Natural Language Syntax Highlight Plus helps you notice how your writing works through coloured words and subject, object, and predicate markers.

This plugin is a fork by MichelleGDyason that extends the original **Natural Language Syntax Highlighting** plugin for Obsidian.

## Interpretive modes

Choose an **Interpretive mode** in the plugin settings. The descriptions beneath each grammatical element change to reflect the selected lens:

- **Grammar:** Familiar grammatical descriptions, such as nouns for people, places, things, and ideas, and verbs for actions, processes, or states of being.
- **Structuralism:** Looks at language through signs, differences, and relations. Nouns become conceptual units, verbs link terms, and adjectives mark differences.
- **Deleuzian:** Plays with assemblages, becoming, intensity, and events. Nouns suggest provisional assemblages, verbs suggest movement or transformation, and adjectives suggest intensities.
- **Foucaultian:** Plays with discourse, power, and norms. Nouns suggest discursive objects, verbs suggest regulation, adjectives suggest norms, and pronouns suggest subject positions.
- **Geontology:** Plays with entities, endurance, vitality, and governance. Nouns suggest forms of persistence, verbs suggest endurance or transition, and adjectives suggest qualities of liveliness.

The philosophical modes are here for a bit of fun: an invitation to experiment with different ways of reading your notes. They are loose, playful interpretations built on grammatical highlighting, not authoritative philosophical analyses. Subject and object markers retain their grammatical meaning across modes. Interpretive modes are separate from the visual themes described below.

**Requests for other interpretive modes are welcome!** [Open an issue](https://github.com/MichelleGDyason/nl-syntax-highlight-plus/issues/new) with your idea and, if possible, examples of how you would describe different parts of speech through that lens.

## Bugs and feedback

If you find a bug, please [raise an issue on GitHub](https://github.com/MichelleGDyason/nl-syntax-highlight-plus/issues). Highlighting is automatic and can sometimes misclassify words or sentence roles. A short example sentence, what you expected, and what actually happened will help reproduce the problem. For colour or display issues, please include your Obsidian theme, the plugin's visual theme and interpretive mode, and a screenshot if possible.

## Changes in this fork
- Added highlighting for **articles** (`a`, `an`, `the`)  
- Added highlighting for **pronouns** (`he`, `she`, `they`, etc.)  
- Added highlighting for **prepositions** (`to`, `from`, `with`, etc.)  
- Added highlighting for **predicates** (parts of a sentence containing a verb and stating something about the subject)
- Fixed TypeScript typing issues for CodeMirror 6 compatibility  
- Renamed the plugin to `Natural Language Syntax Highlight Plus` to avoid conflicts  
- Added new toggles and color options for the new parts of speech (if implemented in settings)

## Themes

This fork introduces user-selectable syntax highlight themes:
	•	Minimal – low-noise writing mode
	•	High-Contrast – accessibility and projection
	•	Teaching Mode – pedagogical highlighting for learning grammar

## Future plans
- Add more parts of speech
- Add more options for customizing the highlighting (underline, bold, etc.)
- Add support for other languages
- Add support for Obsidian mobile
- Add support for Obsidian canvas

## Acknowledgements
- The original plugin was created by [artisticat1](https://github.com/artisticat1/nl-syntax-highlighting) and was the inspiration for this fork.
- This plugin uses the [compromise](https://github.com/spencermountain/compromise) natural language processing library to detect parts of speech.

# Natural Language Syntax Highlighting

A plugin for [Obsidian.md](https://obsidian.md/) that highlights adjectives, nouns, adverbs, verbs, and conjunctions in the editor. Inspired by iA Writer.

![screenshot 1](img/screenshot_1.png)

Colours can be customised in the plugin settings.

![screenshot 2](img/screenshot_2.png)

The highlighting can be toggled on or off at any time via the command **Natural Language Syntax Highlighting: Toggle on/off** in the Command palette.

## Contributing

Any contributions and PRs are welcome.

## Acknowledgements

This plugin uses the [compromise](https://github.com/spencermountain/compromise) natural language processing library to detect parts of speech.
