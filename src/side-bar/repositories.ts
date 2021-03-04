import * as vscode from 'vscode';
import { RepoChangeEvent } from '../repoManager';
import { Disposable } from '../utils/disposable';
import { Event } from '../utils/event';
import { RepositoryItem } from './repositoryItem';
import { RepositoryProvider } from './repositoryProvider';

export class RepositoryTreeView extends Disposable {
	private readonly treeView: vscode.TreeView<RepositoryItem>;
	private readonly treeViewProvider: RepositoryProvider;

	/**
	 * Creates the Git Graph Repositories View.
	 * @param repoManager The Git Graph RepoManager instance.
	 */
	constructor(onDidChangeRepos: Event<RepoChangeEvent>) {
		super();

		const treeViewProvider = new RepositoryProvider();
		const treeView = vscode.window.createTreeView('id-repositories', {
			treeDataProvider: treeViewProvider,
			showCollapseAll: true
		});

		this.treeView = treeView;
		this.treeViewProvider = treeViewProvider;

		this.registerDisposables(
			onDidChangeRepos((event) => {				
				treeViewProvider.updateTreeItems(event);
			}),
			this.treeView
		);
	}

	public setSelectedItem(repository: string) {
		let item = this.treeViewProvider.getCurrentTreeItem(repository);
		if (item !== null) {
			this.treeView.reveal(item, { select: true } );
		}
	}
}
