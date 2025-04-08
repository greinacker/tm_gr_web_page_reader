// /api/web-page-reader.js
import { Readability } from '@mozilla/readability';
import * as cheerio from 'cheerio';
import got from 'got';
import { JSDOM } from 'jsdom';

const removeUnwantedElements = (_cheerio) => {
  const elementsToRemove = [
    'footer',
    'header',
    'nav',
    'script',
    'style',
    'link',
    'meta',
    'noscript',
    'img',
    'picture',
    'video',
    'audio',
    'iframe',
    'object',
    'embed',
    'param',
    'track',
    'source',
    'canvas',
    'map',
    'area',
    'svg',
    'math',
  ];
  elementsToRemove.forEach((element) => _cheerio(element).remove());
};

const fetchAndCleanContent = async (url) => {
  const { body } = await got(url);
  const $ = cheerio.load(body);
  const title = $('title').text();
  removeUnwantedElements($);
  const doc = new JSDOM($.text(), {
    url: url,
  });
  const reader = new Readability(doc.window.document);
  const article = reader.parse();
  return { title, content: article ? article.textContent : '' };
};

export default async function handler(req, res) {

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'failed',
      message: 'Method not allowed',
      data: null
    });
  }

  const { url } = req.query;

  try {
    const content = await fetchAndCleanContent(url);
    return res.status(200).json({
      status: 'success',
      message: 'Content fetched successfully',
      data: content
    });
  } catch (error) {
    console.error(`Error fetching content: ${error.message}`);
    return res.status(500).json({
      status: 'failed',
      message: `Error fetching content: ${error.message}`,
      data: null
    });
  }
}