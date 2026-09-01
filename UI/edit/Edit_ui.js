// Gen_TabIO - Edit_ui.js
// Deux zones d'edition : INPUT et OUTPUT
// Marque le core comme "editDirty" lors des changements
// Bouton de verification manuelle forcee

const TEMPO_WITHOUT_PRESS_IN_EDIT = 2000;

const SVG_CHECK = '<svg class="error-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
const SVG_WARNING = '<svg class="error-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';

class EditUI {
    constructor() {
        this.textareaIn = null;
        this.textareaOut = null;
        this.highlightIn = null;
        this.highlightOut = null;
        this.gutterIn = null;
        this.gutterOut = null;
        this.debounceTimer = null;
        this.errorsExpanded = false;
        this.currentErrors = [];
        this.verifyBtn = null;

        this.init();
    }

    init() {
        this.textareaIn = document.getElementById('srcIn');
        this.textareaOut = document.getElementById('srcOut');
        this.highlightIn = document.getElementById('hlIn');
        this.highlightOut = document.getElementById('hlOut');
        this.gutterIn = document.getElementById('gutIn');
        this.gutterOut = document.getElementById('gutOut');
        this.verifyBtn = document.getElementById('btn-verify');

        if (!this.textareaIn || !this.textareaOut) return;

        this.textareaIn.addEventListener('input', () => this.onInput());
        this.textareaIn.addEventListener('scroll', () => this.syncScrollIn());
        this.textareaIn.addEventListener('keydown', (e) => this.handleKeydown(e, this.textareaIn));
        this.textareaIn.addEventListener('paste', (e) => this.handlePaste(e));

        this.textareaOut.addEventListener('input', () => this.onInput());
        this.textareaOut.addEventListener('scroll', () => this.syncScrollOut());
        this.textareaOut.addEventListener('keydown', (e) => this.handleKeydown(e, this.textareaOut));
        this.textareaOut.addEventListener('paste', (e) => this.handlePaste(e));

        const toggleBtn = document.getElementById('error-bar-toggle');
        if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleErrors());

        // Bouton de verification manuelle
        if (this.verifyBtn) {
            this.verifyBtn.addEventListener('click', () => this.forceVerification());
        }

        this.renderAll();
        this.processContent(); // Verification initiale
    }

    onInput() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.renderAll();

        // Marquer immediatement comme dirty
        if (window.core) {
            window.core.markEditDirty();
        }

        this.debounceTimer = setTimeout(() => this.processContent(), TEMPO_WITHOUT_PRESS_IN_EDIT);
    }

    /**
     * Force une verification immediate (bypass le debounce)
     * Appele lors du clic sur le bouton "Verifier"
     */
    forceVerification() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        // Animation visuelle du bouton
        if (this.verifyBtn) {
            this.verifyBtn.classList.add('verifying');
            setTimeout(() => {
                this.verifyBtn.classList.remove('verifying');
            }, 400);
        }

        this.processContent();

        // Notification si erreurs
        const count = this.currentErrors.length;
        if (window.notify) {
            if (count === 0) {
                window.notify({ message: 'Verification OK - Aucune erreur', type: 'success', duration: 2000 });
            } else {
                window.notify({ message: count + ' erreur(s) detectee(s)', type: 'warning', duration: 3000 });
            }
        }

        // Auto-expand la barre si erreurs
        if (count > 0 && !this.errorsExpanded) {
            this.toggleErrors();
        }
    }

    processContent() {
        const inputContent = this.textareaIn.value;
        const outputContent = this.textareaOut.value;

        const parsedIn = this.parseLines(inputContent);
        const parsedOut = this.parseLines(outputContent);
        const errors = [];

        parsedIn.errors.forEach(e => errors.push({ ...e, zone: 'INPUT' }));
        parsedOut.errors.forEach(e => errors.push({ ...e, zone: 'OUTPUT' }));

        const allNames = new Set();
        [...parsedIn.items, ...parsedOut.items].forEach(item => {
            if (allNames.has(item.name)) {
                errors.push({ line: item.line, message: 'Doublon : "' + item.name + '"', zone: 'GLOBAL' });
            }
            allNames.add(item.name);
        });

        this.currentErrors = errors;

        if (window.core) {
            window.core.setInputs(parsedIn.items);
            window.core.setOutputs(parsedOut.items);
        }

        if (window.app) {
            window.app.setIO(parsedIn.items.length, parsedOut.items.length, errors.length);
        }

        this.renderErrorStatus();
        this.renderErrorList();
    }

    parseLines(content) {
        const lines = content.split('\n');
        const result = { items: [], comments: [], errors: [] };

        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            const ln = i + 1;

            if (trimmed === '') continue;
            if (trimmed.startsWith('#')) { result.comments.push({ line: ln }); continue; }

            if (trimmed.includes(':')) {
                const ci = trimmed.indexOf(':');
                const name = trimmed.substring(0, ci).trim();
                const comment = trimmed.substring(ci + 1).trim();

                if (name === '') {
                    result.errors.push({ line: ln, message: 'Nom vide' });
                    continue;
                }

                result.items.push({ name, comment, line: ln });
            } else {
                result.errors.push({ line: ln, message: 'Format attendu : nom : commentaire' });
            }
        }

        return result;
    }

    handlePaste(e) {
        const text = e.clipboardData.getData('text/plain');
        if (text.includes('[INPUT]') || text.includes('[OUTPUT]')) {
            e.preventDefault();
            this.distributeContent(text);
        }
    }

    distributeContent(text) {
        const lines = text.split('\n');
        let section = null;
        const inLines = [];
        const outLines = [];

        for (const line of lines) {
            const t = line.trim();
            if (t === '[INPUT]') { section = 'input'; continue; }
            if (t === '[OUTPUT]') { section = 'output'; continue; }
            if (t.startsWith('#') || t === '') continue;
            if (section === 'input') inLines.push(line);
            else if (section === 'output') outLines.push(line);
        }

        this.textareaIn.value = inLines.join('\n');
        this.textareaOut.value = outLines.join('\n');

        this.renderAll();
        this.onInput();

        if (window.notify) {
            window.notify({ message: 'Contenu distribue', type: 'success', duration: 2000 });
        }
    }

    renderErrorStatus() {
        const el = document.getElementById('error-bar-status');
        if (!el) return;
        const count = this.currentErrors.length;
        const bar = document.getElementById('error-bar');

        if (count === 0) {
            el.innerHTML = SVG_CHECK + '<span class="error-status-text">NO ERROR</span>';
            el.className = 'error-bar-status status-ok';
            if (bar) {
                bar.classList.remove('has-errors-border');
                bar.classList.add('no-errors-border');
            }
        } else {
            el.innerHTML = SVG_WARNING +
                '<span class="error-status-text">ERROR</span>' +
                '<span class="error-status-count">' + count + '</span>';
            el.className = 'error-bar-status status-warn';
            if (bar) {
                bar.classList.add('has-errors-border');
                bar.classList.remove('no-errors-border');
            }
        }
    }

    renderErrorList() {
        const el = document.getElementById('error-bar-body');
        if (!el) return;
        if (this.currentErrors.length === 0) { el.innerHTML = ''; return; }
        el.innerHTML = this.currentErrors.map(e =>
            '<div class="error-item"><span class="error-zone-tag">[' + e.zone + ']</span> Ligne ' + e.line + ' : ' + e.message + '</div>'
        ).join('');
    }

    toggleErrors() {
        this.errorsExpanded = !this.errorsExpanded;
        const bar = document.getElementById('error-bar');
        const toggle = document.getElementById('error-bar-toggle');
        if (bar) bar.classList.toggle('expanded', this.errorsExpanded);
        if (toggle) toggle.classList.toggle('rotated', this.errorsExpanded);
    }

    renderAll() {
        this.renderHighlightIn();
        this.renderHighlightOut();
        this.renderGutterIn();
        this.renderGutterOut();
    }

    renderHighlightIn() {
        if (!this.textareaIn || !this.highlightIn) return;
        this.highlightIn.innerHTML = this.highlightSyntax(this.textareaIn.value);
    }

    renderHighlightOut() {
        if (!this.textareaOut || !this.highlightOut) return;
        this.highlightOut.innerHTML = this.highlightSyntax(this.textareaOut.value);
    }

    highlightSyntax(content) {
        const lines = content.split('\n');
        let html = '';
        for (const line of lines) {
            const t = line.trim();
            if (t === '') { html += '<span class="hl-empty">\n</span>'; }
            else if (t.startsWith('#')) { html += '<span class="hl-comment">' + this.esc(line) + '</span>\n'; }
            else if (t.includes(':')) {
                const ci = line.indexOf(':');
                html += '<span class="hl-name">' + this.esc(line.substring(0, ci)) + '</span><span class="hl-colon">:</span><span class="hl-comment">' + this.esc(line.substring(ci + 1)) + '</span>\n';
            } else { html += '<span class="hl-text">' + this.esc(line) + '</span>\n'; }
        }
        return html;
    }

    esc(text) { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; }

    renderGutterIn() {
        if (!this.textareaIn || !this.gutterIn) return;
        this.gutterIn.innerHTML = this.buildGutter(this.textareaIn.value);
    }

    renderGutterOut() {
        if (!this.textareaOut || !this.gutterOut) return;
        this.gutterOut.innerHTML = this.buildGutter(this.textareaOut.value);
    }

    buildGutter(content) {
        const count = content.split('\n').length;
        let html = '';
        for (let i = 1; i <= count; i++) html += '<span class="gutter-line">' + i + '</span>\n';
        return html;
    }

    syncScrollIn() {
        if (!this.textareaIn || !this.highlightIn || !this.gutterIn) return;
        this.highlightIn.scrollTop = this.textareaIn.scrollTop;
        this.highlightIn.scrollLeft = this.textareaIn.scrollLeft;
        this.gutterIn.parentElement.scrollTop = this.textareaIn.scrollTop;
    }

    syncScrollOut() {
        if (!this.textareaOut || !this.highlightOut || !this.gutterOut) return;
        this.highlightOut.scrollTop = this.textareaOut.scrollTop;
        this.highlightOut.scrollLeft = this.textareaOut.scrollLeft;
        this.gutterOut.parentElement.scrollTop = this.textareaOut.scrollTop;
    }

    handleKeydown(e, textarea) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const s = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, s) + '    ' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = s + 4;
            this.renderAll();
            this.onInput();
        }
    }
}

let editUI = null;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { editUI = new EditUI(); window.editUI = editUI; }, 100);
});
