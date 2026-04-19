/**
 * Theme rendering: converts engine markup tags to styled HTML spans.
 *
 * The Python engine outputs strings with Rich-style markup like
 * [character_name]Mira[/character_name]. This module converts those
 * to <span class="theme-character_name">Mira</span> for CSS styling.
 */

// All known theme tags from engine/theme.py
const THEME_TAGS = [
    'character_name',
    'dialogue',
    'item_name',
    'spell_name',
    'room_name',
    'quest_name',
    'event',
    'failure',
    'success',
    'exits',
    'bold',
    'dim',
];

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} text - Raw text from the engine.
 * @returns {string} HTML-safe text.
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Convert engine markup tags to HTML spans with CSS classes.
 *
 * First escapes raw HTML, then replaces [tag]...[/tag] pairs with
 * <span class="theme-tag">...</span>.
 *
 * @param {string} text - Themed text from the engine.
 * @returns {string} HTML string safe for innerHTML.
 */
function renderMarkup(text) {
    if (!text) return '';

    // Escape HTML first to prevent injection
    let html = escapeHtml(text);

    // Replace each known tag with a styled span
    for (const tag of THEME_TAGS) {
        const openRegex = new RegExp(`\\[${tag}\\]`, 'g');
        const closeRegex = new RegExp(`\\[/${tag}\\]`, 'g');
        html = html.replace(openRegex, `<span class="theme-${tag}">`);
        html = html.replace(closeRegex, '</span>');
    }

    // Convert newlines to <br> for display
    html = html.replace(/\n/g, '<br>');

    return html;
}

// Export for use by other modules
window.RetroTheme = { renderMarkup, escapeHtml };
