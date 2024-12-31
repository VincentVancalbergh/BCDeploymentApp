// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as lc from "./launchConfig";
import * as msal from "@azure/msal-node";
import axios from 'axios';

function getDocumentWorkspaceFolder(): string | undefined {
	const fileName = vscode.window.activeTextEditor?.document.fileName;
	return vscode.workspace.workspaceFolders
	  ?.map((folder) => folder.uri.fsPath)
	  .filter((fsPath) => fileName?.startsWith(fsPath))[0];
  }

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let launchConfigs: lc.LaunchConfig[];
	let storedLaunchConfigs = context.globalState.get<lc.LaunchConfig[]>('launchConfigs');
	if (storedLaunchConfigs !== undefined) {
		launchConfigs = storedLaunchConfigs as lc.LaunchConfig[];
	} else { 
		launchConfigs = [];
	}
	
	let outputch = vscode.window.createOutputChannel("BC Deployer");
	outputch.appendLine('Extension "bc-deployer" is now active');

	const clearStateDisposable = vscode.commands.registerCommand('bc-deployer.clearState', async () => {
		outputch.show();
		launchConfigs = [];
		context.globalState.update('launchConfigs', launchConfigs);
		outputch.appendLine('LaunchConfigs cleared');
	});

	const deployDisposable = vscode.commands.registerCommand('bc-deployer.deploy', async () => {
		//outputch.show(); Don't show here so it doesn't compete with the environment QuickPick

		//Reading the launch.json file
		outputch.appendLine('Reading Configurations from launch.json');
		const config = vscode.workspace.getConfiguration('launch');
		const configurations = config.get<any[]>("configurations") as any[];
		outputch.appendLine(`Found ${configurations.length} Configurations`);
		
		//Asking user which environment to connect to
		let result = await vscode.window.showQuickPick(
			configurations.map(config => {
				return {
					id: config.name,
					label: config.name
				};
			})
		);
		if (result === undefined) {
			outputch.appendLine('Selection Cancelled');
			return;
		}
		outputch.show();
		let selectedConfigName = result?.label;
		outputch.appendLine(`Selected ${selectedConfigName}`);
		let selectedConfig = configurations.find(cf => cf.name === selectedConfigName);

		//Check if we already have a valid access token for that environment
		let launchConfig = launchConfigs.find((lc) => lc.name === selectedConfig.name);
		if (launchConfig === undefined) {
			launchConfig = new lc.LaunchConfig(selectedConfig);
			launchConfigs.push(launchConfig);
		}
		let doAuthFlow = false;
		if (launchConfig.accessToken === '') {
			outputch.appendLine(`No Access Token for ${selectedConfig.name}`);
			doAuthFlow = true;
		} else if (launchConfig.expiresOn === undefined) {
			outputch.appendLine(`No Expiration Date on Access Token for ${selectedConfig.name}`);
			doAuthFlow = true;
		} else {
			let currentTimePlus1Min = new Date(new Date().getTime() + (60 * 1000)); //We want to refresh 1 minute before expiration
			if (launchConfig.expiresOn <= currentTimePlus1Min) {
				outputch.appendLine(`Token for ${selectedConfig.name} expired on ${launchConfig.expiresOn}`);
				doAuthFlow = true;
			}
		}

		// if (doAuthFlow) {
		// 	const maybeSession = await vscode.authentication.getSession('microsoft', [
		// 		"VSCODE_CLIENT_ID:4ebb6dbd-329d-4fa3-b7ea-fd3f607dc78c",
		// 		`VSCODE_TENANT:${launchConfig.tenant}`,
		// 		"offline_access",
		// 		"api://bc-deployer/BC.Access"
		// 		//"Automation.ReadWrite.All"
		// 	], { createIfNone: true });
		// 	if (maybeSession !== undefined) {
		// 		const session = maybeSession as vscode.AuthenticationSession;
		// 		outputch.appendLine(`Authenticated as ${session.account.label}`);
		// 		launchConfig.accessToken = session.accessToken;
		// 		launchConfig.authenticatedAs = session.account.label;
		// 		launchConfig.expiresOn = undefined;
		// 		context.globalState.update('launchConfigs', launchConfigs); //Store it in the global state
		// 		doAuthFlow = false;
		// 	}
		// }

		if (doAuthFlow) {
			const clientConfig = {
				auth: {
					clientId: "4ebb6dbd-329d-4fa3-b7ea-fd3f607dc78c", //Our Application Client ID set up in Entra
					//authority: "https://login.microsoftonline.com/common/",
					authority: `https://login.microsoftonline.com/${launchConfig.tenant}`
				},
			};
			const pca = new msal.PublicClientApplication(clientConfig);
			if (doAuthFlow)
			{
				//Do the Interactive Auth Flow
				const cryptoProvider = new msal.CryptoProvider();
				const {verifier, challenge} = await cryptoProvider.generatePkceCodes();
				const authCodeUrlParameters = {
					scopes: ["https://api.businesscentral.dynamics.com/.default"],
					redirectUri: "https://vscode.dev/redirect",
					codeChallenge: challenge, // PKCE code challenge
					codeChallengeMethod: "S256" // PKCE code challenge method 
				};
				var authUrl = await pca.getAuthCodeUrl(authCodeUrlParameters)
				.catch((error: any) => {
					outputch.appendLine('Error Authenticating Interactively:');
					vscode.window.showInformationMessage('Error Authenticating Interactively');
					outputch.appendLine(error);
				});
				if (authUrl === undefined)
				{
					return;
				}
				//Launch browser, get authorization code
				vscode.env.openExternal(vscode.Uri.parse(authUrl));
				
				var iResponseObj = JSON.parse(authUrl as string);
				const tokenRequest = {
					code: iResponseObj.authorization_code,
					codeVerifier: verifier, // PKCE code verifier 
					redirectUri: "http://localhost",
					scopes: ["AdminCenter.ReadWrite.All", "Automation.ReadWrite.All"]
				};
				var tresponse = await pca.acquireTokenByCode(tokenRequest)
				.catch((error: any) => {
					outputch.appendLine('Error Authenticating Interactively:');
					vscode.window.showInformationMessage('Error Authenticating Interactively');
					outputch.appendLine(error);
				});
				if (tresponse !== undefined)
				{
					const authResult = tresponse as msal.AuthenticationResult;
					outputch.appendLine(`Authenticated as ${authResult.account?.username}, token expires on ${authResult.expiresOn}`);
					launchConfig.accessToken = authResult.accessToken;
					launchConfig.authenticatedAs = authResult.account?.username ?? '';
					launchConfig.expiresOn = authResult.expiresOn ?? undefined;
					context.globalState.update('launchConfigs', launchConfigs); //Store it in the global state
					doAuthFlow = false;
				}
			}
			if (doAuthFlow) {
				//Do the Device Auth Flow
				const deviceCodeRequest: msal.DeviceCodeRequest = {
					"scopes": [
						//"User.Read", //Allows reading of the user's basic information
						//"api://bc-deployer/BC.Access",
						"https://api.businesscentral.dynamics.com/.default"
						//"https://dynamics.microsoft.com/business-central/overview/AdminCenter.ReadWrite.All", //Allows access to the Business Central Administration API
						//"https://dynamics.microsoft.com/business-central/overview/Automation.ReadWrite.All" //Allows access to the Business Central Automation API
					],
					deviceCodeCallback: (response) => {
						if (response === undefined) {
							outputch.appendLine('Authentication Instructions undefined');
						} else if (response.message === undefined) {
							outputch.appendLine('Authentication Instructions Message undefined');
						} else {
							outputch.appendLine('Authentication Instructions:');
							outputch.appendLine(response.message); //This is an action the user needs to take
						}
					}
				};
				let authResponse = await pca.acquireTokenByDeviceCode(deviceCodeRequest)
				.catch((error: any) => {
					outputch.appendLine('Error Authenticating:');
					vscode.window.showInformationMessage('Error Authenticating');
					outputch.appendLine(error);
				});
				if (authResponse === undefined) {
					return;
				}
				const authResult = authResponse as msal.AuthenticationResult;
				outputch.appendLine(`Authenticated as ${authResult.account?.username}, token expires on ${authResult.expiresOn}`);
				launchConfig.accessToken = authResult.accessToken;
				launchConfig.authenticatedAs = authResult.account?.username ?? '';
				launchConfig.expiresOn = authResult.expiresOn ?? undefined;
				context.globalState.update('launchConfigs', launchConfigs); //Store it in the global state
				doAuthFlow = false;
			}
			else
			{
				outputch.appendLine(`Using existing authentication as ${launchConfig.authenticatedAs}, token expires on ${launchConfig.expiresOn}`);
			}
		}

		//Read the environments from the selected environment
		//let envUrl = `https://api.businesscentral.dynamics.com/v2.0/${launchConfig.environmentName}/api/microsoft/automation/v2.0/companies`;
		let envUrl = `https://api.businesscentral.dynamics.com/admin/v2.21/applications/environments`;
		axios.get(
			envUrl,
			{
				headers: { 'Authorization': `Bearer ${launchConfig.accessToken}`, 'Content-Type': 'application/json' }
			}
		)
		.then((res) =>
			outputch.appendLine(JSON.stringify(res))
		)
		.catch((error: any) => {
			vscode.window.showInformationMessage('Error getting environments');
			outputch.appendLine('Error getting environments:');
			outputch.appendLine(`${error.code}: ${error.message}`);
		});
		//if (environments === undefined) {
		//	return;
		//}
		//outputch.appendLine(JSON.stringify(environments));
	});

	context.subscriptions.push(deployDisposable);
	context.subscriptions.push(clearStateDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
