import * as os from 'os';
import * as vscode from 'vscode';
import { AvatarManager } from './avatarManager';
import { getConfig } from './config';
import { DataSource } from './dataSource';
import { CodeReviewData, CodeReviews, ExtensionState } from './extensionState';
import { FileHistoryProvider } from './viewProvider/fileHistoryProvider';
import * as fs from 'fs';
import { GitGraphView } from './gitGraphView';
import { Logger } from './logger';
import { RepoManager } from './repoManager';
import { RepositoryTreeView } from './side-bar/repositories';
import { WorkingRepositoryTreeView } from './side-bar/workingRepository';
import { GitExecutable, UNABLE_TO_FIND_GIT_MSG, abbrevCommit, abbrevText, copyToClipboard, getExtensionVersion, getPathFromUri, getRelativeTimeDiff, getRepoName, resolveToSymbolicPath, showErrorMessage, showInformationMessage } from './utils';
import { Disposable } from './utils/disposable';
import { Event } from './utils/event';
import { dirname } from 'path';

/**
 * Manages the registration and execution of Git Graph Commands.
 */
export class CommandManager extends Disposable {
	private readonly context: vscode.ExtensionContext;
	private readonly avatarManager: AvatarManager;
	private readonly dataSource: DataSource;
	private readonly extensionState: ExtensionState;
	private readonly logger: Logger;
	private readonly repoManager: RepoManager;
	private readonly repositoryTreeView: RepositoryTreeView;
	private readonly workingRepositoryTreeView: WorkingRepositoryTreeView;
	private gitExecutable: GitExecutable | null;

	/**
	 * Creates the Git Graph Command Manager.
	 * @param extensionPath The absolute file path of the directory containing the extension.
	 * @param avatarManger The Git Graph AvatarManager instance.
	 * @param dataSource The Git Graph DataSource instance.
	 * @param extensionState The Git Graph ExtensionState instance.
	 * @param repoManager The Git Graph RepoManager instance.
	 * @param gitExecutable The Git executable available to Git Graph at startup.
	 * @param onDidChangeGitExecutable The Event emitting the Git executable for Git Graph to use.
	 * @param logger The Git Graph Logger instance.
	 */
	constructor(context: vscode.ExtensionContext, avatarManger: AvatarManager, dataSource: DataSource, extensionState: ExtensionState, repoManager: RepoManager, repositoryTreeView: RepositoryTreeView, workingRepositoryTreeView: WorkingRepositoryTreeView, gitExecutable: GitExecutable | null, onDidChangeGitExecutable: Event<GitExecutable>, logger: Logger) {
		super();
		this.context = context;
		this.avatarManager = avatarManger;
		this.dataSource = dataSource;
		this.extensionState = extensionState;
		this.logger = logger;
		this.repoManager = repoManager;
		this.repositoryTreeView = repositoryTreeView;
		this.workingRepositoryTreeView = workingRepositoryTreeView;
		this.gitExecutable = gitExecutable;

		this.registerCommand('git-graph.view', (arg) => this.view(arg));
		this.registerCommand('git-graph.addGitRepository', () => this.addGitRepository());
		this.registerCommand('git-graph.removeGitRepository', () => this.removeGitRepository());
		this.registerCommand('git-graph.removeGitSpecificRepository', (arg) => this.removeGitSpecificRepository(arg));
		this.registerCommand('git-graph.clearAvatarCache', () => this.clearAvatarCache());
		this.registerCommand('git-graph.fetch', () => this.fetch());
		this.registerCommand('git-graph.endAllWorkspaceCodeReviews', () => this.endAllWorkspaceCodeReviews());
		this.registerCommand('git-graph.endSpecificWorkspaceCodeReview', () => this.endSpecificWorkspaceCodeReview());
		this.registerCommand('git-graph.resumeWorkspaceCodeReview', () => this.resumeWorkspaceCodeReview());
		this.registerCommand('git-graph.version', () => this.version());

		this.registerCommand('git-graph.repository.refresh', () => this.repositoryRefresh());
		this.registerCommand('git-graph.repository.selectRepository', (arg) => this.repositorySelectRepository(arg));
		this.registerCommand('git-graph.workspace.changeRepository', (arg) => this.workspaceChangeRepository(arg));
		this.registerCommand('git-graph.workspace.openFile', (resource) => this.openResource(resource));
		this.registerCommand('git-graph.workspace.historyFile', (resource) => this.historyFile(resource));
		this.registerCommand('git-graph.workspace.openInTerminal', (resource) => this.workspaceOpenInTerminal(resource));
		this.registerCommand('git-graph.repository.openInTerminal', (resource) => this.repositoryOpenInTerminal(resource));

		this.registerDisposable(
			onDidChangeGitExecutable((gitExecutable) => {
				this.gitExecutable = gitExecutable;
			})
		);
	}

	/**
	 * Register a Git Graph command with Visual Studio Code.
	 * @param command A unique identifier for the command.
	 * @param callback A command handler function.
	 */
	private registerCommand(command: string, callback: (...args: any[]) => any) {
		this.registerDisposable(
			vscode.commands.registerCommand(command, callback)
		);
	}


	/* Commands */

	/**
	 * The method run when the `git-graph.view` command is invoked.
	 * @param arg An optional argument passed to the command (when invoked from the Visual Studio Code Git Extension).
	 */
	private async view(arg: any) {
		let loadRepo: string | null = null;

		if (typeof arg === 'object' && arg.rootUri) {
			// If command is run from the Visual Studio Code Source Control View, load the specific repo
			const repoPath = getPathFromUri(arg.rootUri);
			loadRepo = await this.repoManager.getKnownRepo(repoPath);
			if (loadRepo === null) {
				// The repo is not currently known, add it
				loadRepo = (await this.repoManager.registerRepo(await resolveToSymbolicPath(repoPath), true)).root;
			}
		} else if (getConfig().openToTheRepoOfTheActiveTextEditorDocument && vscode.window.activeTextEditor) {
			// If the config setting is enabled, load the repo containing the active text editor document
			loadRepo = this.repoManager.getRepoContainingFile(getPathFromUri(vscode.window.activeTextEditor.document.uri));
		}

		GitGraphView.createOrShow(this.context.extensionPath, this.dataSource, this.extensionState, this.avatarManager, this.repoManager, this.logger, loadRepo !== null ? { repo: loadRepo } : null);
	}

	/**
	 * The method run when the `git-graph.addGitRepository` command is invoked.
	 */
	private addGitRepository() {
		if (this.gitExecutable === null) {
			showErrorMessage(UNABLE_TO_FIND_GIT_MSG);
			return;
		}

		vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false }).then(uris => {
			if (uris && uris.length > 0) {
				let path = getPathFromUri(uris[0]);

				this.repoManager.registerRepo(path, false).then(status => {
					if (status.error === null) {
						showInformationMessage('The repository "' + status.root! + '" was added to Git Graph.');
					} else {
						showErrorMessage(status.error + ' Therefore it could not be added to Git Graph.');
					}
				});
			}
		}, () => { });
	}

	/**
	 * The method run when the `git-graph.removeGitRepository` command is invoked.
	 */
	private removeGitRepository() {
		if (this.gitExecutable === null) {
			showErrorMessage(UNABLE_TO_FIND_GIT_MSG);
			return;
		}

		const repos = this.repoManager.getRepos();
		const items: vscode.QuickPickItem[] = Object.keys(repos).map((path) => ({
			label: repos[path].name || getRepoName(path),
			description: path
		}));

		vscode.window.showQuickPick(items, {
			placeHolder: 'Select a repository to remove from Git Graph:',
			canPickMany: false
		}).then((item) => {
			if (item && item.description !== undefined) {
				if (this.repoManager.ignoreRepo(item.description)) {
					showInformationMessage('The repository "' + item.label + '" was removed from Git Graph.');
				} else {
					showErrorMessage('The repository "' + item.label + '" is not known to Git Graph.');
				}
			}
		}, () => { });
	}

	
	/**
	 * The method run when the `git-graph.removeGitSpecificRepository` command is invoked.
	 */
	 private removeGitSpecificRepository(arg: any) {
		if (typeof arg === 'object' && arg.repository) {
			if (this.repoManager.ignoreRepo(arg.repository)) {
				showInformationMessage('The repository "' + arg.label + '" was removed from Git Graph.');
			} else {
				showErrorMessage('The repository "' + arg.label + '" is not known to Git Graph.');
			}
		}
	}

	/**
	 * The method run when the `git-graph.clearAvatarCache` command is invoked.
	 */
	private clearAvatarCache() {
		this.avatarManager.clearCache();
	}

	/**
	 * The method run when the `git-graph.fetch` command is invoked.
	 */
	private fetch() {
		const repos = this.repoManager.getRepos();
		const repoPaths = Object.keys(repos);
 
		if (repoPaths.length > 1) {
			const items: vscode.QuickPickItem[] = repoPaths.map((path) => ({
				label: repos[path].name || getRepoName(path),
				description: path
			}));

			const lastActiveRepo = this.extensionState.getLastActiveRepo();
			if (lastActiveRepo !== null) {
				let lastActiveRepoIndex = items.findIndex((item) => item.description === lastActiveRepo);
				if (lastActiveRepoIndex > -1) {
					const item = items.splice(lastActiveRepoIndex, 1)[0];
					items.unshift(item);
				}
			}

			vscode.window.showQuickPick(items, {
				placeHolder: 'Select the repository you want to open in Git Graph, and fetch from remote(s):',
				canPickMany: false
			}).then((item) => {
				if (item && item.description) {
					GitGraphView.createOrShow(this.context.extensionPath, this.dataSource, this.extensionState, this.avatarManager, this.repoManager, this.logger, {
						repo: item.description,
						runCommandOnLoad: 'fetch'
					});
				}
			}, () => {
				showErrorMessage('An unexpected error occurred while running the command "Fetch from Remote(s)".');
			});
		} else if (repoPaths.length === 1) {
			GitGraphView.createOrShow(this.context.extensionPath, this.dataSource, this.extensionState, this.avatarManager, this.repoManager, this.logger, {
				repo: repoPaths[0],
				runCommandOnLoad: 'fetch'
			});
		} else {
			GitGraphView.createOrShow(this.context.extensionPath, this.dataSource, this.extensionState, this.avatarManager, this.repoManager, this.logger, null);
		}
	}

	/**
	 * The method run when the `git-graph.endAllWorkspaceCodeReviews` command is invoked.
	 */
	private endAllWorkspaceCodeReviews() {
		this.extensionState.endAllWorkspaceCodeReviews();
		showInformationMessage('Ended All Code Reviews in Workspace');
	}

	/**
	 * The method run when the `git-graph.endSpecificWorkspaceCodeReview` command is invoked.
	 */
	private endSpecificWorkspaceCodeReview() {
		const codeReviews = this.extensionState.getCodeReviews();
		if (Object.keys(codeReviews).length === 0) {
			showErrorMessage('There are no Code Reviews in progress within the current workspace.');
			return;
		}

		vscode.window.showQuickPick(this.getCodeReviewQuickPickItems(codeReviews), {
			placeHolder: 'Select the Code Review you want to end:',
			canPickMany: false
		}).then((item) => {
			if (item) {
				this.extensionState.endCodeReview(item.codeReviewRepo, item.codeReviewId).then((errorInfo) => {
					if (errorInfo === null) {
						showInformationMessage('Successfully ended Code Review "' + item.label + '".');
					} else {
						showErrorMessage(errorInfo);
					}
				}, () => { });
			}
		}, () => {
			showErrorMessage('An unexpected error occurred while running the command "End a specific Code Review in Workspace...".');
		});
	}

	/**
	 * The method run when the `git-graph.resumeWorkspaceCodeReview` command is invoked.
	 */
	private resumeWorkspaceCodeReview() {
		const codeReviews = this.extensionState.getCodeReviews();
		if (Object.keys(codeReviews).length === 0) {
			showErrorMessage('There are no Code Reviews in progress within the current workspace.');
			return;
		}

		vscode.window.showQuickPick(this.getCodeReviewQuickPickItems(codeReviews), {
			placeHolder: 'Select the Code Review you want to resume:',
			canPickMany: false
		}).then((item) => {
			if (item) {
				const commitHashes = item.codeReviewId.split('-');
				GitGraphView.createOrShow(this.context.extensionPath, this.dataSource, this.extensionState, this.avatarManager, this.repoManager, this.logger, {
					repo: item.codeReviewRepo,
					commitDetails: {
						commitHash: commitHashes[commitHashes.length > 1 ? 1 : 0],
						compareWithHash: commitHashes.length > 1 ? commitHashes[0] : null
					}
				});
			}
		}, () => {
			showErrorMessage('An unexpected error occurred while running the command "Resume a specific Code Review in Workspace...".');
		});
	}

	/**
	 * The method run when the `git-graph.version` command is invoked.
	 */
	private async version() {
		try {
			const gitGraphVersion = await getExtensionVersion(this.context);
			const information = 'Git Graph: ' + gitGraphVersion + '\nVisual Studio Code: ' + vscode.version + '\nOS: ' + os.type() + ' ' + os.arch() + ' ' + os.release() + '\nGit: ' + (this.gitExecutable !== null ? this.gitExecutable.version : '(none)');
			vscode.window.showInformationMessage(information, { modal: true }, 'Copy').then((selectedItem) => {
				if (selectedItem === 'Copy') {
					copyToClipboard(information).then((result) => {
						if (result !== null) {
							showErrorMessage(result);
						}
					});
				}
			}, () => { });
		} catch (_) {
			showErrorMessage('An unexpected error occurred while retrieving version information.');
		}
	}

	/**
	 * 
	 * @param codeReviews 
	 * @returns 
	 */
	private async repositoryRefresh() {
		this.repositoryTreeView.refresh();
	}

	/**
	 * Update repositories side bar when user change repository in Git Graph View
	 * @param codeReviews 
	 * @returns 
	 */
	 private async repositorySelectRepository(arg: any) {
		if (typeof arg === 'object' && arg.repo) {
			this.repositoryTreeView.setSelectedItem(arg.repo);
		}
	}

	/**
	 * 
	 * @param codeReviews 
	 * @returns 
	 */
	private async workspaceChangeRepository(arg: any) {
		if (typeof arg === 'object' && arg.repo) {
			this.workingRepositoryTreeView.changeRepository(arg.repo);
		}
	}

	private openResource(resource: any): void {
		vscode.window.showTextDocument(resource);
	}
	
	private historyFile(resource: any): void {
		FileHistoryProvider.openHistoryFile(resource);
	}

	private workspaceOpenInTerminal(resource: any): void {
		if (typeof resource === 'object') {
			let resourceUri: vscode.Uri = resource.resourceUri;
			this.openInTerminal(resourceUri);
		}
	}

	private repositoryOpenInTerminal(resource: any): void {
		if (typeof resource === 'object') {
			let repo: string = resource.getRepositoty();
			let resourceUri: vscode.Uri = vscode.Uri.file(repo);
			this.openInTerminal(resourceUri);
		}
	}

	private async openInTerminal(resourceUri: vscode.Uri): Promise<void> {
		let path = resourceUri.fsPath;
		if (!fs.lstatSync(resourceUri.fsPath).isDirectory()) {
			path = dirname(resourceUri.fsPath);
		}
		let terminal = vscode.window.createTerminal({			
			cwd: path
		});
		terminal.show(false);
	}

	/* Helper Methods */

	/**
	 * Transform a set of Code Reviews into a list of Quick Pick items for use with `vscode.window.showQuickPick`.
	 * @param codeReviews A set of Code Reviews.
	 * @returns A list of Quick Pick items.
	 */
	private getCodeReviewQuickPickItems(codeReviews: CodeReviews): Promise<CodeReviewQuickPickItem[]> {
		const repos = this.repoManager.getRepos();
		const enrichedCodeReviews: { repo: string, id: string, review: CodeReviewData, fromCommitHash: string, toCommitHash: string }[] = [];
		const fetchCommits: { repo: string, commitHash: string }[] = [];

		Object.keys(codeReviews).forEach((repo) => {
			if (typeof repos[repo] === 'undefined') return;
			Object.keys(codeReviews[repo]).forEach((id) => {
				const commitHashes = id.split('-');
				commitHashes.forEach((commitHash) => fetchCommits.push({ repo: repo, commitHash: commitHash }));
				enrichedCodeReviews.push({
					repo: repo, id: id, review: codeReviews[repo][id],
					fromCommitHash: commitHashes[0], toCommitHash: commitHashes[commitHashes.length > 1 ? 1 : 0]
				});
			});
		});

		return Promise.all(fetchCommits.map((fetch) => this.dataSource.getCommitSubject(fetch.repo, fetch.commitHash))).then(
			(subjects) => {
				const commitSubjects: { [repo: string]: { [commitHash: string]: string } } = {};
				subjects.forEach((subject, i) => {
					if (typeof commitSubjects[fetchCommits[i].repo] === 'undefined') {
						commitSubjects[fetchCommits[i].repo] = {};
					}
					commitSubjects[fetchCommits[i].repo][fetchCommits[i].commitHash] = subject !== null ? subject : '<Unknown Commit Subject>';
				});

				return enrichedCodeReviews.sort((a, b) => b.review.lastActive - a.review.lastActive).map((codeReview) => {
					const fromSubject = commitSubjects[codeReview.repo][codeReview.fromCommitHash];
					const toSubject = commitSubjects[codeReview.repo][codeReview.toCommitHash];
					const isComparison = codeReview.fromCommitHash !== codeReview.toCommitHash;
					return {
						codeReviewRepo: codeReview.repo,
						codeReviewId: codeReview.id,
						label: (repos[codeReview.repo].name || getRepoName(codeReview.repo)) + ': ' + abbrevCommit(codeReview.fromCommitHash) + (isComparison ? ' ↔ ' + abbrevCommit(codeReview.toCommitHash) : ''),
						description: getRelativeTimeDiff(Math.round(codeReview.review.lastActive / 1000)),
						detail: isComparison
							? abbrevText(fromSubject, 50) + ' ↔ ' + abbrevText(toSubject, 50)
							: fromSubject
					};
				});
			}
		);
	}
}

interface CodeReviewQuickPickItem extends vscode.QuickPickItem {
	codeReviewRepo: string;
	codeReviewId: string;
}
