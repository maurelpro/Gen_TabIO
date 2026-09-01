// Gen_TabIO - GenPanel_ui.js
// Partie 2 : Formules de generation des adresses
// Remplissage automatique depuis les formules du preset

const GENPANEL_CHECK_DELAY = 400;

const FX_VARIABLES = [
    { name: 'pos', desc: 'Index courant', type: 'common' },
    { name: 'INPUT_COUNT', desc: 'Nombre total d\'entrees', type: 'common' },
    { name: 'OUTPUT_COUNT', desc: 'Nombre total de sorties', type: 'common' },
    { name: 'INPUT_ADDRESS_START_X', desc: 'X debut INPUT', type: 'input', axis: 'x' },
    { name: 'INPUT_ADDRESS_START_Y', desc: 'Y debut INPUT', type: 'input', axis: 'y' },
    { name: 'INPUT_ADDRESS_START_Z', desc: 'Z debut INPUT', type: 'input', axis: 'z' },
    { name: 'INPUT_ADDRESS_END_X', desc: 'X fin INPUT', type: 'input', axis: 'x' },
    { name: 'INPUT_ADDRESS_END_Y', desc: 'Y fin INPUT', type: 'input', axis: 'y' },
    { name: 'INPUT_ADDRESS_END_Z', desc: 'Z fin INPUT', type: 'input', axis: 'z' },
    { name: 'OUTPUT_ADDRESS_START_X', desc: 'X debut OUTPUT', type: 'output', axis: 'x' },
    { name: 'OUTPUT_ADDRESS_START_Y', desc: 'Y debut OUTPUT', type: 'output', axis: 'y' },
    { name: 'OUTPUT_ADDRESS_START_Z', desc: 'Z debut OUTPUT', type: 'output', axis: 'z' },
    { name: 'OUTPUT_ADDRESS_END_X', desc: 'X fin OUTPUT', type: 'output', axis: 'x' },
    { name: 'OUTPUT_ADDRESS_END_Y', desc: 'Y fin OUTPUT', type: 'output', axis: 'y' },
    { name: 'OUTPUT_ADDRESS_END_Z', desc: 'Z fin OUTPUT', type: 'output', axis: 'z' }
];

class GenPanelUI {
    constructor() {
        this.fxFields = [];
        this.activePopup = null;
        this.popupSelectedIndex = 0;
        this.inputFormatVars = new Set();
        this.outputFormatVars = new Set();
        this.validationTimers = {};

        this.init();
    }

    init() {
        document.addEventListener('config-format-changed', (e) => {
            this.inputFormatVars = new Set(e.detail.inputVars);
            this.outputFormatVars = new Set(e.detail.outputVars);
            this.updateFieldStates();

            // Remplir les formules si disponibles
            if (e.detail.formulas) {
                this.fillFormulas(e.detail.formulas);
            }

            const confirmEvent = new CustomEvent('genpanel-updated');
            document.dispatchEvent(confirmEvent);
        });

        this.initFxFields();
        this.disableAllFields();
    }

    disableAllFields() {
        this.fxFields.forEach(fieldData => {
            fieldData.el.classList.add('fx-disabled');
            fieldData.el.disabled = true;
            if (fieldData.label) fieldData.label.classList.add('xyz-disabled');
            this.setLedState(fieldData, 'off');
            this.hideError(fieldData);
        });
    }

    initFxFields() {
        this.fxFields = [];
        const fields = document.querySelectorAll('.gen-fx-field');

        fields.forEach(field => {
            const id = field.id;
            const fieldData = {
                id: id,
                el: field,
                highlight: document.getElementById(id + '-hl'),
                popup: document.getElementById(id + '-popup'),
                label: document.getElementById(id + '-label'),
                led: document.getElementById(id + '-led'),
                error: document.getElementById(id + '-error'),
                axis: field.dataset.axis,
                group: field.dataset.group,
                type: field.dataset.type
            };

            this.fxFields.push(fieldData);

            field.addEventListener('input', () => this.onFieldInput(fieldData));
            field.addEventListener('keydown', (e) => this.onFieldKeydown(e, fieldData));
            field.addEventListener('blur', () => this.onFieldBlur(fieldData));

            this.highlightField(fieldData);
            this.setLedState(fieldData, 'off');
        });
    }

    updateFieldStates() {
        this.fxFields.forEach(fieldData => {
            const axis = fieldData.axis;
            const group = fieldData.group;
            const enabledVars = group === 'input' ? this.inputFormatVars : this.outputFormatVars;
            const isEnabled = enabledVars.has(axis);

            if (isEnabled) {
                fieldData.el.classList.remove('fx-disabled');
                fieldData.el.disabled = false;
                if (fieldData.label) fieldData.label.classList.remove('xyz-disabled');
                this.setLedState(fieldData, 'neutral');
            } else {
                fieldData.el.classList.add('fx-disabled');
                fieldData.el.disabled = true;
                if (fieldData.label) fieldData.label.classList.add('xyz-disabled');
                this.setLedState(fieldData, 'off');
                this.hideError(fieldData);
                fieldData.el.value = '';
                this.highlightField(fieldData);
            }
        });
    }

    // ============================================================
    // Remplissage automatique des formules depuis le preset
    // ============================================================

    fillFormulas(formulas) {
        if (!formulas) return;

        this.fxFields.forEach(fieldData => {
            const group = fieldData.group;
            const type = fieldData.type;
            const axis = fieldData.axis;

            if (!fieldData.el.disabled) {
                const formulaGroup = formulas[group];
                if (formulaGroup && formulaGroup[type] && formulaGroup[type][axis] !== undefined) {
                    const formula = formulaGroup[type][axis];
                    if (formula !== null && formula !== '') {
                        fieldData.el.value = formula;
                        this.highlightField(fieldData);
                        this.onFieldInput(fieldData);
                    }
                }
            }
        });
    }

    onFieldInput(fieldData) {
        if (fieldData.el.disabled) return;

        this.highlightField(fieldData);

        if (this.validationTimers[fieldData.id]) {
            clearTimeout(this.validationTimers[fieldData.id]);
        }

        this.validationTimers[fieldData.id] = setTimeout(() => {
            this.validateField(fieldData);
        }, GENPANEL_CHECK_DELAY);
    }

    onFieldKeydown(e, fieldData) {
        if (e.ctrlKey && e.code === 'Space') {
            e.preventDefault();
            this.showAutocomplete(fieldData, '');
            return;
        }

        if (this.activePopup === fieldData.popup && fieldData.popup.classList.contains('visible')) {
            const items = fieldData.popup.querySelectorAll('.fx-autocomplete-item:not(.disabled)');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.popupSelectedIndex = (this.popupSelectedIndex + 1) % items.length;
                this.updatePopupSelection(fieldData.popup, items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.popupSelectedIndex = (this.popupSelectedIndex - 1 + items.length) % items.length;
                this.updatePopupSelection(fieldData.popup, items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (items[this.popupSelectedIndex]) {
                    this.insertAutocomplete(fieldData, items[this.popupSelectedIndex].dataset.value);
                }
                this.hideAutocomplete();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hideAutocomplete();
            }
        }
    }

    onFieldBlur(fieldData) {
        setTimeout(() => {
            if (this.activePopup === fieldData.popup) {
                this.hideAutocomplete();
            }
        }, 200);
    }

    validateField(fieldData) {
        const value = fieldData.el.value.trim();

        if (value === '') {
            this.setLedState(fieldData, 'neutral');
            this.hideError(fieldData);
            return;
        }

        const error = this.validateFormula(value, fieldData);

        if (error) {
            this.setLedState(fieldData, 'error');
            this.showError(fieldData, error);
        } else {
            this.setLedState(fieldData, 'ok');
            this.hideError(fieldData);
        }
    }

    validateFormula(formula, fieldData) {
        const allowedPattern = /^[a-zA-Z_0-9\s+\-*/%().]+$/;
        if (!allowedPattern.test(formula)) {
            return 'Caracteres non autorises detects.';
        }

        let parenCount = 0;
        for (let i = 0; i < formula.length; i++) {
            if (formula[i] === '(') parenCount++;
            if (formula[i] === ')') parenCount--;
            if (parenCount < 0) return 'Parenthese fermante sans ouvrante.';
        }
        if (parenCount > 0) return 'Parenthese(s) ouvrante(s) non fermee(s).';

        const tokens = this.tokenize(formula);

        const knownVars = new Set(['pos']);
        FX_VARIABLES.forEach(v => knownVars.add(v.name));

        for (const token of tokens) {
            if (token.type === 'var') {
                if (!knownVars.has(token.value)) {
                    return 'Variable inconnue : "' + token.value + '"';
                }
            }
        }

        for (let i = 0; i < tokens.length - 1; i++) {
            if (tokens[i].type === 'op' && tokens[i].value === '/') {
                if (tokens[i + 1] && tokens[i + 1].type === 'num' && tokens[i + 1].value === '0') {
                    return 'Division par zero detectee.';
                }
            }
        }

        for (let i = 0; i < tokens.length - 1; i++) {
            if (tokens[i].type === 'op' && tokens[i + 1].type === 'op') {
                return 'Operateurs consecutifs invalides.';
            }
        }

        return null;
    }

    tokenize(formula) {
        const tokens = [];
        let i = 0;

        while (i < formula.length) {
            const ch = formula[i];

            if (ch === ' ') { i++; continue; }

            if ('+-*/%'.includes(ch)) {
                tokens.push({ type: 'op', value: ch });
                i++;
            }
            else if ('()'.includes(ch)) {
                tokens.push({ type: 'paren', value: ch });
                i++;
            }
            else if (/\d/.test(ch)) {
                let num = '';
                while (i < formula.length && /\d/.test(formula[i])) { num += formula[i]; i++; }
                tokens.push({ type: 'num', value: num });
            }
            else if (/[a-zA-Z_]/.test(ch)) {
                let word = '';
                while (i < formula.length && /[a-zA-Z_0-9]/.test(formula[i])) { word += formula[i]; i++; }
                tokens.push({ type: 'var', value: word });
            }
            else { i++; }
        }

        return tokens;
    }

    setLedState(fieldData, state) {
        if (!fieldData.led) return;
        fieldData.led.classList.remove('led-ok', 'led-error', 'led-neutral', 'led-off');
        fieldData.led.classList.add('led-' + state);
    }

    showError(fieldData, message) {
        if (!fieldData.error) return;
        fieldData.error.textContent = message;
        fieldData.error.classList.add('error-visible');
    }

    hideError(fieldData) {
        if (!fieldData.error) return;
        fieldData.error.textContent = '';
        fieldData.error.classList.remove('error-visible');
    }

    highlightField(fieldData) {
        if (!fieldData.highlight || !fieldData.el) return;
        const value = fieldData.el.value;
        fieldData.highlight.innerHTML = this.syntaxHighlight(value);
    }

    syntaxHighlight(text) {
        if (!text) return '';
        let html = '';
        let i = 0;

        while (i < text.length) {
            const ch = text[i];

            if ('+-*/%'.includes(ch)) {
                html += '<span class="fx-op">' + this.esc(ch) + '</span>';
                i++;
            }
            else if ('()'.includes(ch)) {
                html += '<span class="fx-paren">' + this.esc(ch) + '</span>';
                i++;
            }
            else if (/\d/.test(ch)) {
                let num = '';
                while (i < text.length && /\d/.test(text[i])) { num += text[i]; i++; }
                html += '<span class="fx-number">' + num + '</span>';
            }
            else if (/[a-zA-Z_]/.test(ch)) {
                let word = '';
                while (i < text.length && /[a-zA-Z_0-9]/.test(text[i])) { word += text[i]; i++; }

                if (word === 'pos') {
                    html += '<span class="fx-var-pos">' + word + '</span>';
                } else if (word.startsWith('INPUT_')) {
                    html += '<span class="fx-var-input">' + word + '</span>';
                } else if (word.startsWith('OUTPUT_')) {
                    html += '<span class="fx-var-output">' + word + '</span>';
                } else {
                    html += '<span class="fx-error">' + word + '</span>';
                }
            }
            else if (ch === ' ') {
                html += ' ';
                i++;
            }
            else {
                html += '<span class="fx-error">' + this.esc(ch) + '</span>';
                i++;
            }
        }

        return html;
    }

    esc(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showAutocomplete(fieldData, prefix) {
        this.hideAutocomplete();

        const availableVars = this.getAvailableVariables(fieldData.group);
        const filtered = availableVars.filter(v =>
            v.name.toLowerCase().includes(prefix.toLowerCase())
        );

        if (filtered.length === 0) return;

        this.activePopup = fieldData.popup;
        this.popupSelectedIndex = 0;

        fieldData.popup.innerHTML = '';
        filtered.forEach((v, index) => {
            const item = document.createElement('div');
            item.className = 'fx-autocomplete-item';
            item.textContent = v.name;
            item.title = v.desc;
            item.dataset.value = v.name;
            if (index === 0) item.classList.add('selected');
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.insertAutocomplete(fieldData, v.name);
                this.hideAutocomplete();
            });
            fieldData.popup.appendChild(item);
        });

        fieldData.popup.classList.add('visible');
    }

    hideAutocomplete() {
        if (this.activePopup) {
            this.activePopup.classList.remove('visible');
            this.activePopup = null;
        }
    }

    updatePopupSelection(popup, items) {
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.popupSelectedIndex);
        });
    }

    insertAutocomplete(fieldData, value) {
        const el = fieldData.el;
        const start = el.selectionStart;
        const end = el.selectionEnd;

        let wordStart = start;
        while (wordStart > 0 && /[a-zA-Z_0-9]/.test(el.value[wordStart - 1])) {
            wordStart--;
        }

        el.value = el.value.substring(0, wordStart) + value + el.value.substring(end);
        el.selectionStart = el.selectionEnd = wordStart + value.length;
        el.focus();

        this.highlightField(fieldData);
        this.onFieldInput(fieldData);
    }

    getAvailableVariables(group) {
        return FX_VARIABLES.filter(v => {
            if (v.type === 'common') return true;
            return v.type === group;
        });
    }
}

let genPanelUI = null;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        genPanelUI = new GenPanelUI();
        window.genPanelUI = genPanelUI;
    }, 200);
});
