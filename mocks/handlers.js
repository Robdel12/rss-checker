import { http } from 'msw';

// Fixed date for consistency in tests
const fixedDate = '2024-08-01T07:38:53.000Z';

export const handlers = [
  // Handler for MacRumors
  http.get('https://rss.macrumors.com/', (req) => {
    return new Response(`
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>MacRumors</title>
          <link>https://www.macrumors.com/</link>
          <description>Latest MacRumors News</description>
          <item>
            <title>New Article</title>
            <link>https://example.com/article</link>
            <pubDate>${fixedDate}</pubDate>
          </item>
        </channel>
      </rss>
    `, {
      headers: { 'Content-Type': 'application/xml' },
    });
  }),

  // Handler for AppleInsider
  http.get('https://appleinsider.com/rss/news/', (req) => {
    return new Response(`
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>AppleInsider</title>
          <link>https://appleinsider.com/</link>
          <description>Latest AppleInsider News</description>
          <item>
            <title>Apple Insider Update</title>
            <link>https://appleinsider.com/article</link>
            <pubDate>${fixedDate}</pubDate>
          </item>
        </channel>
      </rss>
    `, {
      headers: { 'Content-Type': 'application/xml' },
    });
  }),

  // Handler for Apple Newsroom
  http.get('https://www.apple.com/newsroom/rss-feed.rss', (req) => {
    return new Response(`
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Apple Newsroom</title>
          <link>https://www.apple.com/</link>
          <description>Latest Apple Newsroom News</description>
          <item>
            <title>Apple News</title>
            <link>https://www.apple.com/news/article</link>
            <pubDate>${fixedDate}</pubDate>
          </item>
        </channel>
      </rss>
    `, {
      headers: { 'Content-Type': 'application/xml' },
    });
  }),

  // Handler for Apple Developer News
  http.get('http://developer.apple.com/news/rss/news.rss', (req) => {
    return new Response(`
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Apple Developer News</title>
          <link>http://developer.apple.com/</link>
          <description>Latest Apple Developer News</description>
          <item>
            <title>Developer News Update</title>
            <link>http://developer.apple.com/news/article</link>
            <pubDate>${fixedDate}</pubDate>
          </item>
        </channel>
      </rss>
    `, {
      headers: { 'Content-Type': 'application/xml' },
    });
  })
];
