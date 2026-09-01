// Gen_TabIO - Core/core.js
// Noyau du systeme
// AddrView : getters/setters + toJSON/toString
// Les methodes de conversion sont dans FormatGenerators.js

// ============================================================
// FormatAddress
// ============================================================

class FormatAddress {
    constructor(init, formulas) {
        init = init || {};
        this.x = init.x !== undefined ? init.x : null;
        this.y = init.y !== undefined ? init.y : null;
        this.z = init.z !== undefined ? init.z : null;
        this._formulas = formulas || {};
    }

    hasX() { return this.x !== null && this.x !== undefined; }
    hasY() { return this.y !== null && this.y !== undefined; }
    hasZ() { return this.z !== null && this.z !== undefined; }

    setFormulas(f) { this._formulas = f || {}; }
    getFormulas() { return this._formulas; }

    toJSON() {
        return { x: this.x, y: this.y, z: this.z, formulas: this._formulas };
    }

    toString() {
        var parts = [];
        if (this.hasX()) parts.push('x=' + this.x);
        if (this.hasY()) parts.push('y=' + this.y);
        if (this.hasZ()) parts.push('z=' + this.z);
        return parts.length > 0 ? parts.join(', ') : '(empty)';
    }
}


// ============================================================
// ConfigAddressSys
// ============================================================

class ConfigAddressSys {
    constructor(cfg) {
        cfg = cfg || {};
        this.inputFormat = cfg.inputFormat || '';
        this.outputFormat = cfg.outputFormat || '';

        var inp = cfg.input || {};
        var out = cfg.output || {};

        this.input = {
            startAddress: inp.startAddress instanceof FormatAddress
                ? inp.startAddress
                : new FormatAddress(inp.startAddress, inp.startFormulas),
            otherAddress: inp.otherAddress instanceof FormatAddress
                ? inp.otherAddress
                : new FormatAddress(inp.otherAddress, inp.otherFormulas)
        };

        this.output = {
            startAddress: out.startAddress instanceof FormatAddress
                ? out.startAddress
                : new FormatAddress(out.startAddress, out.startFormulas),
            otherAddress: out.otherAddress instanceof FormatAddress
                ? out.otherAddress
                : new FormatAddress(out.otherAddress, out.otherFormulas)
        };
    }

    getInputFormat() { return this.inputFormat; }
    getOutputFormat() { return this.outputFormat; }

    setFormats(inputFmt, outputFmt) {
        this.inputFormat = inputFmt;
        this.outputFormat = outputFmt;
    }

    toJSON() {
        return {
            inputFormat: this.inputFormat,
            outputFormat: this.outputFormat,
            input: {
                startAddress: this.input.startAddress.toJSON(),
                otherAddress: this.input.otherAddress.toJSON()
            },
            output: {
                startAddress: this.output.startAddress.toJSON(),
                otherAddress: this.output.otherAddress.toJSON()
            }
        };
    }

    toString() {
        return '[ConfigAddressSys] in=' + this.inputFormat + ' out=' + this.outputFormat;
    }
}


// ============================================================
// AddrView
// ============================================================

class AddrView {
    constructor(cfg) {
        cfg = cfg || {};
        this.position = cfg.position || 0;
        this.category = cfg.category || '';
        this.name     = cfg.name || '';
        this.address  = cfg.address || '';
        this.comment  = cfg.comment || '';
    }

    // Getters
    getPosition() { return this.position; }
    getCategory() { return this.category; }
    getName()     { return this.name; }
    getAddress()  { return this.address; }
    getComment()  { return this.comment; }

    // Setters
    setPosition(v) { this.position = v; }
    setCategory(v) { this.category = v; }
    setName(v)     { this.name = v; }
    setAddress(v)  { this.address = v; }
    setComment(v)  { this.comment = v; }

    toJSON() {
        return {
            position: this.position,
            category: this.category,
            name: this.name,
            address: this.address,
            comment: this.comment
        };
    }

    toString() {
        return '[AddrView] #' + this.position + ' ' + this.category + ' ' + this.name + ' = ' + this.address;
    }
}


// ============================================================
// Core
// ============================================================

class Core {
    constructor() {
        this.version = '1.7.0';
        this.name = 'Gen_TabIO Core';

        this.data = {
            inputs: [],
            outputs: [],
            errors: [],
            config: {}
        };

        this.configAddressSys = null;
        this.previewCache = [];

        this.dirtyFlags = {
            config: false,
            edit: false,
            preview: false
        };

        this.listeners = {};
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;

        this.configAddressSys = new ConfigAddressSys({
            inputFormat: '',
            outputFormat: '',
            input: {
                startAddress: { x: 0, y: 0, z: null },
                otherAddress: { x: null, y: null, z: null }
            },
            output: {
                startAddress: { x: 0, y: 0, z: null },
                otherAddress: { x: null, y: null, z: null }
            }
        });

        this.onInit();
    }

    onInit() {}

    // Dirty flags
    markConfigDirty()  { this.dirtyFlags.config = true; this.dirtyFlags.preview = true; this.emit('config-dirty', true); }
    markEditDirty()    { this.dirtyFlags.edit = true; this.dirtyFlags.preview = true; this.emit('edit-dirty', true); }
    clearConfigDirty() { this.dirtyFlags.config = false; this.emit('config-dirty', false); }
    clearEditDirty()   { this.dirtyFlags.edit = false; this.emit('edit-dirty', false); }
    clearPreviewDirty(){ this.dirtyFlags.preview = false; this.emit('preview-dirty', false); }
    isPreviewDirty()   { return this.dirtyFlags.preview; }
    isConfigDirty()    { return this.dirtyFlags.config; }
    isEditDirty()      { return this.dirtyFlags.edit; }

    // Config
    getConfigAddressSys() { return this.configAddressSys; }

    setConfigAddressSys(config) {
        this.configAddressSys = config;
        this.markConfigDirty();
        this.emit('config-address-changed', config);
    }

    updateConfigFormats(inputFmt, outputFmt) {
        if (this.configAddressSys) {
            this.configAddressSys.setFormats(inputFmt, outputFmt);
            this.markConfigDirty();
            this.emit('config-address-changed', this.configAddressSys);
        }
    }

    // Data
    setInputs(v)  { this.data.inputs = v || []; this.markEditDirty(); this.emit('inputs-changed', this.data.inputs); }
    setOutputs(v) { this.data.outputs = v || []; this.markEditDirty(); this.emit('outputs-changed', this.data.outputs); }
    setErrors(v)  { this.data.errors = v || []; this.emit('errors-changed', this.data.errors); }
    getInputs()   { return this.data.inputs; }
    getOutputs()  { return this.data.outputs; }
    getErrors()   { return this.data.errors; }
    setConfig(k, v) { this.data.config[k] = v; this.emit('config-changed', { key: k, value: v }); }
    getConfig(k)  { return this.data.config[k]; }

    // Preview
    getPreviewData() { return this.previewCache; }

    recalculatePreviewIfNeeded() {
        if (!this.dirtyFlags.preview) return false;

        var generator = window.addressGenerator;
        if (!generator) {
            console.warn('[Core] AddressGenerator non disponible');
            return false;
        }

        try {
            this.previewCache = generator.generate(
                this.configAddressSys,
                this.data.inputs,
                this.data.outputs
            );
        } catch (e) {
            console.error('[Core] Erreur calcul Preview:', e);
            this.previewCache = [];
        }

        this.clearPreviewDirty();
        this.emit('addr-views-changed', this.previewCache);
        return true;
    }

    forceRecalculatePreview() {
        this.dirtyFlags.preview = true;
        return this.recalculatePreviewIfNeeded();
    }

    // Export
    generateExport(formatId) {
        var mgr = window.exportManager;
        if (!mgr) { console.warn('[Core] ExportManager non disponible'); return null; }
        return mgr.generate(formatId, this.previewCache);
    }

    downloadExport(formatId, customFilename) {
        var mgr = window.exportManager;
        if (!mgr) return false;

        var content = this.generateExport(formatId);
        if (!content) return false;

        var info = mgr.getFormatInfo(formatId);
        var filename;

        if (customFilename && customFilename.trim() !== '') {
            filename = customFilename.trim();
            if (filename.toLowerCase().indexOf('.' + info.ext.toLowerCase()) === -1) {
                filename += '.' + info.ext;
            }
        } else {
            filename = 'gen_tabio_export.' + info.ext;
        }

        mgr.download(content, filename);
        return true;
    }

    // Events
    on(evt, cb)  { if (!this.listeners[evt]) this.listeners[evt] = []; this.listeners[evt].push(cb); }
    off(evt, cb) { if (!this.listeners[evt]) return; this.listeners[evt] = this.listeners[evt].filter(function(c) { return c !== cb; }); }
    emit(evt, p) { if (!this.listeners[evt]) return; this.listeners[evt].forEach(function(cb) { cb(p); }); }

    // Utils
    getVersion() { return this.version; }
    getName()    { return this.name; }
    isInitialized() { return this.initialized; }
}
