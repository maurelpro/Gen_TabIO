// Gen_TabIO - Export_ui.js
// Panel Export : selection du format + nom de fichier + preview + telechargement

class ExportUI {
    constructor() {
        this.formatSelect = null;
        this.filenameInput = null;
        this.exportBtn = null;
        this.previewArea = null;
        this.statsEl = null;
        this.selectedFormat = 'excel';

        this.init();
    }

    init() {
        this.formatSelect = document.getElementById('export-format-select');
        this.filenameInput = document.getElementById('export-filename');
        this.exportBtn = document.getElementById('btn-export');
        this.previewArea = document.getElementById('export-preview');
        this.statsEl = document.getElementById('export-stats');

        if (this.formatSelect) {
            this.populateFormats();
            this.formatSelect.addEventListener('change', this.onFormatChange.bind(this));
        }

        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', this.onExport.bind(this));
        }

        if (window.core) {
            window.core.on('addr-views-changed', this.updatePreview.bind(this));
        }

        this.updatePreview();
    }

    populateFormats() {
        if (!this.formatSelect || !window.exportManager) return;

        var formats = window.exportManager.getAvailableFormats();

        this.formatSelect.innerHTML = '';
        formats.forEach(function(f) {
            var opt = document.createElement('option');
            opt.value = f.id;
            // Alignement : "Nom            -  (.ext)"
            var label = f.name;
            // Padding pour aligner les tirets
            while (label.length < 16) label += ' ';
            opt.textContent = label + '-  (.' + f.ext + ')';
            this.formatSelect.appendChild(opt);
        }.bind(this));
    }

    onFormatChange() {
        this.selectedFormat = this.formatSelect.value;
        this.updatePreview();
    }

    getFilename() {
        if (!this.filenameInput) return '';
        return this.filenameInput.value;
    }

    updatePreview() {
        if (!window.exportManager || !window.core) return;

        var addrViews = window.core.getPreviewData();

        if (this.statsEl) {
            var inCount  = addrViews.filter(function(v) { return v.category === 'INPUT'; }).length;
            var outCount = addrViews.filter(function(v) { return v.category === 'OUTPUT'; }).length;
            this.statsEl.textContent = 'Total: ' + addrViews.length +
                ' (INPUT: ' + inCount + ', OUTPUT: ' + outCount + ')';
        }

        if (addrViews.length === 0) {
            if (this.previewArea) {
                this.previewArea.textContent = '-- no data to export --';
            }
            if (this.exportBtn) {
                this.exportBtn.disabled = true;
                this.exportBtn.classList.add('btn-disabled');
            }
            return;
        }

        var content = window.exportManager.generate(this.selectedFormat, addrViews);

        if (this.previewArea) {
            this.previewArea.textContent = content || '-- generation error --';
        }

        if (this.exportBtn) {
            this.exportBtn.disabled = false;
            this.exportBtn.classList.remove('btn-disabled');
        }
    }

    onExport() {
        if (!window.core) return;

        var addrViews = window.core.getPreviewData();

        if (addrViews.length === 0) {
            if (window.notify) {
                window.notify({ message: 'Aucune donnee a exporter', type: 'warning', duration: 3000 });
            }
            return;
        }

        var customFilename = this.getFilename();
        var success = window.core.downloadExport(this.selectedFormat, customFilename);

        if (success && window.notify) {
            var info = window.exportManager.getFormatInfo(this.selectedFormat);
            window.notify({
                message: 'Export ' + info.name + ' termine (' + addrViews.length + ' adresses)',
                type: 'success',
                duration: 3000
            });
        } else if (window.notify) {
            window.notify({ message: 'Erreur lors de l\'export', type: 'error', duration: 3000 });
        }
    }

    onPanelActivate() {
        if (window.core && window.core.isPreviewDirty()) {
            window.core.recalculatePreviewIfNeeded();
        }
        this.updatePreview();
    }
}

var exportUI = null;
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        exportUI = new ExportUI();
        window.exportUI = exportUI;
    }, 300);
});
