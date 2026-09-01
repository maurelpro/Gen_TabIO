// Gen_TabIO - FormulaEvaluator.js
// Evaluateur d'expressions mathematiques pour les formules de generation
// Supporte : +, -, *, /, %, parentheses, variables, nombres

class FormulaEvaluator {
    constructor() {
        this.pos = 0;
        this.tokens = [];
        this.context = {};
    }

    /**
     * Evalue une formule avec un contexte de variables
     * @param {string} formula - La formule a evaluer (ex: "(pos - 1) / 8")
     * @param {object} context - Les variables disponibles (ex: { pos: 1, INPUT_COUNT: 10 })
     * @returns {number|null} - Le resultat ou null en cas d'erreur
     */
    evaluate(formula, context) {
        if (!formula || formula.trim() === '') return null;

        this.context = context || {};
        try {
            this.tokens = this.tokenize(formula);
            this.pos = 0;
            const result = this.parseExpression();

            if (this.pos < this.tokens.length) {
                return null; // Tokens restants = erreur
            }

            if (!isFinite(result)) return null;
            return result;
        } catch (e) {
            return null;
        }
    }

    /**
     * Tokenise la formule en une liste de tokens
     */
    tokenize(formula) {
        const tokens = [];
        let i = 0;

        while (i < formula.length) {
            const ch = formula[i];

            if (ch === ' ' || ch === '\t') {
                i++;
                continue;
            }

            if ('+-*/%'.includes(ch)) {
                tokens.push({ type: 'op', value: ch });
                i++;
            } else if ('()'.includes(ch)) {
                tokens.push({ type: 'paren', value: ch });
                i++;
            } else if (/\d/.test(ch) || (ch === '.' && i + 1 < formula.length && /\d/.test(formula[i + 1]))) {
                let num = '';
                while (i < formula.length && (/\d/.test(formula[i]) || formula[i] === '.')) {
                    num += formula[i];
                    i++;
                }
                tokens.push({ type: 'num', value: parseFloat(num) });
            } else if (/[a-zA-Z_]/.test(ch)) {
                let word = '';
                while (i < formula.length && /[a-zA-Z_0-9]/.test(formula[i])) {
                    word += formula[i];
                    i++;
                }
                tokens.push({ type: 'var', value: word });
            } else {
                throw new Error('Unexpected character: ' + ch);
            }
        }

        return tokens;
    }

    /**
     * Parse une expression (gestion de + et -)
     */
    parseExpression() {
        let result = this.parseTerm();

        while (this.pos < this.tokens.length &&
               this.tokens[this.pos].type === 'op' &&
               (this.tokens[this.pos].value === '+' || this.tokens[this.pos].value === '-')) {
            const op = this.tokens[this.pos].value;
            this.pos++;
            const right = this.parseTerm();
            if (op === '+') result += right;
            else result -= right;
        }

        return result;
    }

    /**
     * Parse un terme (gestion de *, /, %)
     */
    parseTerm() {
        let result = this.parseFactor();

        while (this.pos < this.tokens.length &&
               this.tokens[this.pos].type === 'op' &&
               (this.tokens[this.pos].value === '*' ||
                this.tokens[this.pos].value === '/' ||
                this.tokens[this.pos].value === '%')) {
            const op = this.tokens[this.pos].value;
            this.pos++;
            const right = this.parseFactor();
            if (op === '*') result *= right;
            else if (op === '/') {
                if (right === 0) throw new Error('Division by zero');
                result /= right;
            } else {
                if (right === 0) throw new Error('Modulo by zero');
                result %= right;
            }
        }

        return result;
    }

    /**
     * Parse un facteur (nombre, variable, expression entre parentheses, signe unaire)
     */
    parseFactor() {
        // Gestion du signe unaire
        if (this.pos < this.tokens.length &&
            this.tokens[this.pos].type === 'op' &&
            (this.tokens[this.pos].value === '+' || this.tokens[this.pos].value === '-')) {
            const op = this.tokens[this.pos].value;
            this.pos++;
            const factor = this.parseFactor();
            return op === '-' ? -factor : factor;
        }

        if (this.pos >= this.tokens.length) {
            throw new Error('Unexpected end of expression');
        }

        const token = this.tokens[this.pos];

        // Parentheses
        if (token.type === 'paren' && token.value === '(') {
            this.pos++;
            const result = this.parseExpression();
            if (this.pos >= this.tokens.length ||
                this.tokens[this.pos].type !== 'paren' ||
                this.tokens[this.pos].value !== ')') {
                throw new Error('Missing closing parenthesis');
            }
            this.pos++;
            return result;
        }

        // Nombre
        if (token.type === 'num') {
            this.pos++;
            return token.value;
        }

        // Variable
        if (token.type === 'var') {
            this.pos++;
            const varName = token.value;
            if (!(varName in this.context)) {
                throw new Error('Unknown variable: ' + varName);
            }
            const value = this.context[varName];
            if (typeof value !== 'number' || !isFinite(value)) {
                throw new Error('Invalid value for variable: ' + varName);
            }
            return value;
        }

        throw new Error('Unexpected token: ' + JSON.stringify(token));
    }
}

// Instance globale partagee
window.formulaEvaluator = new FormulaEvaluator();
