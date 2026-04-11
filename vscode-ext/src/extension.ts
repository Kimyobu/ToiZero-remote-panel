import * as vscode from 'vscode';
import axios from 'axios';
import * as path from 'path';
import { io, Socket } from 'socket.io-client';
import { TaskDecorationProvider } from './providers/TaskDecorationProvider';

// The port confirmed by the user
const BACKEND_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';
let sessionCookie: string | null = null;
let currentUsername: string | null = null;
let decorationProvider: TaskDecorationProvider;
let statusBarItem: vscode.StatusBarItem;
let socket: Socket | null = null;

export function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('🚀 ToiZero Extension Active!');
    
    decorationProvider = new TaskDecorationProvider(BACKEND_URL);
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(decorationProvider));

    // Initialize Socket Connection
    socket = io(SOCKET_URL);
    socket.on('submission:started', (data: { taskId: string }) => {
        vscode.window.setStatusBarMessage(`$(sync~spin) ToiZero: Submitting ${data.taskId}...`, 10000);
    });

    socket.on('submission:finished', (data: { taskId: string, score?: string, success: boolean, error?: string }) => {
        decorationProvider.refresh();
        if (data.success) {
            vscode.window.setStatusBarMessage(`$(check) ToiZero: ${data.taskId} evaluated! Score: ${data.score}`, 5000);
            if (data.score === '100') {
                vscode.window.showInformationMessage(`🎉 Task ${data.taskId} passed with 100 points!`);
            }
        } else {
            vscode.window.setStatusBarMessage(`$(error) ToiZero: ${data.taskId} submission failed`, 5000);
            vscode.window.showErrorMessage(`❌ Submission failed for ${data.taskId}: ${data.error || 'Unknown error'}`);
        }
    });

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'toizero.submitActive';
    context.subscriptions.push(statusBarItem);

    // Update status bar when editor changes
    const updateStatusBar = () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const folderName = path.dirname(editor.document.fileName).split(path.sep).pop() || '';
            const taskMatch = folderName.match(/[A-Z]\d+-\d{3}/);
            if (taskMatch) {
                const taskId = taskMatch[0];
                statusBarItem.text = `$(cloud-upload) ToiZero: Submit ${taskId}`;
                statusBarItem.tooltip = `Click to submit ${editor.document.fileName} to Toi CMS`;
                statusBarItem.show();
                return;
            }
        }
        statusBarItem.hide();
    };

    // Throttled refresh helper
    let refreshTimeout: NodeJS.Timeout | null = null;
    const throttledRefresh = () => {
        if (refreshTimeout) return;
        refreshTimeout = setTimeout(() => {
            decorationProvider.refresh();
            refreshTimeout = null;
        }, 2000); // 2 seconds throttle
    };

    vscode.window.onDidChangeActiveTextEditor(updateStatusBar, null, context.subscriptions);
    vscode.workspace.onDidSaveTextDocument(() => {
        updateStatusBar();
        if (sessionCookie) throttledRefresh();
    }, null, context.subscriptions);
    updateStatusBar();

    // Command: Login / Sync Session
    let disposableLogin = vscode.commands.registerCommand('toizero.login', async () => {
        console.log('ToiZero: Syncing login...');
        try {
            const res = await axios.get(`${BACKEND_URL}/auth/session`);
            if (res.data.hasSession && res.data.isValid) {
                sessionCookie = res.data.cookie;
                currentUsername = res.data.username;
                vscode.window.showInformationMessage(`✅ ToiZero: Synced as ${currentUsername}`);
                
                decorationProvider.setSession(sessionCookie);
            } else {
                vscode.window.showWarningMessage('ToiZero: No active session found. Please login via Web Panel.');
                decorationProvider.setSession(null);
            }
        } catch (e) {
            console.error('ToiZero: Sync failed', e);
            vscode.window.showErrorMessage('❌ ToiZero: Cannot connect to Backend on port 3001.');
        }
    });

    // Command: Refresh Data
    let disposableRefresh = vscode.commands.registerCommand('toizero.refreshDecorations', () => {
        decorationProvider.refresh();
        vscode.window.setStatusBarMessage('ToiZero: Refreshing task status...', 2000);
    });

    // Command: Submit Active File
    let disposableSubmit = vscode.commands.registerCommand('toizero.submitActive', async () => {
        if (!sessionCookie) {
            vscode.window.showErrorMessage('❌ ToiZero: Not logged in. Run "ToiZero: Sync Login" first.');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('ToiZero: No active editor to submit.');
            return;
        }

        const doc = editor.document;
        const filePath = doc.fileName;
        const fileName = path.basename(filePath);
        const parentDir = path.dirname(filePath);
        const folderName = parentDir.split(path.sep).pop() || '';

        // Verification: Folder name should match taskId (e.g. A1-001)
        const taskMatch = folderName.match(/[A-Z]\d+-\d{3}/);
        if (!taskMatch) {
            vscode.window.showErrorMessage(`❌ ToiZero: Folder name "${folderName}" does not look like a Task ID.`);
            return;
        }

        const taskId = taskMatch[0];
        
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `ToiZero: Submitting ${taskId}...`,
            cancellable: false
        }, async (progress) => {
            try {
                const content = doc.getText();
                const boundary = '----ToiZeroBoundary' + Math.random().toString(16);
                const body = 
                    `--${boundary}\r\n` +
                    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
                    `Content-Type: application/octet-stream\r\n\r\n` +
                    `${content}\r\n` +
                    `--${boundary}--\r\n`;

                const res = await axios.post(`${BACKEND_URL}/submit/${taskId}`, body, {
                    headers: {
                        'x-session-cookie': sessionCookie,
                        'Content-Type': `multipart/form-data; boundary=${boundary}`
                    }
                });

                if (res.data.success) {
                    const result = res.data;
                    vscode.window.showInformationMessage(`✅ ToiZero: ${taskId} submitted! Result: ${result.status} | Score: ${result.score}`);
                    decorationProvider.refresh();
                } else {
                    throw new Error(res.data.message || 'Submission failed');
                }
            } catch (err: any) {
                const msg = err.response?.data?.message || err.message;
                vscode.window.showErrorMessage(`❌ ToiZero Submit Failed: ${msg}`);
            }
        });
    });

    context.subscriptions.push(disposableLogin, disposableRefresh, disposableSubmit);
    
    // Auto sync on startup
    setTimeout(() => {
        vscode.commands.executeCommand('toizero.login');
    }, 1000);

    // Periodic refresh
    setInterval(() => {
        if (sessionCookie) {
            decorationProvider.refresh();
        }
    }, 30000);
}

export function deactivate() {}
