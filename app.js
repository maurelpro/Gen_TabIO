// Gen_TabIO - Application JavaScript principale

class HelpWindow {
    constructor() {
        this.overlay = null; this.window = null; this.titleEl = null;
        this.contentEl = null; this.closeBtn = null; this.visible = false;
        this.callerPanel = null;
        this.init();
    }
    init() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'help-window-overlay';
        this.window = document.createElement('div');
        this.window.className = 'help-window';
        const header = document.createElement('div');
        header.className = 'help-window-header';
        const tw = document.createElement('div');
        tw.className = 'help-window-title-wrap';
        const iw = document.createElement('div');
        iw.className = 'help-window-icon';
        iw.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        this.titleEl = document.createElement('h3');
        this.titleEl.className = 'help-window-title';
        this.titleEl.textContent = 'Aide';
        tw.appendChild(iw); tw.appendChild(this.titleEl);
        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'help-window-close';
        this.closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        header.appendChild(tw); header.appendChild(this.closeBtn);
        this.contentEl = document.createElement('div');
        this.contentEl.className = 'help-window-content';
        const footer = document.createElement('div');
        footer.className = 'help-window-footer';
        const fb = document.createElement('button');
        fb.className = 'btn btn-primary'; fb.textContent = 'Compris';
        fb.addEventListener('click', () => this.hide());
        footer.appendChild(fb);
        this.window.appendChild(header); this.window.appendChild(this.contentEl);
        this.window.appendChild(footer); this.overlay.appendChild(this.window);
        document.body.appendChild(this.overlay);
        this.closeBtn.addEventListener('click', () => this.hide());
        this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.hide(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.visible) this.hide(); });
    }
    show(title, content, panelId) {
        this.titleEl.textContent = title || 'Aide';
        this.contentEl.innerHTML = content || '';
        this.callerPanel = panelId || null;
        this.overlay.classList.add('help-window-overlay-visible');
        this.window.classList.add('help-window-visible');
        this.visible = true;
        setTimeout(() => this.closeBtn.focus(), 100);
    }
    write(c) { if (this.contentEl) this.contentEl.innerHTML += c; }
    setContent(c) { if (this.contentEl) this.contentEl.innerHTML = c; }
    setTitle(t) { if (this.titleEl) this.titleEl.textContent = t; }
    hide() {
        this.overlay.classList.remove('help-window-overlay-visible');
        this.window.classList.remove('help-window-visible');
        this.visible = false; this.callerPanel = null;
    }
    isVisible() { return this.visible; }
    getCaller() { return this.callerPanel; }
}

class BasePanel {
    constructor(id, app) {
        this.id = id; this.app = app;
        this.element = document.getElementById('panel-' + id);
        this.active = false; this.initialized = false;
    }
    init() {
        if (this.initialized) return;
        this.initialized = true; this.onInit();
    }
    getDisplayName() { return this.id; }
    getHelpTitle() { return 'Aide'; }
    getHelpContent() { return '<p>Aucune aide disponible.</p>'; }
    onInit() {}
    activate(dir) {
        this.active = true; this.init();
        this.element.classList.add('active');
        if (dir) {
            this.element.classList.add('slide-in-' + dir);
            setTimeout(() => this.element.classList.remove('slide-in-' + dir), 400);
        }
        this.onActivate();
    }
    deactivate(dir) {
        this.active = false; this.element.classList.remove('active');
        if (dir) {
            this.element.classList.add('slide-out-' + dir);
            setTimeout(() => this.element.classList.remove('slide-out-' + dir), 400);
        }
        this.onDeactivate();
    }
    onActivate() {}
    onDeactivate() {}
}

class ConfigPanel extends BasePanel {
    constructor(app) { super('config', app); }
    getDisplayName() { return 'Configuration'; }
    getHelpTitle() { return 'Aide - Configuration'; }
    getHelpContent() {
        return '<div class="help-content-section"><div class="help-content-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></div><div class="help-content-text"><h4>Partie 1 : Definition de l\'adresse</h4><p>Choisissez un automate dans la liste pour definir le format d\'adressage.</p><h4>Partie 2 : Formules de generation</h4><p>Definissez les formules pour generer les adresses automatiquement.</p><p><strong>Operateurs</strong> : <code>+</code> <code>-</code> <code>*</code> <code>/</code> <code>%</code> <code>( )</code></p><p><strong>Raccourci</strong> : <code>Ctrl + Espace</code> pour l\'autocompletion</p></div></div>';
    }
    onInit() {}
    onActivate() { if (window.core) window.core.clearConfigDirty(); }
    onDeactivate() {}
}

class EditPanel extends BasePanel {
    constructor(app) { super('edit', app); }
    getDisplayName() { return 'Edit'; }
    getHelpTitle() { return 'Aide - Editeur Inputs / Outputs'; }
    getHelpContent() {
        return '<div class="help-content-section"><div class="help-content-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div><div class="help-content-text"><p>Deux zones cote a cote : INPUT (gauche) et OUTPUT (droite).</p><p>Format par ligne : <code>nom : commentaire</code></p></div></div>';
    }
    onInit() {}
    onActivate() { if (window.core) window.core.clearEditDirty(); }
    onDeactivate() {}
}

class PreviewPanel extends BasePanel {
    constructor(app) { super('preview', app); }
    getDisplayName() { return 'Apercu'; }
    getHelpTitle() { return 'Aide - Apercu'; }
    getHelpContent() {
        return '<div class="help-content-section"><div class="help-content-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></div><div class="help-content-text"><p>Visualisez le rendu final de votre table dans un tableau unique.</p><p>Le tableau se met a jour automatiquement lors du basculement vers ce panel.</p></div></div>';
    }
    onInit() {}
    onActivate() {
        if (window.previewUI && window.previewUI.onPanelActivate) {
            window.previewUI.onPanelActivate();
        }
    }
    onDeactivate() {}
}

class ExportPanel extends BasePanel {
    constructor(app) { super('export', app); }
    getDisplayName() { return 'Export'; }
    getHelpTitle() { return 'Aide - Export'; }
    getHelpContent() {
        return '<div class="help-content-section"><div class="help-content-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></div><div class="help-content-text"><p>Exportez votre table au format souhaite :</p><ul><li><strong>TIA Portal</strong> : fichier XML</li><li><strong>Step7</strong> : fichier SDF</li><li><strong>CSV</strong> : pour tableur</li><li><strong>TXT</strong> : format texte lisible</li></ul><p>Selectionnez le format, verifiez l\'apercu, puis cliquez sur Exporter.</p></div></div>';
    }
    onInit() {}
    onActivate() {
        if (window.exportUI && window.exportUI.onPanelActivate) {
            window.exportUI.onPanelActivate();
        }
    }
    onDeactivate() {}
}

class TabIOApp {
    constructor() {
        this.panelOrder = ['config', 'edit', 'preview', 'export'];
        this.panels = {};
        this.currentPanelId = 'edit';
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.helpWindow = null;
        this.core = null;
        this.inputCount = 0;
        this.outputCount = 0;
        this.errorCount = 0;
        this.configErrorCount = 0;
        this.panelNameEl = null;
        this.helpBtn = null;
        this.init();
    }

    init() {
        if (typeof Core !== 'undefined') {
            this.core = new Core();
            this.core.init();
        }

        this.helpWindow = new HelpWindow();
        this.panels['config'] = new ConfigPanel(this);
        this.panels['edit'] = new EditPanel(this);
        this.panels['preview'] = new PreviewPanel(this);
        this.panels['export'] = new ExportPanel(this);
        this.panels[this.currentPanelId].active = true;
        this.panels[this.currentPanelId].init();

        this.panelNameEl = document.getElementById('main-header-panel-name');
        this.helpBtn = document.getElementById('main-header-help-btn');

        this.updatePanelName();

        if (this.helpBtn) {
            this.helpBtn.addEventListener('click', () => this.openHelpForCurrentPanel());
        }

        this.navButtons.forEach(b => {
            b.addEventListener('click', (e) => this.switchPanel(e.currentTarget.dataset.panel));
        });

        document.addEventListener('io-update', (e) => {
            this.inputCount = e.detail.input;
            this.outputCount = e.detail.output;
            if (e.detail.errors !== undefined) this.errorCount = e.detail.errors;
            this.renderStatutPanel();
        });

        document.addEventListener('config-errors-update', (e) => {
            this.configErrorCount = e.detail.errors || 0;
            this.renderStatutPanel();
        });

        this.renderStatutPanel();
    }

    switchPanel(id) {
        if (id === this.currentPanelId || !this.panels[id]) return;

        const ci = this.panelOrder.indexOf(this.currentPanelId);
        const ti = this.panelOrder.indexOf(id);
        const dir = ti > ci ? 'forward' : 'backward';

        this.panels[this.currentPanelId].deactivate(dir);
        this.panels[id].activate(dir);

        this.navButtons.forEach(b => {
            b.classList.toggle('active', b.dataset.panel === id);
        });

        this.currentPanelId = id;
        this.updatePanelName();
    }

    updatePanelName() {
        if (this.panelNameEl && this.panels[this.currentPanelId]) {
            this.panelNameEl.textContent = this.panels[this.currentPanelId].getDisplayName();
        }
    }

    openHelpForCurrentPanel() {
        const panel = this.panels[this.currentPanelId];
        if (panel && this.helpWindow) {
            this.helpWindow.show(panel.getHelpTitle(), panel.getHelpContent(), panel.id);
        }
    }

    getTotalErrors() { return this.errorCount + this.configErrorCount; }

    renderStatutPanel() {
        const s = document.getElementById('statutPanel'); if (!s) return;
        const ie = s.querySelector('.statut-input-value');
        const oe = s.querySelector('.statut-output-value');
        const ee = s.querySelector('.statut-error-value');
        const ew = s.querySelector('.statut-item-error');
        if (ie) ie.textContent = this.inputCount;
        if (oe) oe.textContent = this.outputCount;
        const total = this.getTotalErrors();
        if (ee) ee.textContent = total;
        if (ew) { if (total > 0) ew.classList.add('has-errors'); else ew.classList.remove('has-errors'); }
    }

    setIO(i, o, e) {
        this.inputCount = i; this.outputCount = o;
        this.errorCount = e !== undefined ? e : this.errorCount;
        this.renderStatutPanel();
    }

    showHelp(t, c, p) { if (this.helpWindow) this.helpWindow.show(t, c, p); }
}

class NotificationSystem {
    constructor() { this.container = document.getElementById('notification-container'); this.maxVisible = 3; this.defaultDuration = 4000; }
    show(options) {
        const cfg = this._norm(options);
        const n = this._create(cfg);
        this.container.appendChild(n);
        void n.offsetWidth; n.classList.add('notification-visible');
        if (cfg.duration > 0) n._timeout = setTimeout(() => this._dismiss(n), cfg.duration);
        this._limit(); return n;
    }
    _norm(o) {
        if (typeof o === 'string') return { message: o, type: 'info', duration: this.defaultDuration, dismissible: true };
        return { message: o.message || '', type: o.type || 'info', duration: o.duration !== undefined ? o.duration : this.defaultDuration, dismissible: o.dismissible !== false };
    }
    _create(cfg) {
        const n = document.createElement('div');
        n.className = 'notification notification-' + cfg.type;
        n.setAttribute('role', 'alert');
        n.innerHTML = this._icon(cfg.type);
        const c = document.createElement('div'); c.className = 'notification-content';
        const m = document.createElement('span'); m.className = 'notification-message'; m.textContent = cfg.message;
        c.appendChild(m); n.appendChild(c);
        if (cfg.dismissible) {
            const b = document.createElement('button'); b.className = 'notification-close';
            b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            b.addEventListener('click', () => this._dismiss(n));
            n.appendChild(b);
        }
        return n;
    }
    _icon(t) {
        const i = {
            info: '<svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            success: '<svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            warning: '<svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            error: '<svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
        };
        return i[t] || i.info;
    }
    _dismiss(n) {
        if (n._dismissed) return; n._dismissed = true;
        if (n._timeout) clearTimeout(n._timeout);
        n.classList.remove('notification-visible'); n.classList.add('notification-hiding');
        setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 300);
    }
    _limit() { const ns = this.container.querySelectorAll('.notification'); if (ns.length > this.maxVisible) for (let i = 0; i < ns.length - this.maxVisible; i++) this._dismiss(ns[i]); }
    clearAll() { this.container.querySelectorAll('.notification').forEach(n => this._dismiss(n)); }
}

let appInstance = null; let notificationSystem = null;
function notify(o) { if (!notificationSystem) return; return notificationSystem.show(o); }
notify.info = (m, d) => notify({ message: m, type: 'info', duration: d });
notify.success = (m, d) => notify({ message: m, type: 'success', duration: d });
notify.warning = (m, d) => notify({ message: m, type: 'warning', duration: d });
notify.error = (m, d) => notify({ message: m, type: 'error', duration: d });

document.addEventListener('DOMContentLoaded', () => {
    appInstance = new TabIOApp();
    notificationSystem = new NotificationSystem();
    window.notify = notify;
    window.app = appInstance;
    if (appInstance.core) window.core = appInstance.core;
    notify({ message: 'Gen_TabIO pret', type: 'info', duration: 3000 });
});
