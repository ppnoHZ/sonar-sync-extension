import * as vscode from 'vscode'
import { SonarClient } from './sonarClient'
import { DiagnosticManager } from './diagnosticManager'
import { getSonarConfig } from './config'
import { Logger } from './logger'
import { SonarIssueTreeDataProvider } from './issueTreeView'

export function activate(context: vscode.ExtensionContext) {
  Logger.init()
  Logger.log('Sonar Sync Extension is now active!')

  const config = getSonarConfig()
  Logger.log(
    `Loaded config: host=${config.host}, projectKey=${config.projectKey}`
  )

  const sonarClient = new SonarClient(
    config.host,
    config.token,
    config.projectKey,
    config.cookie
  )
  const diagnosticManager = new DiagnosticManager()
  const issueTreeViewProvider = new SonarIssueTreeDataProvider()

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  )
  statusBarItem.command = 'sonarSync.start'
  statusBarItem.tooltip = 'Click to sync Sonar issues'
  context.subscriptions.push(statusBarItem)

  vscode.window.registerTreeDataProvider(
    'sonarIssuesByAuthor',
    issueTreeViewProvider
  )

  const syncIssues = async () => {
    Logger.log('Syncing issues...')
    statusBarItem.text = '$(sync~spin) Sonar: Syncing...'
    statusBarItem.show()

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Sonar Sync",
        cancellable: false
      },
      async (progress) => {
        progress.report({ message: "Fetching issues from SonarQube..." });
        try {
          const issues = await sonarClient.fetchIssues()
          Logger.log(`Successfully fetched ${issues.length} issues`)
          
          diagnosticManager.updateDiagnostics(issues)
          issueTreeViewProvider.refresh(issues)
          
          statusBarItem.text = `$(bug) Sonar: ${issues.length}`
          vscode.window.showInformationMessage(`Sonar Sync: Found ${issues.length} issues.`)
        } catch (error) {
          Logger.error('Failed to fetch sonar issues', error)
          statusBarItem.text = '$(error) Sonar: Sync Error'
          vscode.window.showErrorMessage(`Sonar Sync failed: ${error}`)
        }
      }
    );
  }

  const fetchIssuesCommand = vscode.commands.registerCommand(
    'sonarSync.start',
    syncIssues
  )

  const toggleGroupingCommand = vscode.commands.registerCommand(
    'sonarSync.toggleGrouping',
    () => {
      const currentMode = issueTreeViewProvider.getGroupingMode()
      const newMode = currentMode === 'author' ? 'file' : 'author'
      issueTreeViewProvider.setGroupingMode(newMode)
      Logger.log(`Switching grouping mode to: ${newMode}`)
    }
  )

  context.subscriptions.push(fetchIssuesCommand, toggleGroupingCommand)

  // Auto-sync on activation (panel open)
  syncIssues()
}

export function deactivate() {}
