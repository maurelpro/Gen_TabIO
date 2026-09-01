// ============================================================
// Edit_errors.js - Zone d'erreurs fixe, collapse/expand
// ============================================================

const EditErrors = {
    errors: [],
    isCollapsed: false,

    init() {
        const header = document.getElementById('errors-header');
        const toggleBtn = document.getElementById('errors-toggle-btn');

        if (header) {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.edit-errors-toggle-btn')) return;
                this.toggleCollapse();
            });
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCollapse();
            });
        }

        this.render();
    },

    update(errors) {
        this.errors = errors;
        this.render();
    },

    render() {
        const zone = document.getElementById('errors-zone');
        const iconWrap = document.getElementById('errors-icon-wrap');
        const count = document.getElementById('errors-count');
        const content = document.getElementById('errors-content');

        if (!zone) return;

        const n = this.errors.length;
        zone.classList.remove('has-errors', 'no-errors');

        if (n > 0) {
            zone.classList.add('has-errors');
            count.textContent = `· ${n}`;
            if (iconWrap) {
                iconWrap.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
            }
        } else {
            zone.classList.add('no-errors');
            count.textContent = '';
            if (iconWrap) {
                iconWrap.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
            }
        }

        if (content) {
            if (n === 0) {
                content.innerHTML = '<div class="edit-errors-empty">Aucune erreur</div>';
            } else {
                content.innerHTML = this.errors.map(err =>
                    `<div class="edit-error-item"><span class="edit-error-line-num">Ligne ${err.line}</span><span class="edit-error-message">${err.message}</span></div>`
                ).join('');
            }
        }
    },

    toggleCollapse() {
        const zone = document.getElementById('errors-zone');
        const toggleBtn = document.getElementById('errors-toggle-btn');
        if (!zone) return;

        this.isCollapsed = !this.isCollapsed;
        zone.classList.toggle('collapsed', this.isCollapsed);

        if (toggleBtn) {
            const ic = toggleBtn.querySelector('.icon-collapse');
            const ie = toggleBtn.querySelector('.icon-expand');
            if (ic && ie) {
                ic.style.display = this.isCollapsed ? 'none' : 'block';
                ie.style.display = this.isCollapsed ? 'block' : 'none';
            }
        }

        setTimeout(() => EditCodeMirror.refresh(), 300);
    }
};
