// Gen_TabIO - Preview_ui.js
// Panel Apercu : tableau unique avec INPUT et OUTPUT
// Se met a jour uniquement lors du basculement vers ce panel
// Utilise le cache du Core

const ANIMATION_DELAY = 50;

class PreviewUI {
    constructor() {
        this.tableBody = null;
        this.rangeDisplay = null;
        this.emptyMsg = null;
        this.errorMsg = null;
        this.lastRenderedViews = null;

        this.init();
    }

    init() {
        this.tableBody = document.getElementById('preview-table-body');
        this.rangeDisplay = document.getElementById('preview-range');
        this.emptyMsg = document.getElementById('preview-empty');
        this.errorMsg = document.getElementById('preview-error');

        // Ecouter les changements d'AddrViews
        if (window.core) {
            window.core.on('addr-views-changed', (views) => {
                this.renderAddrViews(views);
            });
        }

        // Ne pas faire de rendu initial - attendre le basculement
    }

    /**
     * Appele par TabIOApp lors du basculement vers ce panel
     * Verifie si le Core est dirty et declenche un recalcul si necessaire
     */
    onPanelActivate() {
        if (!window.core) return;

        // Si dirty, forcer le recalcul
        if (window.core.isPreviewDirty()) {
            window.core.recalculatePreviewIfNeeded();
        } else {
            // Sinon, afficher le cache
            const cachedViews = window.core.getPreviewData();
            this.renderAddrViews(cachedViews);
        }
    }

    renderAddrViews(views) {
        if (!this.tableBody) return;

        // Eviter de re-rendre si rien n'a change
        if (this.lastRenderedViews === views && views && views.length > 0) {
            return;
        }
        this.lastRenderedViews = views;

        const hasConfigError = this.hasConfigError();

        if (hasConfigError && (!views || views.length === 0)) {
            this.tableBody.innerHTML = '';
            if (this.emptyMsg) this.emptyMsg.style.display = 'none';
            if (this.errorMsg) {
                this.errorMsg.textContent = '— configuration incomplete —';
                this.errorMsg.style.display = 'flex';
            }
            if (this.rangeDisplay) this.rangeDisplay.textContent = '';
            return;
        }

        if (!views || views.length === 0) {
            this.tableBody.innerHTML = '';
            if (this.emptyMsg) {
                this.emptyMsg.textContent = '— no items defined —';
                this.emptyMsg.style.display = 'flex';
            }
            if (this.errorMsg) this.errorMsg.style.display = 'none';
            if (this.rangeDisplay) this.rangeDisplay.textContent = '';
            return;
        }

        if (this.emptyMsg) this.emptyMsg.style.display = 'none';
        if (this.errorMsg) this.errorMsg.style.display = 'none';

        if (this.rangeDisplay && views.length > 0) {
            const firstAddr = views[0].address;
            const lastAddr = views[views.length - 1].address;
            this.rangeDisplay.textContent = firstAddr + ' → ' + lastAddr;
        }

        this.tableBody.innerHTML = '';
        views.forEach((view, index) => {
            const row = this.createRow(view, view.position);
            row.style.opacity = '0';
            row.style.transform = 'translateY(10px)';
            this.tableBody.appendChild(row);

            setTimeout(() => {
                row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, index * ANIMATION_DELAY);
        });
    }

    createRow(view, globalPos) {
        const row = document.createElement('div');
        row.className = 'preview-row';

        const posStr = String(globalPos).padStart(2, '0');
        const categoryClass = view.category === 'INPUT' ? 'input' : 'output';

        row.innerHTML = `
            <div class="preview-cell preview-cell-pos">${posStr}</div>
            <div class="preview-cell preview-cell-category">
                <span class="preview-category-badge preview-category-${categoryClass}">${view.category}</span>
            </div>
            <div class="preview-cell preview-cell-name">${this.esc(view.name)}</div>
            <div class="preview-cell preview-cell-address">${this.esc(view.address)}</div>
            <div class="preview-cell preview-cell-comment">${this.esc(view.comment)}</div>
        `;

        return row;
    }

    hasConfigError() {
        if (!window.core) return true;
        const config = window.core.getConfigAddressSys();
        if (!config) return true;
        return (!config.inputFormat || config.inputFormat.trim() === '') &&
               (!config.outputFormat || config.outputFormat.trim() === '');
    }

    esc(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

let previewUI = null;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        previewUI = new PreviewUI();
        window.previewUI = previewUI;
    }, 250);
});
