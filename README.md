# RSS Checker GitHub Action

## Overview

The RSS Checker GitHub Action is a reusable action designed to monitor a list of RSS feeds. It
checks for new articles, updates a JSON file with the latest published dates, and commits changes to
the repository if new articles are found. Additionally, it sets the GitHub Actions job to fail with
a summary of new articles detected.

## Usage

### Inputs

- `rss-feeds`: **Required**. A comma-separated list of RSS feed URLs to monitor.
- `commit-directory`: **Optional**. Directory to commit the `lastPublished.json` file. Defaults to the root of the repository.
- `commit-message`: **Optional**. Commit message for the update. Defaults to `🤖 Update lastPublished.json`.
- `debug`: **Optional**. Enable debug logging. Default is `false`.

### Example Workflow

Create a workflow file (e.g., `.github/workflows/rss-monitor.yml`) in your repository to use the custom action:

```yaml
name: RSS Feed Monitor

on:
  schedule:
    - cron: '*/45 * * * *'  # Run every 45 minutes
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Run RSS-checker
        uses: robdel12/rss-checker@v1.0.0
        with:
          rss-feeds: |
            https://example.com/rss-feed1
            https://example.com/rss-feed2
            https://example.com/rss-feed3
            https://example.com/rss-feed4
          commit-directory: custom/dir
          commit-message: Custom commit message
          debug: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

```

### Notes

1. **Permissions**: Ensure your workflow has the required permissions to create and manage GitHub
   Actions in your repository.
2. **GitHub Token**: The `GITHUB_TOKEN` secret is automatically provided by GitHub Actions, but you
   must explicitly pass it in the `env` section.

### Outputs

This action does not have any direct outputs. It commits changes to the `lastPublished.json` file in
your repository and sets the job to fail if new articles are detected, providing a summary of new
articles in the GitHub Actions job summary. This approach is used to persist data across runs,
ensuring that the state is maintained over time, which is crucial for detecting new articles
reliably. Committing changes to the repository is the easiest solution to achieve this persistence.

### Debugging

Set the `debug` input to `true` to enable detailed debug logging, which can help troubleshoot any
issues with the action.

## License

This action is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
