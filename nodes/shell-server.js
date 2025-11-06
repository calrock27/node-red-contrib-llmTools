module.exports = function(RED) {
    function ShellServerNode(config) {
        RED.nodes.createNode(this, config);

        this.hostname = config.hostname;
        this.port = config.port || 22;
        this.username = config.username;
        this.authType = config.authType || 'password';

        // Credentials are automatically handled by Node-RED
        // and available via this.credentials
    }

    RED.nodes.registerType("shell-server", ShellServerNode, {
        credentials: {
            password: { type: "password" },
            privateKey: { type: "password" },
            passphrase: { type: "password" }
        }
    });
};
