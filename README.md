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

## Configuration

Before using the extension, configure the SonarQube connection settings in your `settings.json`:

```json
{
    "sonar.host": "https://sonar.xpaas.lenovo.com/sonar/",
    "sonar.token": "your-sonar-token",
    "sonar.projectKey": "gitlab-47218"
}
```

Replace `your-sonar-token` with your actual SonarQube token.

## Usage

- After installation, the extension will automatically start synchronizing issues from SonarQube.
- You can view the issues in the Problems panel.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.