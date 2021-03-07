import * as vscode from 'vscode';
import { Logger } from '../logger';
import { Disposable } from '../utils/disposable';
import { Event } from '../utils/event';
import { Entry, WorkingRepositoryProvider } from './workingRepositoryProvider';

export class WorkingRepositoryTreeView extends Disposable {
	private readonly treeView: vscode.TreeView<Entry>;
	private logger: Logger;
	
	/**
	 * Creates the Git Graph Repositories View.
	 * @param repoManager The Git Graph RepoManager instance.
	 */
	constructor(onDidChangeRepository: Event<string>, logger: Logger) {
		super();
		this.logger = logger;
		const treeViewProvider = new WorkingRepositoryProvider(logger);
		const treeView = vscode.window.createTreeView('id-working-repository', {
			treeDataProvider: treeViewProvider,
			showCollapseAll: true
		});

		this.treeView = treeView;

		this.registerDisposables(
			onDidChangeRepository((event) => {
				treeViewProvider.changeRepository(event);
				this.logger.log('onDidChangeRepository' + JSON.stringify(event));
			}),
			this.treeView
		);
	}
}
