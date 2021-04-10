import * as vscode from 'vscode';
import { RepoChangeEvent } from '../repoManager';
import { RepositoryItem } from './repositoryItem';

export class RepositoryProvider implements vscode.TreeDataProvider<RepositoryItem> {
	private _onDidChangeTreeData:vscode.EventEmitter<undefined> = new vscode.EventEmitter<undefined>();
	public readonly onDidChangeTreeData:vscode.Event<undefined> = this._onDidChangeTreeData.event;

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
		this.data.sort((a, b) => {
			if (a.label !== null && typeof a.label !== 'undefined') {
				if (b.label === null || typeof b.label === 'undefined') {
					return 0;
				} else {
					return a.label.toString().localeCompare(b.label.toString(), 'en', {
						sensitivity: 'base'
					});
				}
			} else {
				return 1;
			}
		});
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

	public getTreeItem(element: RepositoryItem): RepositoryItem|Thenable<RepositoryItem> {
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
