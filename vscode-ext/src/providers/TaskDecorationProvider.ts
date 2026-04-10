import * as vscode from 'vscode';
import axios from 'axios';

export class TaskDecorationProvider implements vscode.FileDecorationProvider {
    private _onDidChangeFileDecorations: vscode.EventEmitter<vscode.Uri | vscode.Uri[]> = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
    readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri | vscode.Uri[]> = this._onDidChangeFileDecorations.event;

    private taskCache: Map<string, any> = new Map();
    private backendUrl: string;
    private cookie: string | null = null;

    constructor(backendUrl: string) {
        this.backendUrl = backendUrl;
    }

    setSession(cookie: string | null) {
        this.cookie = cookie;
        this.refresh();
    }

    async refresh() {
        if (!this.cookie) {
            this.taskCache.clear();
            this._onDidChangeFileDecorations.fire(undefined as any);
            return;
        }

        try {
            const res = await axios.get(`${this.backendUrl}/tasks`, {
                headers: { 'x-session-cookie': this.cookie }
            });
            
            this.taskCache.clear();
            if (res.data.tasks) {
                res.data.tasks.forEach((t: any) => {
                    this.taskCache.set(t.id, t);
                });
            }
            // Fire event to refresh all decorations
            this._onDidChangeFileDecorations.fire(undefined as any);
        } catch (e) {
            console.error('ToiZero: Failed to refresh task status for decorations');
        }
    }

    provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): vscode.FileDecoration | undefined {
        // Pattern check: Is this a folder or file starting with A1-001 style?
        const pathParts = uri.path.split('/');
        const name = pathParts[pathParts.length - 1];
        
        // Match A1-001 or similar task ID patterns (one or more digits after letter)
        const taskMatch = name.match(/[A-Z]\d+-\d{3}/);
        if (!taskMatch) {
            // Check if parent folder is a task (for files inside a task folder)
            const parentName = pathParts[pathParts.length - 2];
            const parentMatch = parentName?.match(/[A-Z]\d+-\d{3}/);
            if (parentMatch) {
                return this.getDecorationForTask(parentMatch[0], false);
            }
            return undefined;
        }

        const taskId = taskMatch[0];
        const isExactMatch = name === taskId; // Folder match
        return this.getDecorationForTask(taskId, isExactMatch);
    }

    private getDecorationForTask(taskId: string, isFolder: boolean): vscode.FileDecoration | undefined {
        const task = this.taskCache.get(taskId);
        if (!task) {
            // No logs here to prevent flood, but we can verify if cache is empty
            return undefined;
        }

        const score = task.score;
        const maxScore = task.maxScore || 100;
        
        console.log(`ToiZero: Coloring ${taskId} - Score: ${score}/${maxScore}`);

        if (score === null || (task.status === 'not_submitted' && (score === 0 || score === undefined))) {
            return {
                badge: '●',
                color: new vscode.ThemeColor('errorForeground'),
                tooltip: 'ToiZero: Not Submitted'
            };
        }

        if (score >= maxScore) {
            return {
                badge: '✓',
                color: new vscode.ThemeColor('charts.green'),
                tooltip: `ToiZero: Solved (${score}/${maxScore})`,
                propagate: isFolder
            };
        }

        if (score > 0) {
            return {
                badge: score.toString(),
                color: new vscode.ThemeColor('charts.yellow'),
                tooltip: `ToiZero: Attempted (${score}/${maxScore})`,
                propagate: isFolder
            };
        }

        return {
            badge: '0',
            color: new vscode.ThemeColor('charts.red'),
            tooltip: 'ToiZero: 0 Points',
            propagate: isFolder
        };
    }
}
