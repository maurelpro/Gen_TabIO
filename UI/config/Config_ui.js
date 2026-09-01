// Gen_TabIO - Config_ui.js
// Partie 1 : Definition de l'adresse
// Mode Auto par defaut (toggle coche)
// Mode Manuel (toggle non coche)

const TIME_CHECK_AFTER_TYPE_CHAR = 500;

class ConfigUI {
    constructor() {
        this.isAuto = true;
        this.selectedPlc = PLC_PRESETS[0];

        this.plcSelect = null;
        this.modeToggle = null;
        this.inputField = null;
        this.outputField = null;
        this.inputInfo = null;
        this.outputInfo = null;

        this.inputTimer = null;
        this.outputTimer = null;

        this.inputFormatVars = new Set();
        this.outputFormatVars = new Set();

        this.isAdressDefChange = false;

        this.init();
    }

    init() {
        this.plcSelect = document.getElementById('config-plc-select');
        this.modeToggle = document.getElementById('config-mode-toggle');
        this.inputField = document.getElementById('config-input-format');
        this.outputField = document.getElementById('config-output-format');
        this.inputInfo = document.getElementById('config-input-info');
        this.outputInfo = document.getElementById('config-output-info');

        if (!this.plcSelect || !this.modeToggle) {
            console.warn('[ConfigUI] Elements DOM manquants');
            return;
        }

        this.populatePlcSelect();

        this.plcSelect.addEventListener('change', () => this.onPlcChange());

        // Toggle coche = Mode Auto (defaut)
        // Toggle non coche = Mode Manuel
        this.modeToggle.addEventListener('change', (e) => {
            this.isAuto = e.target.checked;
            this.applyMode();
        });

        if (this.inputField) {
            this.inputField.addEventListener('input', () => {
                this.isAdressDefChange = true;
                this.updateGenPanelOutdatedState();
                this.scheduleValidation('input');
            });
        }
        if (this.outputField) {
            this.outputField.addEventListener('input', () => {
                this.isAdressDefChange = true;
                this.updateGenPanelOutdatedState();
                this.scheduleValidation('output');
            });
        }

        document.addEventListener('genpanel-updated', () => {
            this.isAdressDefChange = false;
            this.updateGenPanelOutdatedState();
        });

        // Etat initial : Mode Auto (toggle coche par defaut)
        this.isAuto = true;
        this.modeToggle.checked = true;
        this.applyMode();

        // Emettre l'evenement apres un delai pour laisser GenPanelUI s'initialiser
        setTimeout(() => {
            this.notifyFormatChanged();
        }, 300);
    }

    populatePlcSelect() {
        if (!this.plcSelect) return;
        this.plcSelect.innerHTML = '';
        PLC_PRESETS.forEach(plc => {
            const opt = document.createElement('option');
            opt.value = plc.id;
            opt.textContent = plc.name;
            this.plcSelect.appendChild(opt);
        });
    }

    onPlcChange() {
        const id = this.plcSelect.value;
        this.selectedPlc = PLC_PRESETS.find(p => p.id === id) || PLC_PRESETS[0];
        if (this.isAuto) {
            this.isAdressDefChange = true;
            this.updateGenPanelOutdatedState();
            this.fillFromPreset();
            this.notifyFormatChanged();
        }
    }

    applyMode() {
        if (this.isAuto) {
            // MODE AUTO (toggle coche)
            this.plcSelect.disabled = false;
            this.setFieldEditable(false);
            this.fillFromPreset();
            this.cancelTimers();
            this.resetInfoLabels();
            this.updateStatutPanel(0);
            this.isAdressDefChange = true;
            this.updateGenPanelOutdatedState();
            this.notifyFormatChanged();
        } else {
            // MODE MANUEL (toggle non coche)
            this.plcSelect.disabled = true;
            this.setFieldEditable(true);
        }
    }

    setFieldEditable(editable) {
        if (this.inputField) {
            this.inputField.readOnly = !editable;
            this.inputField.classList.toggle('field-disabled', !editable);
        }
        if (this.outputField) {
            this.outputField.readOnly = !editable;
            this.outputField.classList.toggle('field-disabled', !editable);
        }
    }

    fillFromPreset() {
        if (!this.selectedPlc) return;
        if (this.inputField) this.inputField.value = this.selectedPlc.inputFormat;
        if (this.outputField) this.outputField.value = this.selectedPlc.outputFormat;
        this.showExample('input', this.selectedPlc.inputExample);
        this.showExample('output', this.selectedPlc.outputExample);
    }

    updateGenPanelOutdatedState() {
        const genPanel = document.getElementById('gen-panel');
        if (!genPanel) return;

        if (this.isAdressDefChange) {
            genPanel.classList.add('gen-panel-outdated');
        } else {
            genPanel.classList.remove('gen-panel-outdated');
        }
    }

    scheduleValidation(field) {
        if (this.isAuto) return;

        if (field === 'input' && this.inputTimer) {
            clearTimeout(this.inputTimer);
            this.inputTimer = null;
        }
        if (field === 'output' && this.outputTimer) {
            clearTimeout(this.outputTimer);
            this.outputTimer = null;
        }

        const newTimer = setTimeout(() => {
            this.runValidation(field);
            if (field === 'input') this.inputTimer = null;
            if (field === 'output') this.outputTimer = null;
            this.refreshStatutPanel();
            this.notifyFormatChanged();
        }, TIME_CHECK_AFTER_TYPE_CHAR);

        if (field === 'input') this.inputTimer = newTimer;
        else this.outputTimer = newTimer;
    }

    cancelTimers() {
        if (this.inputTimer) { clearTimeout(this.inputTimer); this.inputTimer = null; }
        if (this.outputTimer) { clearTimeout(this.outputTimer); this.outputTimer = null; }
    }

    runValidation(field) {
        const el = field === 'input' ? this.inputField : this.outputField;
        if (!el) return;
        const error = this.validateFormat(el.value);
        if (error) {
            this.showError(field, error);
        } else {
            this.showExample(field, '');
        }
    }

    validateFormat(value) {
        const braceRegex = /\{([^}]*)\}/g;
        let match;
        const allowedVars = ['x', 'y', 'z'];
        const invalidContents = [];

        while ((match = braceRegex.exec(value)) !== null) {
            const content = match[1];
            const trimmed = content.trim();
            if (trimmed === '') return 'Accolades vides : une variable x, y ou z est attendue.';
            let isValid = true;
            for (let i = 0; i < trimmed.length; i++) {
                if (!allowedVars.includes(trimmed[i])) { isValid = false; break; }
            }
            if (!isValid) invalidContents.push(trimmed);
        }

        if (invalidContents.length > 0) {
            const invalidStr = invalidContents.map(c => '"' + c + '"').join(', ');
            return 'C\'est ' + invalidStr + ' qui n\'est pas valide. Seules les variables \'x\', \'y\' et \'z\' (minuscules) sont autorisees entre les accolades { }.';
        }
        return null;
    }

    showExample(field, exampleText) {
        const el = field === 'input' ? this.inputInfo : this.outputInfo;
        if (!el) return;
        el.textContent = exampleText ? 'Ex : ' + exampleText : '';
        el.classList.remove('info-error');
        el.classList.add('info-example');
    }

    showError(field, message) {
        const el = field === 'input' ? this.inputInfo : this.outputInfo;
        if (!el) return;
        el.textContent = message;
        el.classList.remove('info-example');
        el.classList.add('info-error');
    }

    resetInfoLabels() {
        const inputEx = this.selectedPlc ? this.selectedPlc.inputExample : '';
        const outputEx = this.selectedPlc ? this.selectedPlc.outputExample : '';
        this.showExample('input', inputEx);
        this.showExample('output', outputEx);
    }

    notifyFormatChanged() {
        this.inputFormatVars = this.extractVariablesFromFormat(this.inputField ? this.inputField.value : '');
        this.outputFormatVars = this.extractVariablesFromFormat(this.outputField ? this.outputField.value : '');

        const formulas = this.selectedPlc && this.selectedPlc.formulas ? this.selectedPlc.formulas : null;

        const event = new CustomEvent('config-format-changed', {
            detail: {
                inputFormat: this.inputField ? this.inputField.value : '',
                outputFormat: this.outputField ? this.outputField.value : '',
                inputVars: Array.from(this.inputFormatVars),
                outputVars: Array.from(this.outputFormatVars),
                formulas: formulas
            }
        });
        document.dispatchEvent(event);

        this.syncToCore();
    }

    extractVariablesFromFormat(format) {
        const vars = new Set();
        const braceRegex = /\{([^}]*)\}/g;
        let match;
        while ((match = braceRegex.exec(format)) !== null) {
            const content = match[1].trim();
            for (let i = 0; i < content.length; i++) {
                if (['x', 'y', 'z'].includes(content[i])) vars.add(content[i]);
            }
        }
        return vars;
    }

    refreshStatutPanel() {
        let errorCount = 0;
        if (this.inputField && this.validateFormat(this.inputField.value)) errorCount++;
        if (this.outputField && this.validateFormat(this.outputField.value)) errorCount++;
        this.updateStatutPanel(errorCount);
    }

    updateStatutPanel(errorCount) {
        const event = new CustomEvent('config-errors-update', { detail: { errors: errorCount } });
        document.dispatchEvent(event);
    }

    syncToCore() {
        if (!window.core) return;

        window.core.markConfigDirty();

        const inputFormat = this.inputField ? this.inputField.value : '';
        const outputFormat = this.outputField ? this.outputField.value : '';

        const getFxValue = (id) => {
            const el = document.getElementById(id);
            return el && !el.disabled ? el.value : null;
        };

        const configSys = new ConfigAddressSys({
            inputFormat: inputFormat,
            outputFormat: outputFormat,
            input: {
                startAddress: { x: 0, y: 0, z: null },
                otherAddress: { x: null, y: null, z: null },
                startFormulas: {
                    x: getFxValue('gen-in-start-x'),
                    y: getFxValue('gen-in-start-y'),
                    z: getFxValue('gen-in-start-z')
                },
                otherFormulas: {
                    x: getFxValue('gen-in-other-x'),
                    y: getFxValue('gen-in-other-y'),
                    z: getFxValue('gen-in-other-z')
                }
            },
            output: {
                startAddress: { x: 0, y: 0, z: null },
                otherAddress: { x: null, y: null, z: null },
                startFormulas: {
                    x: getFxValue('gen-out-start-x'),
                    y: getFxValue('gen-out-start-y'),
                    z: getFxValue('gen-out-start-z')
                },
                otherFormulas: {
                    x: getFxValue('gen-out-other-x'),
                    y: getFxValue('gen-out-other-y'),
                    z: getFxValue('gen-out-other-z')
                }
            }
        });

        window.core.setConfigAddressSys(configSys);
    }
}

let configUI = null;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        configUI = new ConfigUI();
        window.configUI = configUI;
    }, 150);
});
