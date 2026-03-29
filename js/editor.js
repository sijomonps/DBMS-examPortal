import { EditorState, Compartment } from "https://esm.sh/@codemirror/state";
import { EditorView, keymap, lineNumbers } from "https://esm.sh/@codemirror/view";
import { defaultKeymap } from "https://esm.sh/@codemirror/commands";
import { sql, PostgreSQL } from "https://esm.sh/@codemirror/lang-sql";
import { basicSetup } from "https://esm.sh/codemirror";

// Custom dark theme for SQLab matching style.css editor background
const sqlabTheme = EditorView.theme({
    "&": {
        color: "#eaffef",
        backgroundColor: "#0a2a19"
    },
    ".cm-content": {
        color: "#eaffef",
        caretColor: "#d4ff8a"
    },
    ".cm-line": {
        color: "#eaffef"
    },
    "&.cm-focused .cm-cursor": {
        borderLeftColor: "#d4ff8a"
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
        backgroundColor: "rgba(170, 255, 120, 0.24)"
    },
    ".cm-gutters": {
        backgroundColor: "#113622",
        color: "#98c2a8",
        border: "none",
        borderRight: "1px solid var(--border)"
    },
    ".cm-keyword": { color: "#7deec5", fontWeight: "bold" },
    ".cm-string": { color: "#d4ff8a" },
    ".cm-comment": { color: "#9cb9a7", fontStyle: "italic" },
    ".cm-variableName": { color: "#ffd08f" },
    ".cm-operator": { color: "#c5ffd6" },
    ".cm-number": { color: "#9fe2ff" }
}, {dark: true});

let view = null;
const editorReadOnlyCompartment = new Compartment();
const editorEditableCompartment = new Compartment();

export function initEditor(containerId, initialDoc = "SELECT * FROM employees;") {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear any existing editor
    container.innerHTML = '';
    
    const state = EditorState.create({
        doc: initialDoc,
        extensions: [
            basicSetup,
            sql({ dialect: PostgreSQL }), // Generic SQL highlighting
            sqlabTheme,
            keymap.of(defaultKeymap),
            lineNumbers(),
            editorReadOnlyCompartment.of(EditorState.readOnly.of(false)),
            editorEditableCompartment.of(EditorView.editable.of(true))
        ]
    });
    
    view = new EditorView({
        state,
        parent: container
    });
    
    return view;
}

export function getEditorContent() {
    if (!view) return "";
    return view.state.doc.toString();
}

export function setEditorContent(content) {
    if (!view) return;
    view.dispatch({
        changes: {from: 0, to: view.state.doc.length, insert: content}
    });
}

export function setEditorEditable(isEditable) {
    if (!view) return;

    const editable = Boolean(isEditable);
    view.dispatch({
        effects: [
            editorReadOnlyCompartment.reconfigure(EditorState.readOnly.of(!editable)),
            editorEditableCompartment.reconfigure(EditorView.editable.of(editable))
        ]
    });
}

export function createReadOnlyEditor(containerId, initialDoc) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const state = EditorState.create({
        doc: initialDoc || '',
        extensions: [
            basicSetup,
            sql({ dialect: PostgreSQL }),
            sqlabTheme,
            lineNumbers(),
            EditorState.readOnly.of(true)
        ]
    });
    
    return new EditorView({
        state,
        parent: container
    });
}
