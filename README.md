# Sonar Sync Extension

This Visual Studio Code extension synchronizes issues from the SonarQube service to the Problems panel, providing developers with real-time feedback on code quality.

## Features

- Fetches issues from the SonarQube API.
- Displays issues in the Problems panel of VS Code.
- Automatically synchronizes issues at specified intervals.

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd sonar-sync-extension
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Open the project in Visual Studio Code.

## Development Notes

- **Important**: You must use `npm` to install dependencies. Using other package managers like `pnpm` or `yarn` may cause errors when packaging the extension with `vsce`.

## Configuration

The extension supports two ways to configure the SonarQube settings. It will prioritize the `sonar.json` file if it exists in the workspace root.

### Method 1: Workspace Settings (Recommended)

Add the following to your VS Code `settings.json`:

```json
{
    "sonar.host": "https://sonar.example.com/",
    "sonar.token": "your-sonar-token",
    "sonar.projectKey": "your-project-key",
    "sonar.cookie": ""
}
```

### Method 2: Local `sonar.json` File

Create a file named `sonar.json` in your workspace root directory with the following content:

```json
{
  "host": "https://sonar.example.com/",
  "token": "your-sonar-token",
  "projectKey": "your-project-key",
  "cookie": ""
}
```

## Usage

- After installation, the extension will automatically start synchronizing issues from SonarQube.
- You can view the issues in the Problems panel.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.