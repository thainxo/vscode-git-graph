import {
	CancellationToken,
	Disposable,
	Event,
	EventEmitter,
	FileDecoration,
	FileDecorationProvider,
	ThemeColor,
	Uri,
	window
} from 'vscode';
import { DataSource } from '../dataSource';
import { Logger } from '../logger';
import { RepoFileWatcher } from '../repoFileWatcher';
import { CommitOrdering } from '../types';
import { getPathFromStr, getPathFromUri } from '../utils';

export class GitGraphFileDecorationProvider implements FileDecorationProvider, Disposable {
	private repoFileWatchers: Map<string, RepoFileWatcher>;
	private logger: Logger;
	private dataSource: DataSource;

	private readonly onDidChangeDecorationsEmitter = new EventEmitter<Uri[]>();
	public readonly onDidChangeFileDecorations: Event<Uri[]> = this.onDidChangeDecorationsEmitter.event;

	private readonly disposable: Disposable;
	constructor(logger: Logger, dataSource: DataSource) {
		this.dataSource = dataSource;
		this.logger = logger;

		this.disposable = Disposable.from(
			window.registerFileDecorationProvider(this)
		);

		this.repoFileWatchers = new Map();
		// this.repoFileWatchers = new RepoFileWatcher(this.logger, (uri) => {
		// 	if (uri !== null) {
		// 		this.onDidChangeDecorationsEmitter.fire([uri]);
		// 	}
		// });
	}

	public dispose(): void {
		this.disposable.dispose();
		for (let entry of this.repoFileWatchers.entries()) {
			let repoFileWatcher = entry[1];
			repoFileWatcher.stop();
		}
	}

	public async provideFileDecoration(uri: Uri, token: CancellationToken): Promise<FileDecoration | undefined> {
		if (uri.scheme !== 'git-graph-repository') return undefined;
		let repoFileWatcher = new RepoFileWatcher(this.logger, () => {
			for (let entry of this.repoFileWatchers.entries()) {
				let watcher = entry[1];
				if (repoFileWatcher === watcher) {
					let uri = JSON.parse(entry[0]);
					this.onDidChangeDecorationsEmitter.fire([uri]);
					break;
				}
			}
		});
		this.repoFileWatchers.set(JSON.stringify(uri), repoFileWatcher);
		repoFileWatcher.start(getPathFromStr(uri.authority + uri.path));
		return await this.provideRepositoryFileDecoration(uri, token);
	}

	private async provideRepositoryFileDecoration(uri: Uri, _token: CancellationToken): Promise<FileDecoration | undefined> {
		let count = await this.getCountBadge(uri);
		let pushed = await this.isPushedCommit(uri);
		let result: FileDecoration = {
			badge: '' + count,
			tooltip: (uri.fragment === '1' ? 'Waiting to push' : ''),
			color: (uri.fragment === '1' ? (count === 0 && pushed === true ? new ThemeColor('gitDecoration.addedResourceForeground') : new ThemeColor('gitDecoration.modifiedResourceForeground')) : new ThemeColor('editor.foreground'))
		};
		return result;
	}

	private async getCountBadge(uri: Uri): Promise<number> {
		let count: number = 0;
		let path = getPathFromUri(uri);
		let data = await this.dataSource.getUncommittedDetails(path);
		if (data.commitDetails !== null) {
			count = data.commitDetails?.fileChanges.length;
		}
		return count;
	}

	private async isPushedCommit(uri: Uri): Promise<boolean> {
		let pushed: boolean = false;
		let path = getPathFromUri(uri);
		let localCommit = await this.dataSource.getLogLocal(path, 1, CommitOrdering.Date);
		if (localCommit !== null) {
			pushed = localCommit.length === 0;
		}
		return pushed;
	}
}
