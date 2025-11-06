/**
 * Shell command execution utilities (local and remote via SSH)
 */

const { exec } = require('child_process');
const { Client } = require('ssh2');

module.exports = {
    /**
     * Execute command locally
     * @param {string} command - Command to execute
     * @param {object} options - Execution options
     * @returns {Promise<object>} { stdout, stderr, exitCode }
     */
    executeLocal: function(command, options = {}) {
        return new Promise((resolve, reject) => {
            const timeout = options.timeout || 30000; // 30 second default timeout

            exec(command, { timeout }, (error, stdout, stderr) => {
                if (error) {
                    // Command executed but returned non-zero exit code
                    resolve({
                        stdout: stdout || '',
                        stderr: stderr || error.message,
                        exitCode: error.code || 1,
                        error: error.message
                    });
                } else {
                    resolve({
                        stdout: stdout || '',
                        stderr: stderr || '',
                        exitCode: 0
                    });
                }
            });
        });
    },

    /**
     * Execute command remotely via SSH
     * @param {string} command - Command to execute
     * @param {object} serverConfig - SSH server configuration
     * @param {object} options - Execution options
     * @returns {Promise<object>} { stdout, stderr, exitCode }
     */
    executeRemote: function(command, serverConfig, options = {}) {
        return new Promise((resolve, reject) => {
            const conn = new Client();
            let stdout = '';
            let stderr = '';

            const timeout = setTimeout(() => {
                conn.end();
                reject(new Error('SSH command execution timeout'));
            }, options.timeout || 30000);

            conn.on('ready', () => {
                conn.exec(command, (err, stream) => {
                    if (err) {
                        clearTimeout(timeout);
                        conn.end();
                        reject(err);
                        return;
                    }

                    stream.on('close', (code, signal) => {
                        clearTimeout(timeout);
                        conn.end();
                        resolve({
                            stdout: stdout,
                            stderr: stderr,
                            exitCode: code || 0,
                            signal: signal
                        });
                    });

                    stream.on('data', (data) => {
                        stdout += data.toString();
                    });

                    stream.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });
                });
            });

            conn.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });

            // Build SSH connection config
            const sshConfig = {
                host: serverConfig.hostname,
                port: serverConfig.port || 22,
                username: serverConfig.username
            };

            if (serverConfig.authType === 'privatekey') {
                sshConfig.privateKey = serverConfig.credentials.privateKey;
                if (serverConfig.credentials.passphrase) {
                    sshConfig.passphrase = serverConfig.credentials.passphrase;
                }
            } else {
                sshConfig.password = serverConfig.credentials.password;
            }

            conn.connect(sshConfig);
        });
    },

    /**
     * Execute command based on execution mode
     * @param {string} command - Command to execute
     * @param {string} mode - 'local' or 'remote'
     * @param {object} serverConfig - SSH server config (required for remote)
     * @param {object} options - Execution options
     * @returns {Promise<object>} Execution result
     */
    execute: function(command, mode, serverConfig, options = {}) {
        if (mode === 'remote') {
            if (!serverConfig) {
                return Promise.reject(new Error('Server configuration required for remote execution'));
            }
            return this.executeRemote(command, serverConfig, options);
        } else {
            return this.executeLocal(command, options);
        }
    }
};
