# Natural Language Syntax Highlight Plus

**Fork of:** [nl-syntax-highlighting](https://github.com/artisticat1/nl-syntax-highlighting)

This plugin is a fork by MichelleGDyason that extends the original **Natural Language Syntax Highlighting** plugin for Obsidian.  

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
