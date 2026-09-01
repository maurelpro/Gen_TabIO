// ============================================================
// Edit_parser.js - Parsing et validation de la syntaxe
// ============================================================

const EditParser = {
    parse(content) {
        const lines = content.split('\n');
        const result = {
            inputs: [],
            outputs: [],
            comments: [],
            errors: [],
            currentSection: null,
            inputLine: -1,
            outputLine: -1
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            const lineNum = i + 1;

            if (trimmed === '') continue;

            if (trimmed.startsWith('#')) {
                result.comments.push({ line: lineNum, text: trimmed });
                continue;
            }

            if (trimmed === '[INPUT]') {
                result.currentSection = 'input';
                result.inputLine = lineNum;
                continue;
            }

            if (trimmed === '[OUTPUT]') {
                result.currentSection = 'output';
                result.outputLine = lineNum;
                continue;
            }

            if (trimmed.includes(':')) {
                const colonIndex = trimmed.indexOf(':');
                const name = trimmed.substring(0, colonIndex).trim();
                const comment = trimmed.substring(colonIndex + 1).trim();

                if (name === '') {
                    result.errors.push({ line: lineNum, message: 'Nom vide avant le ":"' });
                    continue;
                }

                const item = { name, comment, line: lineNum };

                if (result.currentSection === 'input') {
                    result.inputs.push(item);
                } else if (result.currentSection === 'output') {
                    result.outputs.push(item);
                } else {
                    result.errors.push({ line: lineNum, message: 'Déclaration hors section' });
                }
                continue;
            }

            result.errors.push({ line: lineNum, message: 'Format non reconnu' });
        }

        return result;
    },

    validate(content) {
        const errors = [];
        const lines = content.split('\n');
        let hasInput = false;
        let hasOutput = false;
        const names = new Set();

        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            const lineNum = i + 1;

            if (trimmed === '' || trimmed.startsWith('#')) continue;

            if (trimmed === '[INPUT]') { hasInput = true; continue; }
            if (trimmed === '[OUTPUT]') { hasOutput = true; continue; }

            if (trimmed.includes(':')) {
                const colonIndex = trimmed.indexOf(':');
                const name = trimmed.substring(0, colonIndex).trim();

                if (name === '') {
                    errors.push({ line: lineNum, message: 'Nom vide' });
                } else if (names.has(name)) {
                    errors.push({ line: lineNum, message: `Nom dupliqué : "${name}"` });
                } else {
                    names.add(name);
                }

                if (/[\[\]]/.test(name)) {
                    errors.push({ line: lineNum, message: `Crochets dans "${name}"` });
                }
            } else {
                errors.push({ line: lineNum, message: 'Format attendu : nom : commentaire' });
            }
        }

        if (!hasInput && lines.some(l => l.trim())) {
            errors.push({ line: 0, message: 'Section [INPUT] manquante' });
        }

        return errors;
    }
};
