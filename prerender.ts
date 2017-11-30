// Load zone.js for the server.
import "zone.js/dist/zone-node";
import "reflect-metadata";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import * as converter from "xml-js";
import { parse } from "url";
import * as makeDir from "make-dir";
import * as Promise from "bluebird";
import * as ora from 'ora';

import { enableProdMode } from "@angular/core";
// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

// Express Engine
import { ngExpressEngine } from "@nguniversal/express-engine";
// Import module map for lazy loading
import { provideModuleMap } from "@nguniversal/module-map-ngfactory-loader";
import { renderModuleFactory } from "@angular/platform-server";

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {
  AppServerModuleNgFactory,
  LAZY_MODULE_MAP
} = require("./dist/server/main.bundle");

const BROWSER_FOLDER = join(process.cwd(), "browser");

// Load the index.html file containing referances to your application bundle.
const index = readFileSync(join("browser", "index.html"), "utf8");

const sitemapFile = readFileSync(join(process.cwd(), "server", "sitemap.xml"), {encoding: 'utf8'});
const sitemap = converter.xml2js(sitemapFile, {compact: true});

// Build an array of routes and paths
const urls = sitemap.urlset.url.map(item => {
  const url = parse(item.loc._text);
  const route = url.pathname.replace("clarity/", "");
  const fullPath = join(BROWSER_FOLDER, route);

  // Make sure the directory structure is there
  if (!existsSync(fullPath)) {
    makeDir.sync(fullPath);
  }

  return { route, fullPath };
});

// Writes rendered HTML to index.html, replacing the file if it already exists.
const renderer = url => {
  const spinner = ora('Route: ' + url.route).start();
  return renderModuleFactory(AppServerModuleNgFactory, {
    document: index,
    url: url.route,
    extraProviders: [provideModuleMap(LAZY_MODULE_MAP)]
  }).then(html => {
    writeFileSync(join(url.fullPath, "index.html"), html);
    spinner.succeed();
    return url;
  });
};

// Run through each route individually and report on completion
Promise.map(urls, renderer, { concurrency: 1 }).then(result => {
  console.log("Finished rendering!");
});
