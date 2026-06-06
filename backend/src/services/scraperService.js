const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Scraper Service - Extracts text content from URLs and uploaded files.
 *
 * URL scraping uses axios (already installed) with regex-based HTML stripping.
 * File extraction supports TXT natively, PDF via pdf-parse (converted to Markdown),
 * DOCX via mammoth (converted to Markdown).
 */

/**
 * Fetch and extract meaningful text content from a URL.
 * Uses axios to fetch HTML, then strips tags to get plain text.
 * @param {string} url - The URL to scrape
 * @returns {Promise<string>} Extracted text content (max 8000 chars)
 */
const scrapeUrl = async (url) => {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; WestPokotCMS/1.0)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  const html = response.data;

  // Remove script, style, nav, footer, header tags and their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text.replace(/&/g, '&');
  text = text.replace(/</g, '<');
  text = text.replace(/>/g, '>');
  text = text.replace(/"/g, '"');
  text = text.replace(/&#x27;/g, "'");
  text = text.replace(/&#x2F;/g, '/');
  text = text.replace(/&nbsp;/g, ' ');

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Limit to first 8000 characters to avoid excessive token usage
  return text.substring(0, 8000);
};

/**
 * Convert raw PDF-extracted text into Markdown format.
 * Detects headings (short lines, lines ending with colon), lists (bullets, numbers),
 * and structures the output with proper Markdown syntax.
 * @param {string} rawText - Text extracted from pdf-parse
 * @returns {string} Markdown-formatted text
 */
const pdfTextToMarkdown = (rawText) => {
  const lines = rawText.split('\n');
  const mdLines = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (inList) { inList = false; mdLines.push(''); }
      else { mdLines.push(''); }
      continue;
    }

    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
    const isShortLine = line.length < 80 && line.length > 5;
    const endsWithColon = line.endsWith(':');
    const isAllCaps = line === line.toUpperCase() && line.length > 10;
    const looksLikeHeading = (isShortLine || endsWithColon || isAllCaps) && nextLine.length > 0;

    // Detect list items
    const bulletMatch = line.match(/^[•●▪▸►‣⁃\-*]\s+(.+)/);
    const numberMatch = line.match(/^(\d+)[.)]\s+(.+)/);

    if (bulletMatch) {
      mdLines.push(`- ${bulletMatch[1]}`);
      inList = true;
    } else if (numberMatch) {
      mdLines.push(`${numberMatch[1]}. ${numberMatch[2]}`);
      inList = true;
    } else if (looksLikeHeading) {
      // Convert to heading — use ## for most, ### if it's a sub-heading
      const prefix = line.length < 40 ? '##' : '###';
      mdLines.push(`\n${prefix} ${line}\n`);
      inList = false;
    } else {
      mdLines.push(line);
      inList = false;
    }
  }

  return mdLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

/**
 * Convert DOCX-extracted raw text into Markdown format.
 * mammoth.extractRawText returns flat text; we add basic structure.
 * @param {string} rawText - Text extracted from mammoth
 * @returns {string} Markdown-formatted text
 */
const docxTextToMarkdown = (rawText) => {
  const lines = rawText.split('\n');
  const mdLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { mdLines.push(''); continue; }

    const bulletMatch = trimmed.match(/^[•●▪▸►‣⁃\-*]\s+(.+)/);
    const numberMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);

    if (bulletMatch) {
      mdLines.push(`- ${bulletMatch[1]}`);
    } else if (numberMatch) {
      mdLines.push(`${numberMatch[1]}. ${numberMatch[2]}`);
    } else if (trimmed.length < 80 && trimmed.endsWith(':')) {
      mdLines.push(`\n### ${trimmed}\n`);
    } else {
      mdLines.push(trimmed);
    }
  }

  return mdLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

/**
 * Extract text content from a file stored in the media system.
 * Supports: TXT (full), PDF (via pdf-parse → Markdown), DOCX (via mammoth → Markdown).
 * @param {string} filePath - Full path to the file on disk
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Extracted text content (max 8000 chars)
 */
const extractFileText = async (filePath, mimeType) => {
  if (mimeType === 'text/plain') {
    return fs.readFileSync(filePath, 'utf-8').substring(0, 8000);
  }

  if (mimeType === 'application/pdf') {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      await parser.load();
      const result = await parser.getText();
      const rawText = result.text || '';
      if (!rawText.trim()) {
        return `[PDF file: ${path.basename(filePath)}. No extractable text found. The PDF may contain only scanned images.]`;
      }
      const markdown = pdfTextToMarkdown(rawText);
      return markdown.substring(0, 8000);
    } catch (pdfErr) {
      return `[PDF file: ${path.basename(filePath)}. Text extraction failed: ${pdfErr.message}. The AI will use the filename as context.]`;
    }
  }

  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      const rawText = result.value || '';
      if (!rawText.trim()) {
        return `[DOCX file: ${path.basename(filePath)}. No extractable text found.]`;
      }
      const markdown = docxTextToMarkdown(rawText);
      return markdown.substring(0, 8000);
    } catch (docxErr) {
      return `[DOCX file: ${path.basename(filePath)}. Text extraction failed: ${docxErr.message}. The AI will use the filename as context.]`;
    }
  }

  return `[Unsupported file type: ${mimeType}]`;
};

module.exports = { scrapeUrl, extractFileText, pdfTextToMarkdown, docxTextToMarkdown };
