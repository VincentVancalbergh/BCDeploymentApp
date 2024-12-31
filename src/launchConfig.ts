import { QuickPickItem } from "vscode";

export class LaunchConfig {
    name: string = '';
    request: string = '';
    type: string = '';
    environmentType: string = '';
    environmentName: string = '';
    tenant: string = '';
    launchBrowser: boolean = false;
    schemaUpdateMode: string = '';
    accessToken: string = '';
    expiresOn: Date | undefined = undefined;
    authenticatedAs: string = '';

    constructor(json:any) {
        this.name = json.name;
        this.request = json.request;
        this.type = json.type;
        this.environmentType = json.environmentType;
        this.environmentName = json.environmentName;
        this.tenant = json.tenant;
        this.launchBrowser = json.launchBrowser;
        this.schemaUpdateMode = json.schemaUpdateMode;
    }

    toQuickPick(): QuickPickItem {
        return { label: this.name };
    }
}

export class LaunchFile {
    version: string = '';
    configurations: LaunchConfig[] = <LaunchConfig[]>{};

    constructor(json:any) {
        this.version = json.version;
        var configs:any[] = json.configurations;
        this.configurations = configs.map(config => new LaunchConfig(config));
    }
}