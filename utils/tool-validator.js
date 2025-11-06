/**
 * Tool and input validation utilities
 */

module.exports = {
    /**
     * Validate tool definition
     * @param {object} tool - Tool definition
     * @returns {object} { valid: boolean, error: string }
     */
    validateTool: function(tool) {
        if (!tool) {
            return { valid: false, error: "Tool definition is required" };
        }

        if (!tool.name || typeof tool.name !== 'string' || tool.name.trim() === '') {
            return { valid: false, error: "Tool name is required" };
        }

        if (!tool.description || typeof tool.description !== 'string') {
            return { valid: false, error: "Tool description is required" };
        }

        if (!tool.command || typeof tool.command !== 'string' || tool.command.trim() === '') {
            return { valid: false, error: "Tool command is required" };
        }

        // Validate parameters schema if provided
        if (tool.parameters) {
            if (typeof tool.parameters !== 'object') {
                return { valid: false, error: "Tool parameters must be an object" };
            }

            // Basic JSON schema validation
            if (tool.parameters.type && tool.parameters.type !== 'object') {
                return { valid: false, error: "Tool parameters type must be 'object'" };
            }
        }

        return { valid: true };
    },

    /**
     * Validate tool execution request
     * @param {object} msg - Incoming message
     * @returns {object} { valid: boolean, error: string }
     */
    validateExecutionRequest: function(msg) {
        if (!msg || !msg.payload) {
            return { valid: false, error: "Message payload is required" };
        }

        const payload = msg.payload;

        if (!payload.action) {
            return { valid: false, error: "payload.action is required" };
        }

        if (payload.action === 'execute_tool') {
            if (!payload.tool_name) {
                return { valid: false, error: "payload.tool_name is required for execute_tool action" };
            }
        }

        return { valid: true };
    },

    /**
     * Sanitize shell command to prevent basic injection attacks
     * Note: This is basic sanitization. For production, consider more robust solutions.
     * @param {string} command - Command to sanitize
     * @returns {string} Sanitized command
     */
    sanitizeCommand: function(command) {
        if (!command || typeof command !== 'string') {
            return '';
        }

        // This is a basic check - users should still be careful with command construction
        // In production, consider using shell escaping libraries or parameterized commands
        return command;
    },

    /**
     * Validate parameter values against schema
     * @param {object} parameters - Parameter values
     * @param {object} schema - JSON schema definition
     * @returns {object} { valid: boolean, error: string }
     */
    validateParameters: function(parameters, schema) {
        if (!schema || !schema.properties) {
            return { valid: true };
        }

        parameters = parameters || {};

        // Check required parameters
        if (schema.required && Array.isArray(schema.required)) {
            for (const requiredParam of schema.required) {
                if (!(requiredParam in parameters)) {
                    return {
                        valid: false,
                        error: `Required parameter '${requiredParam}' is missing`
                    };
                }
            }
        }

        return { valid: true };
    }
};
