import * as vscode from 'vscode';
import { basename, join, resolve } from 'path';

const basePath = resolve(__dirname, '..', '..', 'resources');
const iconPath = {
	light: join(basePath, 'cmd-icon-light.svg'),
	dark: join(basePath, 'cmd-icon-dark.svg')
};

export class RepositoryItem extends vscode.TreeItem {
	private repository: string;
	public children: RepositoryItem[]|undefined;

	constructor(repository: string) {		
		let label = basename(repository);
		super(label, vscode.TreeItemCollapsibleState.None);

		this.repository = repository;
		this.iconPath = iconPath;
		this.description = this.repository;
		this.tooltip = this.repository;

		this.command = {
			command: 'git-graph.view',
			arguments: [ { rootUri: vscode.Uri.file(repository) } ],
			title: 'Open View Git Graph (git log)'
		};
		this.contextValue = 'repository';
	}

	public getRepositoty() {
		return this.repository;
	}
}
