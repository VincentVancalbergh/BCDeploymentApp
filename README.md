# bc-deployer README

This is the README for extension "bc-deployer". It is intended to help deploy BC Extensions in ways the AL Extensions (and current extensions on the Marketplace) are missing.
It uses the [Microsoft Business Central Administration API](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/administration-center-api) and [Microsoft Business Central Automation API](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/itpro-introduction-to-automation-apis).

## Features

- Upload as a PTE extension to an environment in the launch.json file. Including Production (use with caution).
- Authenticates using the OAuth2 Device Authorization Flow See [Alex Bilbie Blog](https://alexbilbie.github.io/2016/04/oauth-2-device-flow-grant/) and [Microsoft Learn Page](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code) or the [Client Credentials Flow](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/administration-center-api#calling--api-oauth2flows) if set up.
- Possibility to upload to a different environment on the same tenant (-> so you don't have to add every environment for a tenant).
- With version check: Ask to increase version number if same is already deployed -> increases version in app.json and rebuilds project before upload.
- Check and update dependencies if given path to .app files. Update to required version or to most recent version.

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
