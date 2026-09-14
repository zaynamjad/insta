<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>XML Sitemap | InstaViewStories</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f19;
            color: #f1f5f9;
            margin: 0;
            padding: 40px 20px;
            line-height: 1.5;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          .header {
            margin-bottom: 28px;
            padding-bottom: 20px;
            border-bottom: 1px solid #1e293b;
          }
          h1 {
            font-size: 26px;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 8px 0;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          h1 span.logo {
            background: linear-gradient(135deg, #e1306c, #f77737);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p.desc {
            color: #94a3b8;
            font-size: 14px;
            margin: 0;
          }
          .stats-bar {
            background: #161e2e;
            border: 1px solid #1e293b;
            border-radius: 10px;
            padding: 16px 22px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
          }
          .stat-item {
            font-size: 14px;
            color: #94a3b8;
          }
          .stat-item strong {
            color: #38bdf8;
            font-size: 16px;
            font-weight: 600;
          }
          .table-wrapper {
            background: #161e2e;
            border: 1px solid #1e293b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }
          th {
            background-color: #0f172a;
            color: #64748b;
            padding: 14px 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            border-bottom: 1px solid #1e293b;
          }
          td {
            padding: 14px 20px;
            border-bottom: 1px solid #1e293b;
            font-size: 14px;
            color: #cbd5e1;
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr:hover td {
            background-color: #1e293b;
          }
          a {
            color: #38bdf8;
            text-decoration: none;
            word-break: break-all;
            transition: color 0.15s ease;
          }
          a:hover {
            color: #7dd3fc;
            text-decoration: underline;
          }
          .badge-freq {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            background: rgba(56, 189, 248, 0.12);
            color: #38bdf8;
            border: 1px solid rgba(56, 189, 248, 0.25);
            text-transform: capitalize;
          }
          .priority-tag {
            font-family: monospace;
            font-weight: 600;
            color: #a7f3d0;
          }
          .alternates-list {
            margin-top: 6px;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }
          .alt-badge {
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            background: #0f172a;
            color: #94a3b8;
            border: 1px solid #1e293b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1><span class="logo">InstaViewStories</span> XML Sitemap</h1>
            <p class="desc">Production XML sitemap generated for Google, Bing, and search indexers.</p>
          </div>
          <div class="stats-bar">
            <div class="stat-item">Total URLs Indexed: <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong></div>
            <div class="stat-item">Format: <strong>XML Sitemap Protocol 0.9</strong></div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>URL Location</th>
                  <th style="width: 140px;">Frequency</th>
                  <th style="width: 100px;">Priority</th>
                  <th style="width: 180px;">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td><xsl:value-of select="position()"/></td>
                    <td>
                      <a href="{sitemap:loc}">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                      <xsl:if test="xhtml:link">
                        <div class="alternates-list">
                          <xsl:for-each select="xhtml:link">
                            <span class="alt-badge"><xsl:value-of select="@hreflang"/></span>
                          </xsl:for-each>
                        </div>
                      </xsl:if>
                    </td>
                    <td>
                      <span class="badge-freq"><xsl:value-of select="sitemap:changefreq"/></span>
                    </td>
                    <td>
                      <span class="priority-tag"><xsl:value-of select="sitemap:priority"/></span>
                    </td>
                    <td><xsl:value-of select="substring(sitemap:lastmod,0,11)"/></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
