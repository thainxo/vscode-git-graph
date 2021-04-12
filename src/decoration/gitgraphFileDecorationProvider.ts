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

export class GitGraphFileDecorationProvider implements FileDecorationProvider, Disposable {

	private readonly _onDidChange = new EventEmitter<undefined | Uri | Uri[]>();
	get onDidChange(): Event<undefined | Uri | Uri[]> {
		return this._onDidChange.event;
	}

	private readonly disposable: Disposable;
	constructor() {
		this.disposable = Disposable.from(
			window.registerFileDecorationProvider(this)
		);
	}

	public dispose(): void {
		this.disposable.dispose();
	}

	public provideFileDecoration(uri: Uri, token: CancellationToken): FileDecoration | undefined {
		if (uri.scheme !== 'git-graph-repository') return undefined;
		return this.provideRepositoryFileDecoration(uri, token);
	}

	private provideRepositoryFileDecoration(uri: Uri, _token: CancellationToken): FileDecoration | undefined {
		let count = this.getCountBadge(uri);
		return {
			badge: '' + count,
			tooltip: 'Renamed'
		};
	}

	private getCountBadge(_uri: Uri): number {
		let count: number = 0;
		return count;
	}
}
