import * as vscode from 'vscode';
import { RepoManager } from '../repoManager';
import { RepositoryItem } from './repositoryItem';

export class RepositoryProvider implements vscode.TreeDataProvider<RepositoryItem> {
	private _onDidChangeTreeData:vscode.EventEmitter<RepositoryItem|undefined> = new vscode.EventEmitter<RepositoryItem|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<RepositoryItem|undefined> = this._onDidChangeTreeData.event;

	private data: RepositoryItem[];

	constructor(repoManager: RepoManager) {
		let repos = repoManager.getRepos();
		this.data = [];
		let repoPaths = Object.keys(repos);
		for (let i = 0; i < repoPaths.length; i++) {
			this.data.push(new RepositoryItem(repoPaths[i]));
		}
	}

	public getTreeItem(element: RepositoryItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
		return element;
	}

	public getChildren(element?: RepositoryItem|undefined): vscode.ProviderResult<RepositoryItem[]> {
		if (element === undefined) {
			return this.data;
		}
		return element.children;
	}

	public refresh() :void {
		this._onDidChangeTreeData.fire(undefined);	
	}
}
