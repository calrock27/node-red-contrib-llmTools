const statusUtils = require('../utils/status-utils');
const templateUtils = require('../utils/template-utils');
const shellExecutor = require('../utils/shell-executor');
const toolValidator = require('../utils/tool-validator');

module.exports = function(RED) {
    function ShellToolNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Parse tools configuration
        node.tools = [];
        try {
            node.tools = JSON.parse(config.tools || '[]');
        } catch (err) {
            node.error('Failed to parse tools configuration: ' + err.message);
        }

        // Track pending approval requests
        node.pendingApprovals = new Map();

        // Set initial status
        statusUtils.idle(node);

        node.on('input', async function(msg, send, done) {
            // Ensure compatibility with Node-RED < 1.0
            send = send || function() { node.send.apply(node, arguments); };
            done = done || function(err) { if (err) node.error(err, msg); };

            try {
                // Validate input message
                const validation = toolValidator.validateExecutionRequest(msg);
                if (!validation.valid) {
                    const errorMsg = { ...msg, payload: { error: validation.error } };
                    send([null, errorMsg, null]);
                    statusUtils.error(node, validation.error);
                    done();
                    return;
                }

                const action = msg.payload.action;

                // Handle list_tools action
                if (action === 'list_tools') {
                    await handleListTools(node, msg, send, done);
                    return;
                }

                // Handle execute_tool action
                if (action === 'execute_tool') {
                    await handleExecuteTool(node, msg, send, done, config);
                    return;
                }

                // Handle approve_tool action (for approval workflow)
                if (action === 'approve_tool') {
                    await handleApproveTool(node, msg, send, done, config);
                    return;
                }

                // Unknown action
                const errorMsg = { ...msg, payload: { error: `Unknown action: ${action}` } };
                send([null, errorMsg, null]);
                statusUtils.error(node, 'unknown action');
                done();

            } catch (err) {
                const errorMsg = { ...msg, payload: { error: err.message } };
                send([null, errorMsg, null]);
                statusUtils.error(node, err.message);
                done();
            }
        });

        /**
         * Handle list_tools request
         */
        async function handleListTools(node, msg, send, done) {
            statusUtils.processing(node, 'listing tools');

            // Build tools schema for LLM
            const toolsSchema = node.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters || {
                    type: 'object',
                    properties: {},
                    required: []
                }
            }));

            const responseMsg = {
                ...msg,
                payload: {
                    action: 'list_tools',
                    tools: toolsSchema
                }
            };

            send([responseMsg, null, null]);
            statusUtils.success(node, `${toolsSchema.length} tools available`);
            done();
        }

        /**
         * Handle execute_tool request
         */
        async function handleExecuteTool(node, msg, send, done, config) {
            const toolName = msg.payload.tool_name;
            const parameters = msg.payload.parameters || {};

            statusUtils.processing(node, `executing ${toolName}`);

            // Find the tool definition
            const tool = node.tools.find(t => t.name === toolName);
            if (!tool) {
                const errorMsg = { ...msg, payload: { error: `Tool '${toolName}' not found` } };
                send([null, errorMsg, null]);
                statusUtils.error(node, 'tool not found');
                done();
                return;
            }

            // Validate parameters
            const paramValidation = toolValidator.validateParameters(parameters, tool.parameters);
            if (!paramValidation.valid) {
                const errorMsg = { ...msg, payload: { error: paramValidation.error } };
                send([null, errorMsg, null]);
                statusUtils.error(node, 'invalid parameters');
                done();
                return;
            }

            // Check if approval is required
            if (tool.requireApproval) {
                // Generate approval ID
                const approvalId = generateApprovalId();

                // Store pending approval
                node.pendingApprovals.set(approvalId, {
                    tool: tool,
                    parameters: parameters,
                    originalMsg: msg,
                    timestamp: Date.now()
                });

                // Send to approval output
                const approvalMsg = {
                    ...msg,
                    payload: {
                        action: 'approval_required',
                        approval_id: approvalId,
                        tool_name: toolName,
                        parameters: parameters,
                        command_preview: buildCommandPreview(tool, parameters, msg)
                    }
                };

                send([null, null, approvalMsg]);
                statusUtils.waiting(node, 'awaiting approval');
                done();
                return;
            }

            // Execute immediately if no approval required
            await executeToolCommand(node, tool, parameters, msg, send, done, config);
        }

        /**
         * Handle approve_tool request
         */
        async function handleApproveTool(node, msg, send, done, config) {
            const approvalId = msg.payload.approval_id;
            const approved = msg.payload.approved === true;

            if (!approvalId) {
                const errorMsg = { ...msg, payload: { error: 'approval_id is required' } };
                send([null, errorMsg, null]);
                statusUtils.error(node, 'missing approval_id');
                done();
                return;
            }

            const pendingApproval = node.pendingApprovals.get(approvalId);
            if (!pendingApproval) {
                const errorMsg = { ...msg, payload: { error: 'Approval request not found or expired' } };
                send([null, errorMsg, null]);
                statusUtils.error(node, 'approval not found');
                done();
                return;
            }

            // Remove from pending
            node.pendingApprovals.delete(approvalId);

            if (!approved) {
                // User rejected the execution
                const responseMsg = {
                    ...pendingApproval.originalMsg,
                    payload: {
                        action: 'execute_tool',
                        tool_name: pendingApproval.tool.name,
                        status: 'rejected',
                        message: 'Tool execution rejected by user'
                    }
                };
                send([responseMsg, null, null]);
                statusUtils.success(node, 'execution rejected');
                done();
                return;
            }

            // Execute the approved tool
            await executeToolCommand(
                node,
                pendingApproval.tool,
                pendingApproval.parameters,
                pendingApproval.originalMsg,
                send,
                done,
                config
            );
        }

        /**
         * Execute tool command
         */
        async function executeToolCommand(node, tool, parameters, msg, send, done, config) {
            try {
                statusUtils.processing(node, `executing ${tool.name}`);

                // Build command with parameter substitution
                const command = buildCommand(tool, parameters, msg);

                // Get server config if remote execution
                let serverConfig = null;
                if (tool.executionMode === 'remote') {
                    if (!tool.server) {
                        throw new Error('Remote execution requires server configuration');
                    }
                    serverConfig = RED.nodes.getNode(tool.server);
                    if (!serverConfig) {
                        throw new Error('Server configuration not found');
                    }
                }

                // Execute command
                const result = await shellExecutor.execute(
                    command,
                    tool.executionMode || 'local',
                    serverConfig,
                    { timeout: tool.timeout || 30000 }
                );

                // Build response message
                const responseMsg = {
                    ...msg,
                    payload: {
                        action: 'execute_tool',
                        tool_name: tool.name,
                        parameters: parameters,
                        result: {
                            stdout: result.stdout,
                            stderr: result.stderr,
                            exitCode: result.exitCode
                        }
                    }
                };

                // Send to appropriate output based on exit code
                if (result.exitCode === 0) {
                    send([responseMsg, null, null]);
                    statusUtils.success(node, 'execution complete');
                } else {
                    send([null, responseMsg, null]);
                    statusUtils.warning(node, `exit code ${result.exitCode}`);
                }

                done();

            } catch (err) {
                const errorMsg = {
                    ...msg,
                    payload: {
                        action: 'execute_tool',
                        tool_name: tool.name,
                        error: err.message
                    }
                };
                send([null, errorMsg, null]);
                statusUtils.error(node, err.message);
                done();
            }
        }

        /**
         * Build command with parameter substitution
         */
        function buildCommand(tool, parameters, msg) {
            let command = tool.command;

            // Create context for template rendering
            const context = {
                ...msg,
                msg: msg,
                params: parameters,
                ...parameters  // Also allow direct parameter access
            };

            // Render Mustache template
            command = templateUtils.render(command, context);

            return command;
        }

        /**
         * Build command preview for approval message
         */
        function buildCommandPreview(tool, parameters, msg) {
            try {
                return buildCommand(tool, parameters, msg);
            } catch (err) {
                return `[Error building command: ${err.message}]`;
            }
        }

        /**
         * Generate unique approval ID
         */
        function generateApprovalId() {
            return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Clean up old pending approvals periodically (older than 5 minutes)
        const cleanupInterval = setInterval(() => {
            const now = Date.now();
            const maxAge = 5 * 60 * 1000; // 5 minutes

            for (const [id, approval] of node.pendingApprovals.entries()) {
                if (now - approval.timestamp > maxAge) {
                    node.pendingApprovals.delete(id);
                }
            }
        }, 60000); // Run every minute

        node.on('close', function() {
            clearInterval(cleanupInterval);
            node.pendingApprovals.clear();
            statusUtils.idle(node);
        });
    }

    RED.nodes.registerType("shell-tool", ShellToolNode);
};
