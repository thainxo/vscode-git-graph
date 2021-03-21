import * as vscode from 'vscode';

export class WorkingRepositoryItem extends vscode.TreeItem {
	public type: vscode.FileType;
	public repository: string;

	constructor(repository: string, path: string, type: vscode.FileType) {	
		const repositoryUri = vscode.Uri.file(path);		
		super(repositoryUri, type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
		this.type = type;
		this.repository = repository;
		this.contextValue = this.type === vscode.FileType.Directory ? this.contextValue : 'file';
	}
}
