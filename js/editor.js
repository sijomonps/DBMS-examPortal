import { EditorState } from "https://esm.sh/@codemirror/state";
import { EditorView, keymap, lineNumbers } from "https://esm.sh/@codemirror/view";
import { defaultKeymap } from "https://esm.sh/@codemirror/commands";
import { sql, PostgreSQL } from "https://esm.sh/@codemirror/lang-sql";
import { basicSetup } from "https://esm.sh/codemirror";

// Custom dark theme for SQLab matching style.css editor background
const sqlabTheme = EditorView.theme({
    "&": {
        color: "var(--text-main)",
        backgroundColor: "var(--bg-editor)"
    },
    ".cm-content": {
        caretColor: "#fff"
    },
    "&.cm-focused .cm-cursor": {
        borderLeftColor: "#fff"
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
        backgroundColor: "#3a3a5a"
    },
    ".cm-gutters": {
        backgroundColor: "#111122",
        color: "var(--text-muted)",
        border: "none",
        borderRight: "1px solid var(--border)"
    },
    ".cm-keyword": { color: "var(--kw-color)", fontWeight: "bold" },
    ".cm-string": { color: "var(--str-color)" },
    ".cm-comment": { color: "#6272a4", fontStyle: "italic" },
    ".cm-variableName": { color: "#ffb86c" },
    ".cm-number": { color: "#bd93f9" }
}, {dark: true});

let view = null;

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
            lineNumbers()
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
