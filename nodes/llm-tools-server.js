module.exports = function(RED) {
    function LLMToolsServerNode(config) {
        RED.nodes.createNode(this, config);

        this.hostname = config.hostname;
        this.port = config.port || 22;
        this.username = config.username;
        this.authType = config.authType || 'password';

        // Credentials are automatically handled by Node-RED
        // and available via this.credentials
    }

    RED.nodes.registerType("llm-tools-server", LLMToolsServerNode, {
        credentials: {
            password: { type: "password" },
            privateKey: { type: "password" },
            passphrase: { type: "password" }
        }
    });
};
