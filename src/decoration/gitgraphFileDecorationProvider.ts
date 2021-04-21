import {
	CancellationToken,
	Disposable,
	Event,
	EventEmitter,
	FileDecoration,
	FileDecorationProvider,
	Uri,
	window
} from 'vscode';
import { DataSource } from '../dataSource';
import { getPathFromUri } from '../utils';

export class GitGraphFileDecorationProvider implements FileDecorationProvider, Disposable {
	private dataSource: DataSource;

	private readonly _onDidChange = new EventEmitter<undefined | Uri | Uri[]>();
	get onDidChange(): Event<undefined | Uri | Uri[]> {
		return this._onDidChange.event;
	}

	private readonly disposable: Disposable;
	constructor(dataSource: DataSource) {
		this.dataSource = dataSource;
		this.disposable = Disposable.from(
			window.registerFileDecorationProvider(this)
		);
	}

	public dispose(): void {
		this.disposable.dispose();
	}

	public async provideFileDecoration(uri: Uri, token: CancellationToken): Promise<FileDecoration | undefined> {
		if (uri.scheme !== 'git-graph-repository') return undefined;
		return await this.provideRepositoryFileDecoration(uri, token);
	}

	private async provideRepositoryFileDecoration(uri: Uri, _token: CancellationToken): Promise<FileDecoration | undefined> {
		let count = await this.getCountBadge(uri);
		return {
			badge: '' + count,
			tooltip: 'Renamed'
		};
	}

	private async getCountBadge(uri: Uri): Promise<number> {
		let count: number = 0;
		let data = await this.dataSource.getUncommittedDetails(getPathFromUri(uri));
		if (data.commitDetails !== null) {
			count = data.commitDetails?.fileChanges.length;
		}
		return count;
	}
}
