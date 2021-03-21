import * as vscode from 'vscode';
import { getPathFromStr } from '../utils';

/**
 * Represents the data passed through `scheme://file.ext?encoded-data` URI's by the DiffDocProvider.
 */
export type FileProviderUriData = {	
	commit: string;
	filePath: string;
	repo: string;
} | null;

/**
 * Produce the URI of a file to be used in the Visual Studio Diff View.
 * @param scheme The scheme of URI.
 * @param repo The repository the file is within.
 * @param filePath The path of the file.
 * @returns A URI of the form `git-graph://file.ext?encoded-data` or `file://path/file.ext`
 */
export function encodeFileProviderUri(scheme:string, repo: string, filePath: string, commit: string): vscode.Uri {
	let data: FileProviderUriData = {
		commit: commit,
		filePath: getPathFromStr(filePath),
		repo: repo
	};
	let extIndex = data.filePath.indexOf('.', data.filePath.lastIndexOf('/') + 1);
	let extension = extIndex > -1 ? data.filePath.substring(extIndex) : '';

	return vscode.Uri.file('file' + extension).with({
		scheme: scheme,
		query: Buffer.from(JSON.stringify(data)).toString('base64')
	});
}

/**
 * Decode the data from a `git-graph://file.ext?encoded-data` URI.
 * @param uri The URI to decode data from.
 * @returns The decoded DiffDocUriData.
 */
export function decodeFileProviderUri(uri: vscode.Uri): FileProviderUriData {
	return JSON.parse(Buffer.from(uri.query, 'base64').toString());
}
