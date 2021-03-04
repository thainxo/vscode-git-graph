import * as vscode from 'vscode';
import { RepoChangeEvent } from '../repoManager';
import { RepositoryItem } from './repositoryItem';

export class RepositoryProvider implements vscode.TreeDataProvider<RepositoryItem> {
	private _onDidChangeTreeData:vscode.EventEmitter<RepositoryItem|undefined> = new vscode.EventEmitter<RepositoryItem|undefined>();
	public readonly onDidChangeTreeData:vscode.Event<RepositoryItem|undefined> = this._onDidChangeTreeData.event;

	private data: RepositoryItem[];

	constructor() {
		this.data = [];
	}

	public updateTreeItems(event: RepoChangeEvent) {
		this.data.splice(0, this.data.length);
		let repoPaths = Object.keys(event.repos);
		for (let i = 0; i < repoPaths.length; i++) {
			this.data.push(new RepositoryItem(repoPaths[i]));
		}
		this.refresh();
	}

	public getCurrentTreeItem(repository: string) {
		let repositoryItem: RepositoryItem|null = null;
		for (let i = 0; i < this.data.length; i++) {
			if (this.data[i].getRepositoty() === repository) {
				repositoryItem = this.data[i];
				break;
			}
		}
		return repositoryItem;
	}

	public getParent() {
		return null;
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
