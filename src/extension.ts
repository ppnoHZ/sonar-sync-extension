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

  const syncIssues = async (page: number = 1) => {
    Logger.log(`Syncing issues for page ${page}...`)
    statusBarItem.text = `$(sync~spin) Sonar: Syncing (Page ${page})...`
    statusBarItem.show()

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Sonar Sync',
        cancellable: false
      },
      async (progress) => {
        progress.report({ message: `Fetching issues from SonarQube (Page ${page})...` })
        try {
          const config = getSonarConfig()
          const sonarClient = new SonarClient(
            config.host,
            config.token,
            config.projectKey,
            config.cookie,
            config.queryParams
          )
          const response = await sonarClient.fetchIssues(page)
          const issues = response.issues
          Logger.log(`Successfully fetched ${issues.length} issues (Total: ${response.paging.total})`)

          diagnosticManager.updateDiagnostics(issues)
          issueTreeViewProvider.refresh(issues, response.paging, response.branch)

          statusBarItem.text = `$(bug) Sonar: ${response.paging.total}`
          vscode.window.showInformationMessage(
            `Sonar Sync: Found ${response.paging.total} issues. Showing page ${page}.`
          )
        } catch (error) {
          Logger.error('Failed to fetch sonar issues', error)
          statusBarItem.text = '$(error) Sonar: Sync Error'
          vscode.window.showErrorMessage(`Sonar Sync failed: ${error}`)
        }
      }
    )
  }

  const fetchIssuesCommand = vscode.commands.registerCommand(
    'sonarSync.start',
    () => syncIssues(1)
  )

  const nextPageCommand = vscode.commands.registerCommand(
    'sonarSync.nextPage',
    () => {
      const paging = issueTreeViewProvider.getPaging()
      const totalPages = Math.ceil(paging.total / paging.pageSize)
      if (paging.pageIndex < totalPages) {
        syncIssues(paging.pageIndex + 1)
      } else {
        vscode.window.showInformationMessage('Already on the last page.')
      }
    }
  )

  const prevPageCommand = vscode.commands.registerCommand(
    'sonarSync.prevPage',
    () => {
      const paging = issueTreeViewProvider.getPaging()
      if (paging.pageIndex > 1) {
        syncIssues(paging.pageIndex - 1)
      } else {
        vscode.window.showInformationMessage('Already on the first page.')
      }
    }
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

  context.subscriptions.push(
    fetchIssuesCommand,
    nextPageCommand,
    prevPageCommand,
    toggleGroupingCommand
  )

  // Auto-sync on configuration change
  const configChangeListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('sonar')) {
      Logger.log('Configuration changed, re-syncing...')
      syncIssues(1)
    }
  })
  context.subscriptions.push(configChangeListener)

  // Auto-sync on activation (panel open)
  syncIssues()
}

export function deactivate() {}
