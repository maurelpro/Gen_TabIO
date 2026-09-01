// Gen_TabIO - AddrView.js
// Classe de visualisation des adresses pour le panel Apercu
// Communique avec Core et les autres modules

class AddrView {
    constructor() {
        this.container = null;
        this.inputSection = null;
        this.outputSection = null;
        this.inputTableBody = null;
        this.outputTableBody = null;
        this.inputRange = null;
        this.outputRange = null;

        this.inputItems = [];
        this.outputItems = [];
        this.configSys = null;
        this.hasConfigError = false;

        this.init();
    }

    init() {
        this.container = document.getElementById('preview-container');
        if (!this.container) {
            console.warn('[AddrView] Container manquant');
            return;
        }

        this.buildDOM();

        // Ecouter les changements de donnees depuis Edit
        document.addEventListener('edit-data-changed', (e) => {
            this.inputItems = e.detail.inputs || [];
            this.outputItems = e.detail.outputs || [];
            this.render();
        });

        // Ecouter les changements de configuration depuis Config
        document.addEventListener('config-format-changed', (e) => {
            this.updateConfig(e.detail);
        });

        // Ecouter les erreurs de configuration
        document.addEventListener('config-errors-update', (e) => {
            this.hasConfigError = (e.detail.errors || 0) > 0;
            this.render();
        });

        // Ecouter les changements dans Core
        if (window.core) {
            window.core.on('config-address-changed', (config) => {
                this.configSys = config;
                this.render();
            });
        }

        this.render();
    }

    // ============================================================
    // Construction du DOM
    // ============================================================

    buildDOM() {
        this.container.innerHTML = '';

        // Section INPUT
        this.inputSection = document.createElement('div');
        this.inputSection.className = 'preview-section';

        const inputHeader = document.createElement('div');
        inputHeader.className = 'preview-section-header';

        const inputTitleWrap = document.createElement('div');
        inputTitleWrap.className = 'preview-section-title-wrap';

        const inputDot = document.createElement('span');
        inputDot.className = 'preview-section-dot config-column-dot-input';

        const inputTitle = document.createElement('span');
        inputTitle.className = 'preview-section-title';
        inputTitle.textContent = 'INPUT';

        inputTitleWrap.appendChild(inputDot);
        inputTitleWrap.appendChild(inputTitle);

        this.inputRange = document.createElement('span');
        this.inputRange.className = 'preview-section-range';
        this.inputRange.textContent = '';

        inputHeader.appendChild(inputTitleWrap);
        inputHeader.appendChild(this.inputRange);

        const inputTable = document.createElement('table');
        inputTable.className = 'preview-table';

        const inputThead = document.createElement('thead');
        inputThead.innerHTML = '<tr><th class="preview-col-pos">Pos</th><th class="preview-col-name">Nom</th><th class="preview-col-address">Adresse</th><th class="preview-col-comment">Commentaire</th></tr>';

        this.inputTableBody = document.createElement('tbody');
        this.inputTableBody.id = 'preview-input-tbody';

        inputTable.appendChild(inputThead);
        inputTable.appendChild(this.inputTableBody);

        this.inputSection.appendChild(inputHeader);
        this.inputSection.appendChild(inputTable);

        // Section OUTPUT
        this.outputSection = document.createElement('div');
        this.outputSection.className = 'preview-section';

        const outputHeader = document.createElement('div');
        outputHeader.className = 'preview-section-header';

        const outputTitleWrap = document.createElement('div');
        outputTitleWrap.className = 'preview-section-title-wrap';

        const outputDot = document.createElement('span');
        outputDot.className = 'preview-section-dot config-column-dot-output';

        const outputTitle = document.createElement('span');
        outputTitle.className = 'preview-section-title';
        outputTitle.textContent = 'OUTPUT';

        outputTitleWrap.appendChild(outputDot);
        outputTitleWrap.appendChild(outputTitle);

        this.outputRange = document.createElement('span');
        this.outputRange.className = 'preview-section-range';
        this.outputRange.textContent = '';

        outputHeader.appendChild(outputTitleWrap);
        outputHeader.appendChild(this.outputRange);

        const outputTable = document.createElement('table');
        outputTable.className = 'preview-table';

        const outputThead = document.createElement('thead');
        outputThead.innerHTML = '<tr><th class="preview-col-pos">Pos</th><th class="preview-col-name">Nom</th><th class="preview-col-address">Adresse</th><th class="preview-col-comment">Commentaire</th></tr>';

        this.outputTableBody = document.createElement('tbody');
        this.outputTableBody.id = 'preview-output-tbody';

        outputTable.appendChild(outputThead);
        outputTable.appendChild(this.outputTableBody);

        this.outputSection.appendChild(outputHeader);
        this.outputSection.appendChild(outputTable);

        // Assemblage
        this.container.appendChild(this.inputSection);
        this.container.appendChild(this.outputSection);
    }

    // ============================================================
    // Mise a jour de la configuration
    // ============================================================

    updateConfig(detail) {
        this.inputFormat = detail.inputFormat || '';
        this.outputFormat = detail.outputFormat || '';
        this.inputVars = detail.inputVars || [];
        this.outputVars = detail.outputVars || [];
        this.render();
    }

    // ============================================================
    // Rendu principal
    // ============================================================

    render() {
        this.renderSection('input', this.inputItems, this.inputTableBody, this.inputRange);
        this.renderSection('output', this.outputItems, this.outputTableBody, this.outputRange);
    }

    renderSection(type, items, tbody, rangeEl) {
        if (!tbody) return;

        tbody.innerHTML = '';

        // Cas 1 : erreur de configuration
        if (this.hasConfigError) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" class="preview-error-message">Configuration incomplete ou invalide - verifiez le panneau Config</td>';
            tbody.appendChild(row);
            if (rangeEl) rangeEl.textContent = '';
            return;
        }

        // Cas 2 : aucun item defini
        if (!items || items.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" class="preview-empty-message">-- no items defined --</td>';
            tbody.appendChild(row);
            if (rangeEl) rangeEl.textContent = '';
            return;
        }

        // Cas 3 : afficher les items avec adresses calculees
        const addresses = [];

        items.forEach((item, index) => {
            const pos = String(index + 1).padStart(2, '0');
            const address = this.computeAddress(type, index);
            addresses.push(address);

            const row = document.createElement('tr');
            row.style.animationDelay = (index * 50) + 'ms';

            const posCell = document.createElement('td');
            posCell.className = 'preview-col-pos';
            posCell.textContent = pos;

            const nameCell = document.createElement('td');
            nameCell.className = 'preview-col-name';
            nameCell.textContent = item.name || '';

            const addrCell = document.createElement('td');
            addrCell.className = 'preview-col-address';
            addrCell.textContent = address;

            const commentCell = document.createElement('td');
            commentCell.className = 'preview-col-comment';
            commentCell.textContent = item.comment || '';

            row.appendChild(posCell);
            row.appendChild(nameCell);
            row.appendChild(addrCell);
            row.appendChild(commentCell);

            tbody.appendChild(row);
        });

        // Afficher la plage d'adresses
        if (rangeEl && addresses.length > 0) {
            const first = addresses[0];
            const last = addresses[addresses.length - 1];
            rangeEl.textContent = first + ' -> ' + last;
        }
    }

    // ============================================================
    // Calcul des adresses
    // ============================================================

    computeAddress(type, index) {
        const format = type === 'input' ? this.inputFormat : this.outputFormat;

        if (!format) return '--';

        // Remplacer {x}, {y}, {z} par les valeurs calculees
        let result = format;

        // Pour la demo : x = 0, y = index, z = 0
        // Dans une implementation complete, on utiliserait les formules de GenPanel
        const x = 0;
        const y = index;
        const z = 0;

        result = result.replace(/\{x\}/g, String(x));
        result = result.replace(/\{y\}/g, String(y));
        result = result.replace(/\{z\}/g, String(z));

        return result;
    }

    // ============================================================
    // Methodes publiques
    // ============================================================

    setItems(inputs, outputs) {
        this.inputItems = inputs;
        this.outputItems = outputs;
        this.render();
    }

    setConfigError(hasError) {
        this.hasConfigError = hasError;
        this.render();
    }

    refresh() {
        this.render();
    }

    clear() {
        this.inputItems = [];
        this.outputItems = [];
        this.hasConfigError = false;
        this.render();
    }
}

let addrView = null;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        addrView = new AddrView();
        window.addrView = addrView;
    }, 250);
});
