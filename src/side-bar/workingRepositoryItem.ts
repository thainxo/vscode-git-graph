import * as vscode from 'vscode';

export class WorkingRepositoryItem extends vscode.TreeItem {
	constructor(path: string, type: vscode.FileType) {	
		const repositoryUri = vscode.Uri.file(path);		
		super(repositoryUri, type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
		this.contextValue = type === vscode.FileType.Directory ? this.contextValue : 'file';
	}
}
