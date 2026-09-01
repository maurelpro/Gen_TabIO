// Gen_TabIO - Core/FormatGenerators.js
// Convertisseurs de format pour AddrView
// Fichier dedie : toCSV(), toTXT(), toTIA_XML(), toStep7_SDF()

(function() {

    // ============================================================
    // toCSV : format Excel avec separateur ';'
    // ============================================================

    AddrView.prototype.toCSV = function() {
        var escapeCSV = function(val) {
            var str = String(val || '');
            if (str.indexOf(';') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };

        return [
            this.position,
            this.category,
            escapeCSV(this.name),
            this.address,
            escapeCSV(this.comment)
        ].join(';');
    };


    // ============================================================
    // toTXT : format texte lisible
    // ============================================================

    AddrView.prototype.toTXT = function() {
        var pos     = padRight(String(this.position), 3, '0', true);
        var cat     = padRight(this.category, 6);
        var name    = padRight(this.name, 20);
        var addr    = padRight(this.address, 15);
        var comment = this.comment || '';

        return pos + ' | ' + cat + ' | ' + name + ' | ' + addr + ' | ' + comment;
    };


    // ============================================================
    // toTIA_XML : format TIA Portal conforme
    //
    // Sortie par ligne :
    //   <Tag type='Bool' hmiVisible='True' hmiWriteable='True'
    //        hmiAccessible='True' remark='commentaire' addr='%I0.0'>nom</Tag>
    //
    // Adresse : %I pour INPUT, %Q pour OUTPUT
    // ============================================================

    AddrView.prototype.toTIA_XML = function() {
        var tiaAddr = this.buildTIA_Address(this.address, this.category);
        var xmlName = escapeXML(this.name);
        var xmlComment = escapeXML(this.comment || '');

        return "  <Tag type='Bool'" +
               " hmiVisible='True'" +
               " hmiWriteable='True'" +
               " hmiAccessible='True'" +
               " remark='" + xmlComment + "'" +
               " addr='" + tiaAddr + "'>" +
               xmlName +
               "</Tag>";
    };

    /**
     * Construit l'adresse TIA Portal : %I0.0 ou %Q0.0
     * - INPUT  : I ou E -> %I
     * - OUTPUT : Q ou A -> %Q
     */
    AddrView.prototype.buildTIA_Address = function(address, category) {
        var addr = String(address || '');

        // Retirer un eventuel % existant
        addr = addr.replace(/^%/, '');

        // Retirer un eventuel espace apres la lettre
        addr = addr.replace(/^([IEQA])\s+/i, '$1');

        // Convertir E -> I, A -> Q
        if (/^E/i.test(addr)) {
            addr = 'I' + addr.substring(1);
        } else if (/^A/i.test(addr)) {
            addr = 'Q' + addr.substring(1);
        }

        // Forcer le bon prefixe selon la categorie
        if (category === 'INPUT' && !/^I/i.test(addr)) {
            addr = 'I' + addr;
        } else if (category === 'OUTPUT' && !/^Q/i.test(addr)) {
            addr = 'Q' + addr;
        }

        return '%' + addr;
    };


    // ============================================================
    // toStep7_SDF : format Step7 Manager conforme
    //
    // Sortie par ligne :
    //   "nom                      ","E 0.0       ","BOOL      ","commentaire                  "
    //
    // - Nom tel quel avec padding (pas de __ ajoute)
    // - Adresse : E pour INPUT, A pour OUTPUT
    // - Type : BOOL
    // ============================================================

    AddrView.prototype.toStep7_SDF = function() {
        var nameWidth    = 25;
        var addrWidth    = 12;
        var typeWidth    = 10;
        var commentWidth = 80;

        var sdfName    = padRight(this.name, nameWidth);
        var sdfAddr    = padRight(this.buildStep7_Address(this.address, this.category), addrWidth);
        var sdfType    = padRight('BOOL', typeWidth);
        var sdfComment = padRight(this.comment || '', commentWidth);

        return '"' + sdfName + '","' + sdfAddr + '","' + sdfType + '","' + sdfComment + '"';
    };

    /**
     * Construit l'adresse Step7 : E 0.0 ou A 20.0
     * - INPUT  : I -> E
     * - OUTPUT : Q -> A
     * - Espace apres la lettre
     */
    AddrView.prototype.buildStep7_Address = function(address, category) {
        var addr = String(address || '');

        // Retirer un eventuel %
        addr = addr.replace(/^%/, '');

        // Convertir I -> E, Q -> A
        if (/^I/i.test(addr)) {
            addr = 'E' + addr.substring(1);
        } else if (/^Q/i.test(addr)) {
            addr = 'A' + addr.substring(1);
        }

        // Forcer le bon prefixe selon la categorie
        if (category === 'INPUT' && !/^E/i.test(addr)) {
            addr = 'E' + addr;
        } else if (category === 'OUTPUT' && !/^A/i.test(addr)) {
            addr = 'A' + addr;
        }

        // Ajouter un espace apres la lettre si absent
        if (/^[EA]\d/.test(addr)) {
            addr = addr[0] + ' ' + addr.substring(1);
        }

        return addr;
    };


    // ============================================================
    // Fonctions utilitaires partagees
    // ============================================================

    /**
     * Padding a droite
     * @param {string} str     - chaine source
     * @param {number} width   - largeur totale
     * @param {string} padChar - caractere de remplissage (defaut: ' ')
     * @param {boolean} padLeft - padding a gauche si true
     */
    function padRight(str, width, padChar, padLeft) {
        var s = String(str || '');
        var ch = padChar || ' ';
        if (s.length >= width) return s;
        var padding = '';
        for (var i = 0; i < width - s.length; i++) {
            padding += ch;
        }
        return padLeft ? (padding + s) : (s + padding);
    }

    /**
     * Echappe les caracteres speciaux pour XML
     */
    function escapeXML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

})();
