// ============================================================
// Edit_codemirror.js - Initialisation CodeMirror
// ============================================================

const EditCodeMirror = {
    editor: null,
    debounceTimer: null,
    DEBOUNCE_DELAY: 2000,

    defaultContent: `[INPUT]
# Déclarez vos entrées ici
pb_start : Bouton poussoir démarrage
pb_stop : Bouton poussoir arrêt (NC)

[OUTPUT]
# Déclarez vos sorties ici
km1 : Contacteur moteur principal
sol_a : Électrovanne A
`,

    init() {
        const container = document.getElementById('codemirror-container');
        if (!container) return;

        this.editor = CodeMirror(container, {
            value: this.defaultContent,
            mode: null,
            theme: 'dracula',
            lineNumbers: true,
            lineWrapping: false,
            tabSize: 4,
            indentUnit: 4,
            indentWithTabs: false,
            matchBrackets: true,
            autoCloseBrackets: true,
            styleActiveLine: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            keyMap: 'sublime',
            extraKeys: {
                'Ctrl-F': 'findPersistent',
                'Cmd-F': 'findPersistent',
                'Ctrl-H': 'replace',
                'Cmd-H': 'replace',
                'Ctrl-/': 'toggleComment',
                'Cmd-/': 'toggleComment',
                'Tab': (cm) => {
                    if (cm.somethingSelected()) {
                        cm.indentSelection('add');
                    } else {
                        cm.replaceSelection('    ', 'end');
                    }
                },
                'Shift-Tab': (cm) => cm.indentSelection('subtract')
            }
        });

        this.editor.on('change', () => {
            this.applyHighlighting();
            this.scheduleUpdate();
        });

        this.applyHighlighting();
        return this.editor;
    },

    scheduleUpdate() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.processContent(), this.DEBOUNCE_DELAY);
    },

    processContent() {
        const content = this.editor.getValue();
        const parsed = EditParser.parse(content);
        const errors = EditParser.validate(content);

        if (window.EditErrors) EditErrors.update(errors);
        if (window.app) window.app.setIO(parsed.inputs.length, parsed.outputs.length, errors.length);

        if (errors.length > 0 && window.notify) {
            window.notify({ message: `${errors.length} erreur(s) de syntaxe`, type: 'warning', duration: 3000 });
        }
    },

    applyHighlighting() {
        if (!this.editor) return;
        const lineCount = this.editor.lineCount();
        for (let i = 0; i < lineCount; i++) {
            this.editor.removeLineClass(i, 'text');
        }
        const lines = this.editor.getValue().split('\n');
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (trimmed === '[INPUT]') this.editor.addLineClass(i, 'text', 'cm-section-input');
            else if (trimmed === '[OUTPUT]') this.editor.addLineClass(i, 'text', 'cm-section-output');
            else if (trimmed.startsWith('#')) this.editor.addLineClass(i, 'text', 'cm-comment-line');
        }
    },

    getValue() { return this.editor ? this.editor.getValue() : ''; },

    scrollToLine(lineNum) {
        if (!this.editor) return;
        const t = this.editor.charCoords({ line: lineNum, ch: 0 }, 'local');
        this.editor.scrollTo(null, t.top - 50);
    },

    refresh() { if (this.editor) this.editor.refresh(); }
};
