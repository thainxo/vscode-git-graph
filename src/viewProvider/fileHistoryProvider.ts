import * as vscode from 'vscode';
import { DataSource } from '../dataSource';
import { Disposable } from '../utils/disposable';
import { decodeFileProviderUri, encodeFileProviderUri } from './providerUtils';

export class FileHistoryProvider extends Disposable implements vscode.TextDocumentContentProvider {
	public static scheme = 'git-graph.fileHistory';
	private readonly dataSource: DataSource;
	private readonly onDidChangeEventEmitter = new vscode.EventEmitter<vscode.Uri>();
	
	/**
	 * Creates the Git Graph Diff Document Provider.
	 * @param dataSource The Git Graph DataSource instance.
	 */
	constructor(dataSource: DataSource) {
		super();
		this.dataSource = dataSource;

		this.registerDisposables(
			this.onDidChangeEventEmitter
		);
	}

	/**
	 * Provides the content of a text document at a specific Git revision.
	 * @param uri The `git-graph://file.ext?encoded-data` URI.
	 * @returns The content of the text document.
	 */
	 public provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
		let historyFile = decodeFileProviderUri(uri);
		return this.dataSource.blameFile(historyFile!.repo, historyFile!.filePath);
	}

	public static openHistoryFile(resource: any) {
		if (typeof resource === 'object') {
			let historyUri = encodeFileProviderUri(FileHistoryProvider.scheme, resource.repository, resource.resourceUri.fsPath, '');
			vscode.workspace.openTextDocument(historyUri)
				.then(doc => vscode.window.showTextDocument(doc)
					.then(_editor => {
						_editor.selection = new vscode.Selection( 0, 4, 0, 8 );
					}));
		}
	}
}
