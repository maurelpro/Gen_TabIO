// ============================================================
// Edit_main.js - Coordination générale
// ============================================================

const EditMain = {
    initialized: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        EditCodeMirror.init();
        EditNavigation.init();
        EditErrors.init();

        const searchBtn = document.getElementById('btn-search');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                if (EditCodeMirror.editor) {
                    EditCodeMirror.editor.execCommand('findPersistent');
                }
            });
        }

        this.observePanel();
    },

    observePanel() {
        const panel = document.getElementById('panel-edit');
        if (!panel) return;

        const observer = new MutationObserver(() => {
            if (panel.classList.contains('active')) {
                setTimeout(() => EditCodeMirror.refresh(), 100);
            }
        });

        observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => EditMain.init(), 200);
});
