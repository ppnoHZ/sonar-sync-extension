# Sonar Sync Extension Development Instructions

Guidelines for developing and maintaining the Sonar Sync VS Code extension.

## Architecture & Data Flow

- **[src/extension.ts](src/extension.ts)**: Extension entry point. Handles activation, command registration, and orchestrates `SonarClient` and `DiagnosticManager`.
- **[src/sonarClient.ts](src/sonarClient.ts)**: Service for communicating with the SonarQube/SonarCloud API. Uses `axios` for requests.
- **[src/diagnosticManager.ts](src/diagnosticManager.ts)**: Manages `vscode.DiagnosticCollection`. Translates `Issue` objects into `vscode.Diagnostic` items.
- **[src/types.ts](src/types.ts)**: Centralized TypeScript interfaces for API responses and configuration.

## Key Patterns

### Configuration Access
Use the `getSonarConfig()` helper in `[src/config.ts](src/config.ts)`. It supports reading from:
1. A workspace-local `sonar.json` file (preferred for separation and security).
2. VS Code settings under the `sonar` prefix.

```typescript
const config = getSonarConfig();
const host = config.host;
```

### Diagnostic Mapping
Always use `DiagnosticManager.getSeverity()` to map Sonar severities to VS Code severities:
- `BLOCKER`, `CRITICAL` -> `Error`
- `MAJOR` -> `Warning`
- `MINOR` -> `Information`
- `INFO` -> `Hint`

### API Communication
- Use `axios` (defined in `package.json`) instead of `fetch`.
- Endpoint for issues: `${host}api/issues/search?componentKeys=${projectKey}`.
- Authorization header format: `Authorization: Bearer ${token}`.

## Common Pitfalls to Watch For

- **Issue Line Mapping**: Sonar issues typically provide a single `line` property. In `DiagnosticManager`, ensure ranges are created carefully. Currently, the code expects `startLine`/`endLine` which might not match the `Issue` interface in `types.ts`.
- **Named vs Default Exports**: Ensure consistency. `SonarClient` is currently exported as `default`, but imported as a named import in `extension.ts`. Prefer named exports for all services.
- **Constructor Arguments**: `SonarClient` requires `host`, `token`, and `projectKey` in its constructor. Ensure `extension.ts` passes these from the configuration.
- **Command IDs**: Ensure consistency between `package.json` (`sonarSync.start`) and `src/extension.ts` (`sonarSync.fetchIssues`).

## Developer Workflows

- **Compile**: `npm run compile`
- **Watch/Dev**: `npm run watch` (run this in a terminal while developing)
- **Debugging**: Use the "Run Extension" launch configuration (standard for VS Code extensions).
