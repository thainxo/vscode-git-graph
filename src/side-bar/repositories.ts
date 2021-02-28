import * as vscode from 'vscode';
import { RepoManager } from '../repoManager';
import { RepositoryProvider } from './repositoryProvider';

export function activate(context: vscode.ExtensionContext, repoManager: RepoManager) {
	const subscriptions = context.subscriptions;
	const diffFavoritesProvider = new RepositoryProvider(repoManager);
	const treeView = vscode.window.createTreeView('id-repositories', {
		treeDataProvider: diffFavoritesProvider,
		showCollapseAll: true
	});
	subscriptions.push(treeView);
}



