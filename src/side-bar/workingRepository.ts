import * as vscode from 'vscode';
import { Disposable } from '../utils/disposable';
import { WorkingRepositoryItem } from './workingRepositoryItem';
import { WorkingRepositoryProvider } from './workingRepositoryProvider';

export class WorkingRepositoryTreeView extends Disposable {
	private readonly treeView: vscode.TreeView<WorkingRepositoryItem>;
	private readonly treeViewProvider: WorkingRepositoryProvider;
	
	/**
	 * Creates the Git Graph Repositories View.
	 * @param repoManager The Git Graph RepoManager instance.
	 */
	constructor() {
		super();
		const treeViewProvider = new WorkingRepositoryProvider();
		const treeView = vscode.window.createTreeView('workingRepoViewId', {
			treeDataProvider: treeViewProvider,
			showCollapseAll: true
		});

		this.treeView = treeView;
		this.treeViewProvider = treeViewProvider;

		this.registerDisposables(
			this.treeView
		);
	}

	public changeRepository(repository: string): void {
		this.treeViewProvider.changeRepository(repository);
	}
}
