import fs from 'fs-extra';
import * as core from '@actions/core';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  fetchFeed,
  monitorFeeds,
  getLastPublishedDates,
  saveLastPublishedDates,
  commitChanges
} from '../index.js';

vi.mock('../index.js', async (importOriginal) => {
  let mod = await importOriginal();

  return {
    ...mod,
    commitChanges: vi.fn(async () => {
      core.info('Committed changes');
    }),
  };
});

// Mock the core actions
vi.mock('@actions/core', () => ({
  getInput: vi.fn((name) => {
    if (name === 'rss-feeds') {
      return 'https://rss.macrumors.com/\nhttps://appleinsider.com/rss/news/\nhttps://www.apple.com/newsroom/rss-feed.rss\nhttp://developer.apple.com/news/rss/news.rss';
    }

    if (name === 'GITHUB_TOKEN') return 'test-token';
    if (name === 'commit-directory') return __dirname;
    if (name === 'commit-message') return 'Custom commit message';

    return '';
  }),
  getBooleanInput: vi.fn(() => {
    return false;
  }),
  setFailed: vi.fn((message) => {
    console.error(`Set failed: ${message}`);
  }),
  summary: {
    addRaw: vi.fn((text) => {
      console.log(`Summary addRaw: ${text}`);
    }),
    write: vi.fn(async () => {
      console.log('Summary written');
    })
  },
  info: vi.fn((message) => {
    console.log(`Info: ${message}`);
  }),
  debug: vi.fn((message) => {
    console.log(`Debug: ${message}`);
  }),
  error: vi.fn((message) => {
    console.error(`Error: ${message}`);
  })
}));

describe('RSS Feed Monitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-01T07:38:53.000Z'));

    vi.spyOn(fs, 'writeJson').mockResolvedValue(undefined);
    vi.spyOn(fs, 'readFile').mockResolvedValue('{"mock": "data"}');
    vi.spyOn(fs, 'readJson').mockResolvedValue({
      'https://rss.macrumors.com/': new Date(Date.now() - 1000).toISOString(),
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should correctly read and write JSON', async () => {
    let mockJson = {
      'https://rss.macrumors.com/': new Date(Date.now() - 1000).toISOString(),
    };

    let dates = await getLastPublishedDates();
    expect(dates).toEqual(mockJson);

    await saveLastPublishedDates(dates);
    expect(fs.writeJson).toHaveBeenCalledWith(expect.any(String), dates);
  });

  it('should fetch feed and handle new articles', async () => {
    let newArticles = await fetchFeed('https://rss.macrumors.com/', {});

    expect(newArticles).toEqual([
      {
        title: 'New Article',
        link: 'https://example.com/article',
        publishedDate: '2024-08-01T07:38:53.000Z',
      },
    ]);
  });

  it('should monitor feeds and handle new articles', async () => {
    await monitorFeeds();

    expect(core.summary.addRaw).toHaveBeenCalledWith(expect.stringContaining('New Articles Detected'));
    expect(core.summary.write).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('New articles detected. Check summary for details.');
  });

  it('should commit changes with a custom commit message and directory', async () => {
    await commitChanges();

    expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Committed changes'));
    expect(core.error).not.toHaveBeenCalled();
  });
});
