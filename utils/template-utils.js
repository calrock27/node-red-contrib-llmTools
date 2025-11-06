/**
 * Mustache template rendering utilities
 */

const mustache = require('mustache');

module.exports = {
    /**
     * Render a Mustache template with message context
     * @param {string} template - Template string with {{variable}} syntax
     * @param {object} msg - Node-RED message object
     * @returns {string} Rendered template
     */
    render: function(template, msg) {
        if (!template || typeof template !== 'string') {
            return template;
        }

        try {
            // Create context with both top-level properties and msg namespace
            const context = { ...msg, msg: msg };
            return mustache.render(template, context);
        } catch (err) {
            throw new Error(`Template rendering failed: ${err.message}`);
        }
    },

    /**
     * Check if a string contains Mustache template syntax
     * @param {string} str - String to check
     * @returns {boolean} True if contains {{...}}
     */
    hasTemplate: function(str) {
        if (!str || typeof str !== 'string') {
            return false;
        }
        return /\{\{.*?\}\}/.test(str);
    }
};
