/**
 * nl-syntax-highlight-plus
 * Fork of NL Syntax Highlighting
 * Author: MichelleGDyason
 * Version: 0.5.0
 *
 * Changes in this fork:
 * - Added highlighting for articles, pronouns, prepositions, and predicates
 * - Fixed adjectives like "several", "award-winning", and multi-word terms
 * - Updated settings structure to support new POS
 */

import { EditorView, ViewUpdate, Decoration, DecorationSet, ViewPlugin } from "@codemirror/view";
import nlp from "compromise";
import { Range } from "@codemirror/state";
import { editorInfoField } from "obsidian";
type NLPDocument = ReturnType<typeof nlp>;
import NLSyntaxHighlightPlugin from "main";

// Helper type for Compromise offsets
interface WordOffset {
    text: string;
    offset: { start: number; length: number };
    terms: { text: string; normal?: string; tags?: string[]; offset: { start: number; length: number } }[];
}

// Defines a highlight decoration
export interface DecorationSpec {
    partOfSpeech: string;
    start: number; // relative to line start
    end: number;
}

// Conceptual mapping for interpretive modes
const conceptualMaps: Record<string, Record<string, { className: string; label: string }>> = {
  grammar: {},
  structuralism: {
    noun: { label: "Signified", className: "signified" },
    verb: { label: "Relation", className: "relation" },
    adjective: { label: "Difference", className: "difference" },
    article: { label: "Definiteness", className: "definiteness" },
  },
  deleuzian: {
    noun: { label: "Assemblage", className: "assemblage" },
    verb: { label: "Becoming", className: "becoming" },
    adjective: { label: "Intensity", className: "intensity" },
    adverb: { label: "Force", className: "force" },
    article: { label: "Territory", className: "territory" },
    predicate: { label: "Event", className: "event" },
  },
  foucaultian: {
    noun: { label: "Discursive Object", className: "discursive-object" },
    verb: { label: "Regulation", className: "regulation" },
    adjective: { label: "Norm", className: "norm" },
    article: { label: "Fixation", className: "fixation" },
    pronoun: { label: "Subject Position", className: "subject-position" },
  },
  geontological: {
    noun: { label: "Entity", className: "entity" },
    verb: { label: "Endurance", className: "endurance" },
    adjective: { label: "Vitality", className: "vitality" },
    predicate: { label: "Geo-Event", className: "geo-event" },
    preposition: { label: "Governance", className: "governance" },
  },
};

function getMatchEnd(match: WordOffset): number {
    const lastTerm = match.terms[match.terms.length - 1];
    if (!lastTerm) {
        return match.offset.start + match.offset.length;
    }

    return lastTerm.offset.start + lastTerm.offset.length;
}

function hasTag(match: WordOffset, tag: string): boolean {
    return match.terms.some(term => term.tags?.includes(tag));
}

function getTerm(match: WordOffset) {
    return match.terms[0];
}

function getSpanKey(match: WordOffset): string {
    return `${match.offset.start}:${getMatchEnd(match)}`;
}

function getOffsetSpanKey(start: number, length: number): string {
    return `${start}:${start + length}`;
}

function isAuxiliaryTerm(match: WordOffset | undefined): boolean {
    const normal = match?.terms[0]?.normal;
    return normal !== undefined && [
        "am",
        "are",
        "be",
        "been",
        "being",
        "can",
        "could",
        "did",
        "do",
        "does",
        "had",
        "has",
        "have",
        "is",
        "may",
        "might",
        "must",
        "shall",
        "should",
        "was",
        "were",
        "will",
        "would",
    ].includes(normal);
}

function getContextualNounCorrections(doc: NLPDocument): { nouns: WordOffset[]; suppressedVerbSpans: Set<string> } {
    const corrections = {
        nouns: [] as WordOffset[],
        suppressedVerbSpans: new Set<string>(),
    };

    const terms = doc.terms().out("offset") as WordOffset[];
    terms.forEach((term, index) => {
        const current = getTerm(term);
        const previous = terms[index - 1];

        if (!current?.tags?.includes("Verb") || current.normal !== "thought") {
            return;
        }

        if (!previous || !hasTag(previous, "Verb") || isAuxiliaryTerm(previous)) {
            return;
        }

        corrections.nouns.push({
            ...term,
            text: current.text,
            terms: [{ ...current, tags: ["Noun"] }],
        });
        corrections.suppressedVerbSpans.add(getSpanKey(term));
    });

    return corrections;
}

function toRoleTerms(match: WordOffset, correctedNounSpanKeys: Set<string>): WordOffset[] {
    return match.terms
        .filter(term =>
            term.tags?.includes("Noun") ||
            term.tags?.includes("Pronoun") ||
            correctedNounSpanKeys.has(getOffsetSpanKey(term.offset.start, term.offset.length))
        )
        .map(term => ({
            text: term.text,
            offset: { ...term.offset },
            terms: [{ ...term }],
        }));
}

function trimObjectChunk(match: WordOffset): WordOffset {
    const firstPrepositionIndex = match.terms.findIndex((term, index) =>
        index > 0 && term.tags?.includes("Preposition")
    );

    if (firstPrepositionIndex === -1) {
        return match;
    }

    const trimmedTerms = match.terms.slice(0, firstPrepositionIndex);
    const lastTerm = trimmedTerms[trimmedTerms.length - 1];

    if (!lastTerm) {
        return match;
    }

    return {
        ...match,
        text: trimmedTerms.map(term => term.text).join(" "),
        terms: trimmedTerms,
        offset: {
            ...match.offset,
            length: lastTerm.offset.start + lastTerm.offset.length - match.offset.start,
        },
    };
}

function getSyntacticRoleMatches(doc: NLPDocument, correctedNounSpanKeys: Set<string>): { subject: WordOffset[]; object: WordOffset[] } {
    const roles: { subject: WordOffset[]; object: WordOffset[] } = {
        subject: [],
        object: [],
    };

    const sentences = doc.sentences();
    if (!sentences?.forEach) {
        return roles;
    }

    sentences.forEach((sentence: NLPDocument) => {
        const chunkOffsets = sentence.chunks().out("offset") as WordOffset[];
        if (!Array.isArray(chunkOffsets) || chunkOffsets.length === 0) {
            return;
        }

        const verbIndex = chunkOffsets.findIndex(chunk => hasTag(chunk, "Verb"));
        if (verbIndex === -1) {
            return;
        }

        for (let index = 0; index < verbIndex; index += 1) {
            const chunk = chunkOffsets[index];
            roles.subject.push(...toRoleTerms(chunk, correctedNounSpanKeys));
        }

        for (let index = verbIndex + 1; index < chunkOffsets.length; index += 1) {
            const chunk = chunkOffsets[index];
            const firstTags = chunk.terms[0]?.tags ?? [];
            const isNominalChunk = chunk.terms.some(term =>
                term.tags?.includes("Noun") ||
                term.tags?.includes("Pronoun") ||
                correctedNounSpanKeys.has(getOffsetSpanKey(term.offset.start, term.offset.length))
            );

            if (firstTags.includes("Preposition") || firstTags.includes("Conjunction") || !isNominalChunk) {
                continue;
            }

            roles.object.push(...toRoleTerms(trimObjectChunk(chunk), correctedNounSpanKeys));
        }
    });

    return roles;
}

// Get all decorations in the currently visible lines
function getAllDecosByLine(view: EditorView, plugin: NLSyntaxHighlightPlugin): { [lineNumber: number]: DecorationSpec[] } {
    const widgets: { [lineNumber: number]: DecorationSpec[] } = {};
    const scope = plugin.settings.classToApplyHighlightingTo.trim();
    if (scope) {
        const file = view.state.field(editorInfoField, false)?.file;
        const frontmatter = file ? plugin.app.metadataCache.getFileCache(file)?.frontmatter : undefined;
        const raw: unknown = frontmatter?.cssclasses ?? frontmatter?.cssclass;
        const classes = typeof raw === "string" ? raw.split(/[\s,]+/) :
            Array.isArray(raw) ? raw.filter((value: unknown): value is string => typeof value === "string") : [];
        if (!classes.includes(scope)) return widgets;
    }

    for (const visibleRange of view.visibleRanges) {
        const startLine = view.state.doc.lineAt(visibleRange.from).number;
        const endLine = view.state.doc.lineAt(visibleRange.to).number;

        for (let i = startLine; i <= endLine; i++) {
            widgets[i] = getDecosOnLine(view, i, plugin);
        }
    }

    return widgets;
}

// Get decorations for a single line
function getDecosOnLine(view: EditorView, lineNumber: number, plugin: NLSyntaxHighlightPlugin): DecorationSpec[] {
    const widgets: DecorationSpec[] = [];

    const line = view.state.doc.line(lineNumber);
    const docText = view.state.sliceDoc(line.from, line.to);

    // Type-safe Compromise doc
    const doc = nlp(docText);
    const contextualCorrections = getContextualNounCorrections(doc);
    const correctedNounSpanKeys = new Set(contextualCorrections.nouns.map(getSpanKey));
    const roleMatches = getSyntacticRoleMatches(doc, correctedNounSpanKeys);



    // Map POS to their matches
    const wordsToHighlight: { [pos: string]: { out(format: "offset"): unknown } | WordOffset[] } = {
        // Adjectives include numerals and quantity descriptors
        adjective: doc.adjectives()
            .concat(doc.match("#Value"))
            .concat(doc.match("(several|many|few|multiple|award-winning)")),

        noun: [
            ...(doc.match("#Noun").not("#Pronoun").not("#Possessive").out("offset") as WordOffset[]),
            ...contextualCorrections.nouns,
        ],

        // Adverbs include discourse and interrogative markers
        adverb: doc.adverbs()
            .concat(doc.match("^(so|how)$")),

        verb: (doc.match("#Verb").out("offset") as WordOffset[])
            .filter(match => !contextualCorrections.suppressedVerbSpans.has(getSpanKey(match))),

        conjunction: doc.conjunctions(),

        // Articles restricted to literal forms only
        article: doc.match("^(a|an|the)$"),

        pronoun: doc.pronouns(),

        preposition: doc.prepositions(),

        // Predicate as event field
        predicate: doc.match("#Verb #Noun?"),

        subject: roleMatches.subject,
        object: roleMatches.object,
    };

    // Enable map from settings
    const enabledMap: { [pos: string]: boolean } = {
        adjective: plugin.settings.adjectiveEnabled,
        noun: plugin.settings.nounEnabled,
        adverb: plugin.settings.adverbEnabled,
        verb: plugin.settings.verbEnabled,
        conjunction: plugin.settings.conjunctionEnabled,
        article: plugin.settings.articleEnabled,
        pronoun: plugin.settings.pronounEnabled,
        preposition: plugin.settings.prepositionEnabled,
        predicate: plugin.settings.predicateEnabled,
        subject: plugin.settings.subjectEnabled,
        object: plugin.settings.objectEnabled,
    };

    for (const partOfSpeech of Object.keys(wordsToHighlight)) {
        const words = wordsToHighlight[partOfSpeech];
        const matches = Array.isArray(words)
            ? words
            : words.out("offset") as WordOffset[];

        // Iterate offsets
        for (const word of matches) {
            const start = word.offset.start;
            const end = getMatchEnd(word);

            if (start === end) continue;

            // Override words if defined
            const truePartOfSpeech =
                word.text.toLowerCase() in plugin.wordsToOverrideDict
                    ? plugin.wordsToOverrideDict[word.text.toLowerCase()]
                    : partOfSpeech;

            if (enabledMap[truePartOfSpeech]) {
                widgets.push({ partOfSpeech: truePartOfSpeech, start, end });
            }
        }
    }

    return widgets;
}

// Convert decorations by line to CodeMirror DecorationSet
function decosByLineToDecorationSet(
    view: EditorView,
    decorationsByLine: { [lineNumber: number]: DecorationSpec[] },
    plugin: NLSyntaxHighlightPlugin
): DecorationSet {
    // FIX: Use Range<Decoration>[] instead of Decoration[]
    const allWidgets: Range<Decoration>[] = [];

    for (const lineNumberStr of Object.keys(decorationsByLine)) {
        const lineNumber = parseInt(lineNumberStr);
        const widgets = decorationsByLine[lineNumber];
        const lineStart = view.state.doc.line(lineNumber).from;
        const mode = plugin.settings.interpretiveMode;
        const offsetWidgets: Range<Decoration>[] = widgets.map(decoSpec => {
            const classOverride =
                conceptualMaps[mode]?.[decoSpec.partOfSpeech]?.className || decoSpec.partOfSpeech;
            return Decoration.mark({
                inclusive: true,
                attributes: {},
                class: `nlsh-token ${decoSpec.partOfSpeech} ${classOverride}`,
            }).range(decoSpec.start + lineStart, decoSpec.end + lineStart);
        });
        allWidgets.push(...offsetWidgets);
    }

    return Decoration.set(allWidgets, true);
}

// The main plugin
export function createSyntaxHighlightExtension(plugin: NLSyntaxHighlightPlugin) {
return ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;
        decorationsByLine: { [lineNumber: number]: DecorationSpec[] };

        constructor(view: EditorView) {
            this.decorationsByLine = getAllDecosByLine(view, plugin);
            this.decorations = decosByLineToDecorationSet(view, this.decorationsByLine, plugin);
        }

        update(update: ViewUpdate) {
            let shouldRegenerateAllDecorations = false;

            if (plugin.settings.classToApplyHighlightingTo.trim()) {
                shouldRegenerateAllDecorations = update.docChanged || update.viewportChanged;
            } else if (update.docChanged) {
                if (update.startState.doc.lines === update.state.doc.lines) {
                    let changeCount = 0;
                    let lineChangedNumber = 0;
                    let singleCharacterInserted = true;

                    update.changes.iterChangedRanges((fromA, toA, fromB, toB) => {
                        changeCount += 1;
                        if (changeCount > 1) singleCharacterInserted = false;
                        if (!((fromA === toA) && (toB === fromB + 1))) singleCharacterInserted = false;

                        lineChangedNumber = update.view.state.doc.lineAt(toB).number;
                    });

                    if (singleCharacterInserted) {
                        this.decorationsByLine[lineChangedNumber] = getDecosOnLine(update.view, lineChangedNumber, plugin);
                    } else {
                        shouldRegenerateAllDecorations = true;
                    }
                } else {
                    shouldRegenerateAllDecorations = true;
                }
            } else if (update.viewportChanged) {
                shouldRegenerateAllDecorations = true;
            }

            if (shouldRegenerateAllDecorations)
                this.decorationsByLine = getAllDecosByLine(update.view, plugin);

            this.decorations = decosByLineToDecorationSet(update.view, this.decorationsByLine, plugin);
        }
    },
    { decorations: v => v.decorations }
);

}
