import * as vscode from 'vscode';
import { basename, join, resolve } from 'path';

const basePath = resolve(__dirname, '..', '..', 'resources');
const iconPath = {
	light: join(basePath, 'cmd-icon-light.svg'),
	dark: join(basePath, 'cmd-icon-dark.svg')
};

export class RepositoryItem extends vscode.TreeItem {
	public children: RepositoryItem[]|undefined;

	constructor(repository: string, children?: RepositoryItem[]) {
		let label = basename(repository);
		super(label, children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Expanded);
		this.children = children;
		this.iconPath = iconPath;
		this.description = repository;
		this.tooltip = repository;
		this.command = {
			arguments: [ { rootUri: vscode.Uri.file(repository) } ],
			command: 'git-graph.view',
			title: 'Open View Git Graph (git log)'
		};
	}
}
