import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import RSSParser from 'rss-parser';
import * as core from '@actions/core';
import * as github from '@actions/github';

const parser = new RSSParser();

// Default to the root of the repository
const commitDirectory = core.getInput('commit-directory') || '.';
const commitMessage = core.getInput('commit-message') || '🤖 Update lastPublished.json';

const isDebug = core.getBooleanInput('debug');
const lastPublishedFile = path.join(commitDirectory, 'lastPublished.json');
const feedUrls = core.getInput('rss-feeds').split('\n').map(url => url.trim());

if (isDebug) {
  core.debug(`Last Published File Path: ${lastPublishedFile}`);
  core.debug(`Feed URLs: ${feedUrls}`);
  core.debug(`Commit Directory: ${commitDirectory}`);
  core.debug(`Commit Message: ${commitMessage}`);
}

// Get last published dates from the JSON file
export const getLastPublishedDates = async () => {
  try {
    let dates = await fs.readJson(lastPublishedFile);
    if (isDebug) core.debug(`Last published dates: ${JSON.stringify(dates)}`);
    return dates;
  } catch (error) {
    if (isDebug) core.error(`Error reading lastPublished.json: ${error.message}`);
    return {};
  }
};

// Save last published dates to the JSON file
export const saveLastPublishedDates = async (dates) => {
  try {
    await fs.writeJson(lastPublishedFile, dates);
    if (isDebug) core.debug('Successfully saved last published dates.');
  } catch (error) {
    if (isDebug) core.error(`Error saving lastPublished.json: ${error.message}`);
  }
};

// Fetch and parse the RSS feed
export const fetchFeed = async (url, lastPublishedDates) => {
  try {
    if (isDebug) core.debug(`Fetching feed: ${url}`);
    let response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    let xml = await response.text();
    let parsedFeed = await parser.parseString(xml);
    let items = parsedFeed.items || [];

    if (isDebug) core.debug(`Parsed items for ${url}: ${JSON.stringify(items)}`);

    return items.map(item => ({
      title: item.title,
      link: item.link,
      publishedDate: new Date(item.pubDate).toISOString(),
    })).filter(article => {
      let lastPublished = lastPublishedDates[url];
      let isNew = !lastPublished || new Date(article.publishedDate) > new Date(lastPublished);

      if (isDebug) core.debug(`Article "${article.title}" is new: ${isNew}`);
      return isNew;
    });
  } catch (error) {
    core.error(`Error fetching feed: ${error.message}`);
    return [];
  }
};

// Monitor all feeds and check for new articles
export const monitorFeeds = async () => {
  core.debug('Monitoring feeds...');
  let lastPublishedDates = await getLastPublishedDates();
  let allNewArticles = [];

  for (let feedUrl of feedUrls) {
    core.debug(`Fetching feed URL: ${feedUrl}`);
    let newArticles = await fetchFeed(feedUrl, lastPublishedDates);

    if (newArticles.length > 0) {
      lastPublishedDates[feedUrl] = new Date().toISOString(); // Update the date for this feed
      allNewArticles = allNewArticles.concat(newArticles);
    }
  }

  await saveLastPublishedDates(lastPublishedDates);

  if (allNewArticles.length > 0) {
    let summaryLines = allNewArticles.map(article =>
      `- **[${article.title}](${article.link})** (Published: ${new Date(article.publishedDate).toLocaleString()})`
    ).join('\n');

    // Set the summary for the GitHub job
    core.summary.addRaw(`## New Articles Detected\n${summaryLines}`);
    await core.summary.write();

    // Fail the job if new articles are found
    core.setFailed('New articles detected. Check summary for details.');
  } else {
    core.info('No new articles.');
  }
};

// Commit changes to the GitHub repository
export const commitChanges = async () => {
  try {
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    let newFileContent = await fs.readFile(lastPublishedFile, 'utf8');

    let sha;
    let currentFileContent;

    try {
      let { data } = await octokit.rest.repos.getContent({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        path: 'lastPublished.json'
      });
      sha = data.sha;
      currentFileContent = Buffer.from(data.content, 'base64').toString('utf8');
    } catch (error) {
      if (error.status === 404) {
        sha = null;
        currentFileContent = '';
      } else {
        throw error;
      }
    }

    // Commit only if the content has changed
    if (currentFileContent !== newFileContent) {
      let result = await octokit.rest.repos.createOrUpdateFileContents({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        path: 'lastPublished.json',
        message: commitMessage,
        content: Buffer.from(newFileContent).toString('base64'),
        sha: sha
      });

      core.info(`Committed changes: ${result.data.commit.sha}`);
    } else {
      core.info('No changes to commit.');
    }
  } catch (error) {
    core.error(`Error committing changes: ${error.message}`);
  }
};

// Execute the monitorFeeds function
monitorFeeds().then(() => {
  core.debug('Monitoring complete.');
  return commitChanges();
}).catch(error => {
  core.error(`Error executing monitorFeeds: ${error.message}`);
  core.setFailed(error.message);
});
