import * as vscode from 'vscode';
import { RepoChangeEvent } from '../repoManager';
import { Disposable } from '../utils/disposable';
import { Event } from '../utils/event';
import { RepositoryItem } from './repositoryItem';
import { RepositoryProvider } from './repositoryProvider';

export class RepositoryTreeView extends Disposable {
	private readonly treeView: vscode.TreeView<RepositoryItem>;
	private readonly treeViewProvider: RepositoryProvider;
	private repository: string | null;

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
		this.repository = null;

		this.registerDisposables(
			onDidChangeRepos((event) => {				
				treeViewProvider.updateTreeItems(event);
			}),
			this.treeView
		);

		this.treeView.onDidChangeVisibility((event) => {
			if (event.visible && this.repository !== null) {
				let item = this.treeViewProvider.getCurrentTreeItem(this.repository);
				if (item !== null && this.treeView.visible) {
					this.treeView.reveal(item, { select: true } );
					this.treeViewProvider.refresh();
				}
			}
		});

		this.treeView.onDidChangeSelection((event) => {
			if (event.selection.length > 0) {
				const items: RepositoryItem[] = event.selection;
				this.repository = items[0].getRepositoty();
				vscode.commands.executeCommand('git-graph.workspace.changeRepository', { repo: this.repository } );
			}
		});
	}

	public setSelectedItem(repository: string) {
		this.repository = repository;
		let item = this.treeViewProvider.getCurrentTreeItem(repository);
		if (item !== null && this.treeView.visible) {
			this.treeView.reveal(item, { select: true } );
		}
	}

	public refresh(): void {
		this.treeViewProvider.refresh();
	}
}
