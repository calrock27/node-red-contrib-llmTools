/**
 * Standardized status indicators for Node-RED nodes
 */

module.exports = {
    /**
     * Set idle status
     */
    idle: function(node) {
        node.status({});
    },

    /**
     * Set processing status
     */
    processing: function(node, text = "processing") {
        node.status({ fill: "blue", shape: "dot", text: text });
    },

    /**
     * Set success status
     */
    success: function(node, text = "success") {
        node.status({ fill: "green", shape: "dot", text: text });
    },

    /**
     * Set error status
     */
    error: function(node, text = "error") {
        node.status({ fill: "red", shape: "ring", text: text });
    },

    /**
     * Set warning status
     */
    warning: function(node, text = "warning") {
        node.status({ fill: "yellow", shape: "dot", text: text });
    },

    /**
     * Set waiting/pending status
     */
    waiting: function(node, text = "waiting") {
        node.status({ fill: "yellow", shape: "ring", text: text });
    }
};
