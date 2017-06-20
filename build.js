'use strict'

const fs = require('fs')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const Prism = require('prismjs')
require('prismjs/components/prism-scss')

fetch('http://sass-lang.com/documentation/file.SASS_REFERENCE.html')
  .then(res => res.text())
  .then(cheerio.load)
  .then(getBodyAndToc)
  .then(render)
  .then(html => fs.writeFileSync('foo.html', html))

function highlight(html) {
  let $ = cheerio.load(html)
  $('.code code').each((i, element) => {
    const code = $(element).text()
    $(element)
      .addClass('language-scss')
      .empty()
      .append(Prism.highlight(code, Prism.languages.scss))
  })
  return $.html()
}

function absoluteLinks(html) {
  let $ = cheerio.load(html)
  $('a[href^=Sass]').each((i, element) =>
    $(element)
      .attr('href', `http://sass-lang.com/documentation/${$(element).attr('href')}`))
  return $.html()
}

function getBodyAndToc($) {
  return {
    body:
      [
        $('#filecontents')
          .remove('.maruku_toc + p') // remove intro
          .remove('.maruku_toc')
          .remove('h1#sass_syntactically_awesome_stylesheets')
          .html()
      ]
        .map(highlight)
        .map(absoluteLinks)
        .toString(),
    toc: $('.maruku_toc').html()
  }
}

function render({ body, toc }) {
  let template = fs.readFileSync('template.html', 'utf8')
  let $ = cheerio.load(template)
  $('#bsd-body').append(body)
  $('#bsd-toc').append(toc)
  $('#bsd-updated').text(new Date().toString())

  // Add ?<timestamp> to the stylesheet to bust the cache
  $('link[rel="stylesheet"]').each((i, element) =>
    $(element)
      .attr('href', $(element).attr('href') + '?' + Date.now()))
  return $.html()
}
