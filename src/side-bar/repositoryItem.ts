import * as vscode from 'vscode';
import { basename, join, resolve } from 'path';
import { GitRepoState } from '../types';

const basePath = resolve(__dirname, '..', '..', 'resources');
const iconPath = {
	light: join(basePath, 'cmd-icon-light.svg'),
	dark: join(basePath, 'cmd-icon-dark.svg')
};

export class RepositoryItem extends vscode.TreeItem {
	private repository: string;
	private state: GitRepoState;
	public children: RepositoryItem[]|undefined;

	constructor(repository: string, state: GitRepoState) {		
		let label = basename(repository);
		super(label, vscode.TreeItemCollapsibleState.None);

		this.repository = repository;
		this.state = state;
		this.iconPath = iconPath;
		this.description = this.repository;
		this.tooltip = this.repository;

		this.command = {
			command: 'git-graph.view',
			arguments: [ { rootUri: vscode.Uri.file(repository) } ],
			title: 'Open View Git Graph (git log)'
		};
		this.contextValue = 'repository' + (true ? '.mustMerge' : '');
		this.resourceUri = vscode.Uri.parse('git-graph-repository://' + this.repository);
	}

	public getRepositoty(): {
		repo: string,
		state: GitRepoState
		} {
		return { 
			repo: this.repository,
			state: this.state
		};
	}
}
