// Gen_TabIO - AddressGenerator.js
// Generateur d'adresses : evalue TOUTES les adresses
// Phase 1 : calcul des valeurs de reference (START/END)
// Phase 2 : generation de chaque adresse avec substitution dans le format

class AddressGenerator {
    constructor() {
        this.evaluator = window.formulaEvaluator || new FormulaEvaluator();
    }

    /**
     * Genere la liste complete des AddrView avec adresses evaluees
     * @param {ConfigAddressSys} config - La configuration
     * @param {Array} inputs - Les items INPUT depuis Edit
     * @param {Array} outputs - Les items OUTPUT depuis Edit
     * @returns {Array<AddrView>} - Liste de AddrView avec adresses calculees
     */
    generate(config, inputs, outputs) {
        const views = [];

        if (!config) return views;

        const inputItems = inputs || [];
        const outputItems = outputs || [];

        // ============================================================
        // PHASE 1 : Calcul des valeurs de reference
        // ============================================================
        // Ces valeurs sont utilisees dans les formules comme variables globales
        // INPUT_ADDRESS_START_X = valeur de x pour le premier INPUT (pos=1)
        // INPUT_ADDRESS_END_X = valeur de x pour le dernier INPUT (pos=N)
        // Idem pour Y, Z et OUTPUT

        const referenceValues = this.calculateReferenceValues(config, inputItems, outputItems);

        // ============================================================
        // PHASE 2 : Generation des adresses INPUT
        // ============================================================
        const inputViews = this.generateForType(
            config,
            inputItems,
            'INPUT',
            config.inputFormat,
            config.input,
            referenceValues
        );

        // ============================================================
        // PHASE 3 : Generation des adresses OUTPUT
        // ============================================================
        const outputViews = this.generateForType(
            config,
            outputItems,
            'OUTPUT',
            config.outputFormat,
            config.output,
            referenceValues
        );

        // ============================================================
        // PHASE 4 : Fusion avec position sequentielle globale
        // ============================================================
        let globalPos = 1;

        inputViews.forEach(v => {
            v.position = globalPos++;
            views.push(v);
        });

        outputViews.forEach(v => {
            v.position = globalPos++;
            views.push(v);
        });

        return views;
    }

    /**
     * PHASE 1 : Calcule les valeurs de reference START et END
     * pour INPUT et OUTPUT
     */
    calculateReferenceValues(config, inputItems, outputItems) {
        const refs = {
            INPUT_ADDRESS_START_X: 0,
            INPUT_ADDRESS_START_Y: 0,
            INPUT_ADDRESS_START_Z: 0,
            INPUT_ADDRESS_END_X: 0,
            INPUT_ADDRESS_END_Y: 0,
            INPUT_ADDRESS_END_Z: 0,
            OUTPUT_ADDRESS_START_X: 0,
            OUTPUT_ADDRESS_START_Y: 0,
            OUTPUT_ADDRESS_START_Z: 0,
            OUTPUT_ADDRESS_END_X: 0,
            OUTPUT_ADDRESS_END_Y: 0,
            OUTPUT_ADDRESS_END_Z: 0,
            INPUT_COUNT: inputItems.length,
            OUTPUT_COUNT: outputItems.length
        };

        // Calcul pour INPUT START (pos = 1)
        if (inputItems.length > 0 && config.input) {
            const startValues = this.evaluateAddressConfig(
                config.input.startAddress,
                { pos: 1, INPUT_COUNT: inputItems.length, OUTPUT_COUNT: outputItems.length }
            );
            refs.INPUT_ADDRESS_START_X = startValues.x;
            refs.INPUT_ADDRESS_START_Y = startValues.y;
            refs.INPUT_ADDRESS_START_Z = startValues.z;

            // Calcul pour INPUT END (pos = dernier)
            const endPos = inputItems.length;
            const endValues = this.evaluateAddressConfig(
                config.input.otherAddress,
                { pos: endPos, INPUT_COUNT: inputItems.length, OUTPUT_COUNT: outputItems.length }
            );
            refs.INPUT_ADDRESS_END_X = endValues.x;
            refs.INPUT_ADDRESS_END_Y = endValues.y;
            refs.INPUT_ADDRESS_END_Z = endValues.z;
        }

        // Calcul pour OUTPUT START (pos = 1)
        if (outputItems.length > 0 && config.output) {
            const startValues = this.evaluateAddressConfig(
                config.output.startAddress,
                { pos: 1, INPUT_COUNT: inputItems.length, OUTPUT_COUNT: outputItems.length }
            );
            refs.OUTPUT_ADDRESS_START_X = startValues.x;
            refs.OUTPUT_ADDRESS_START_Y = startValues.y;
            refs.OUTPUT_ADDRESS_START_Z = startValues.z;

            // Calcul pour OUTPUT END (pos = dernier)
            const endPos = outputItems.length;
            const endValues = this.evaluateAddressConfig(
                config.output.otherAddress,
                { pos: endPos, INPUT_COUNT: inputItems.length, OUTPUT_COUNT: outputItems.length }
            );
            refs.OUTPUT_ADDRESS_END_X = endValues.x;
            refs.OUTPUT_ADDRESS_END_Y = endValues.y;
            refs.OUTPUT_ADDRESS_END_Z = endValues.z;
        }

        return refs;
    }

    /**
     * Evalue les formules x, y, z d'une configuration d'adresse
     * @returns {{x: number, y: number, z: number}}
     */
    evaluateAddressConfig(addrConfig, baseContext) {
        const values = { x: 0, y: 0, z: 0 };

        if (!addrConfig) return values;

        const formulas = addrConfig._formulas || {};

        // Evaluer x
        if (formulas.x !== undefined && formulas.x !== null && formulas.x !== '') {
            const result = this.evaluator.evaluate(formulas.x, baseContext);
            if (result !== null) {
                values.x = Math.floor(result);
            }
        } else if (addrConfig.hasX()) {
            values.x = addrConfig.x;
        }

        // Evaluer y
        if (formulas.y !== undefined && formulas.y !== null && formulas.y !== '') {
            const result = this.evaluator.evaluate(formulas.y, baseContext);
            if (result !== null) {
                values.y = Math.floor(result);
            }
        } else if (addrConfig.hasY()) {
            values.y = addrConfig.y;
        }

        // Evaluer z
        if (formulas.z !== undefined && formulas.z !== null && formulas.z !== '') {
            const result = this.evaluator.evaluate(formulas.z, baseContext);
            if (result !== null) {
                values.z = Math.floor(result);
            }
        } else if (addrConfig.hasZ()) {
            values.z = addrConfig.z;
        }

        return values;
    }

    /**
     * PHASE 2/3 : Genere les AddrView pour un type donne
     * Chaque adresse est COMPLETEMENT evaluee et substituee dans le format
     */
    generateForType(config, items, category, format, typeConfig, referenceValues) {
        const views = [];

        if (!format || format.trim() === '') return views;
        if (!items || items.length === 0) return views;
        if (!typeConfig) return views;

        const startAddr = typeConfig.startAddress;
        const otherAddr = typeConfig.otherAddress;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const pos = i + 1; // pos commence a 1

            // Construire le contexte complet pour cet item
            const context = Object.assign({}, referenceValues, {
                pos: pos,
                INPUT_COUNT: referenceValues.INPUT_COUNT,
                OUTPUT_COUNT: referenceValues.OUTPUT_COUNT
            });

            // Choisir startAddr pour pos=1, otherAddr pour pos>1
            const addrConfig = (i === 0) ? startAddr : otherAddr;

            // Evaluer x, y, z avec le contexte complet
            const values = this.evaluateAddressConfig(addrConfig, context);

            // Substituer dans le format pour obtenir l'adresse finale
            const address = this.substituteFormat(format, values);

            views.push(new AddrView({
                position: 0, // sera renumerote globalement
                category: category,
                name: item.name || '',
                address: address,
                comment: item.comment || ''
            }));
        }

        return views;
    }

    /**
     * Substitue les valeurs calculees dans le format
     * Exemple : format='I{x}.{y}', values={x:0, y:3} => 'I0.3'
     */
    substituteFormat(format, values) {
        let result = format;

        if (values.x !== null && values.x !== undefined) {
            result = result.replace(/\{x\}/g, String(values.x));
        }
        if (values.y !== null && values.y !== undefined) {
            result = result.replace(/\{y\}/g, String(values.y));
        }
        if (values.z !== null && values.z !== undefined) {
            result = result.replace(/\{z\}/g, String(values.z));
        }

        return result;
    }

    /**
     * Verifie si une formule contient des variables de reference
     * @param {string} formula - La formule a verifier
     * @returns {Array<string>} - Liste des variables de reference trouvees
     */
    findReferenceVariables(formula) {
        if (!formula) return [];

        const refVars = [
            'INPUT_ADDRESS_START_X', 'INPUT_ADDRESS_START_Y', 'INPUT_ADDRESS_START_Z',
            'INPUT_ADDRESS_END_X', 'INPUT_ADDRESS_END_Y', 'INPUT_ADDRESS_END_Z',
            'OUTPUT_ADDRESS_START_X', 'OUTPUT_ADDRESS_START_Y', 'OUTPUT_ADDRESS_START_Z',
            'OUTPUT_ADDRESS_END_X', 'OUTPUT_ADDRESS_END_Y', 'OUTPUT_ADDRESS_END_Z',
            'INPUT_COUNT', 'OUTPUT_COUNT'
        ];

        const found = [];
        refVars.forEach(v => {
            if (formula.includes(v)) {
                found.push(v);
            }
        });

        return found;
    }

    /**
     * Verifie si une formule utilise 'pos'
     * @param {string} formula - La formule a verifier
     * @returns {boolean}
     */
    usesPos(formula) {
        if (!formula) return false;
        // Verifier que 'pos' est un mot complet (pas une sous-chaine)
        const regex = /\bpos\b/;
        return regex.test(formula);
    }

    /**
     * Valide une formule : verifie que toutes les variables sont connues
     * @param {string} formula - La formule a valider
     * @returns {{valid: boolean, unknownVars: Array<string>}}
     */
    validateFormula(formula) {
        if (!formula || formula.trim() === '') {
            return { valid: true, unknownVars: [] };
        }

        const knownVars = new Set([
            'pos',
            'INPUT_COUNT', 'OUTPUT_COUNT',
            'INPUT_ADDRESS_START_X', 'INPUT_ADDRESS_START_Y', 'INPUT_ADDRESS_START_Z',
            'INPUT_ADDRESS_END_X', 'INPUT_ADDRESS_END_Y', 'INPUT_ADDRESS_END_Z',
            'OUTPUT_ADDRESS_START_X', 'OUTPUT_ADDRESS_START_Y', 'OUTPUT_ADDRESS_START_Z',
            'OUTPUT_ADDRESS_END_X', 'OUTPUT_ADDRESS_END_Y', 'OUTPUT_ADDRESS_END_Z'
        ]);

        // Extraire les identifiants de la formule
        const identifiers = formula.match(/[a-zA-Z_][a-zA-Z_0-9]*/g) || [];
        const unknownVars = [];

        identifiers.forEach(id => {
            if (!knownVars.has(id)) {
                unknownVars.push(id);
            }
        });

        return {
            valid: unknownVars.length === 0,
            unknownVars: unknownVars
        };
    }
}

// Instance globale partagee
window.addressGenerator = new AddressGenerator();
