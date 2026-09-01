// Gen_TabIO - PLC_PRESETS.js
// Liste des automates predéfinis avec formats et formules de generation

const PLC_PRESETS = [
    // ============================================================
    // Standard Format (avec formules completes)
    // ============================================================
    {
        id: 'standard',
        name: 'Standard Format',
        inputFormat: 'I{x}.{y}',
        outputFormat: 'Q{x}.{y}',
        inputExample: 'I0.0',
        outputExample: 'Q0.0',
        formulas: {
            input: {
                start: { x: '0', y: '0', z: '' },
                other: { x: '(pos - 1) / 8', y: '(pos - 1) % 8', z: '' }
            },
            output: {
                start: { x: '0', y: '0', z: '' },
                other: { x: '(pos - 1) / 8', y: '(pos - 1) % 8', z: '' }
            }
        }
    },

    // ============================================================
    // Siemens (S7-300/400) - sans formules pour l'instant
    // ============================================================
    {
        id: 'siemens',
        name: 'Siemens (S7-300/400)',
        inputFormat: 'I{x}.{y}',
        outputFormat: 'Q{x}.{y}',
        inputExample: 'I0.0',
        outputExample: 'Q0.0',
        formulas: null
    },

    // ============================================================
    // Allen-Bradley (SLC) - sans formules pour l'instant
    // ============================================================
    {
        id: 'allen-bradley',
        name: 'Allen-Bradley (SLC)',
        inputFormat: 'I:{x}/{y}',
        outputFormat: 'O:{x}/{y}',
        inputExample: 'I:1/4',
        outputExample: 'O:2/0',
        formulas: null
    },

    // ============================================================
    // Schneider (Modicon) - sans formules pour l'instant
    // ============================================================
    {
        id: 'schneider',
        name: 'Schneider (Modicon)',
        inputFormat: '%I{x}.{y}.{z}',
        outputFormat: '%Q{x}.{y}.{z}',
        inputExample: '%I0.3.10',
        outputExample: '%Q0.4.0',
        formulas: null
    },

    // ============================================================
    // Mitsubishi (MELSEC) - sans formules pour l'instant
    // ============================================================
    {
        id: 'mitsubishi',
        name: 'Mitsubishi (MELSEC)',
        inputFormat: 'X{x}',
        outputFormat: 'Y{x}',
        inputExample: 'X0',
        outputExample: 'Y0',
        formulas: null
    },

    // ============================================================
    // Omron (CX-Programmer) - sans formules pour l'instant
    // ============================================================
    {
        id: 'omron',
        name: 'Omron (CX-Programmer)',
        inputFormat: 'CIO {x}.{y}',
        outputFormat: 'CIO {x}.{y}',
        inputExample: 'CIO 0.0',
        outputExample: 'CIO 100.0',
        formulas: null
    }
];
