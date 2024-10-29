// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as lc from "./launchConfig";
import * as path from 'path';

function getDocumentWorkspaceFolder(): string | undefined {
	const fileName = vscode.window.activeTextEditor?.document.fileName;
	return vscode.workspace.workspaceFolders
	  ?.map((folder) => folder.uri.fsPath)
	  .filter((fsPath) => fileName?.startsWith(fsPath))[0];
  }

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "bc-deployer" is now active!');

	const disposable = vscode.commands.registerCommand('bc-deployer.deploy', async () => {

		vscode.window.showInformationMessage('Reading launch.json');
		let launchFileName = getDocumentWorkspaceFolder() ?? "";
		launchFileName = path.join(launchFileName, '.vscode/launch.json');
		let launch = new lc.LaunchFile(JSON.parse(fs.readFileSync(launchFileName, 'utf8')));
		let configs = launch.configurations;
		vscode.window.showInformationMessage(`Found ${configs.length} Configurations`);
		
		const configItems = configs.map(config => {
			return {
				id: config.name,
				label: config.name
			};
		});
		var result = await vscode.window.showQuickPick(configItems);
		if (result === undefined) {
			vscode.window.showInformationMessage('Selection Cancelled');
		} else {
			vscode.window.showInformationMessage(`Selected ${result?.label}`);
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
