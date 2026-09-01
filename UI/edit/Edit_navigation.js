// ============================================================
// Edit_navigation.js - Toggle INPUT / OUTPUT + scroll
// ============================================================

const EditNavigation = {
    currentTarget: 'input',

    init() {
        const btnInput = document.getElementById('toggle-input');
        const btnOutput = document.getElementById('toggle-output');

        if (btnInput) btnInput.addEventListener('click', () => this.navigateTo('input'));
        if (btnOutput) btnOutput.addEventListener('click', () => this.navigateTo('output'));
    },

    navigateTo(target) {
        if (target === this.currentTarget) return;
        this.currentTarget = target;

        const btnInput = document.getElementById('toggle-input');
        const btnOutput = document.getElementById('toggle-output');

        if (btnInput) btnInput.classList.toggle('active', target === 'input');
        if (btnOutput) btnOutput.classList.toggle('active', target === 'output');

        const content = EditCodeMirror.getValue();
        const lines = content.split('\n');
        const tag = target === 'input' ? '[INPUT]' : '[OUTPUT]';

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === tag) {
                EditCodeMirror.scrollToLine(i);
                break;
            }
        }
    }
};
