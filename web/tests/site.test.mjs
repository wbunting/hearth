import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

let server, browser;
const origin = 'http://127.0.0.1:3630';
before(async () => {
  server = spawn('python3', ['-m', 'http.server', '3630', '--bind', '127.0.0.1', '--directory', 'public'], {stdio: 'ignore'});
  await new Promise((resolve, reject) => {
    const deadline = Date.now() + 10000;
    const check = async () => {
      try { const r = await fetch(origin); if (r.ok) return resolve(); } catch {}
      if (Date.now() > deadline) return reject(new Error('Static test server unavailable'));
      setTimeout(check, 100);
    }; check();
  });
  browser = await chromium.launch({headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH} : {})});
});
after(async () => { await browser?.close(); server?.kill('SIGTERM'); });

for (const width of [390, 1280]) {
  test(`landing and docs work without JavaScript at ${width}px`, async () => {
    const page = await browser.newPage({viewport: {width, height: 900}, javaScriptEnabled: false});
    const failed = [];
    page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    await page.goto(origin, {waitUntil:'networkidle'});
    await page.screenshot({path:`.evidence/home-${width}.png`,fullPage:true});
    assert.match(await page.locator('h1').innerText(), /Entirely in Rust/);
    assert.equal(await page.locator('script,iframe,input[type=search]').count(), 0);
    assert.match(await page.getByRole('link',{name:/Try the live demo/}).getAttribute('href'), /^https:\/\/wbunting-hearth-demo\.fly\.dev/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Get started',exact:true}).click();
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('h1').innerText(), 'Getting started');
    assert.match(await page.locator('main').innerText(),/cargo add hearth@=0.1.0/);
    await page.getByRole('navigation',{name:'Local-first'}).getByRole('link',{name:'Tables and permissions'}).click();
    await page.waitForLoadState('networkidle');
    assert.match(await page.locator('h1').innerText(),/Tables and permissions/);
    assert.equal(await page.locator('a[aria-current=page]').count(),1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    await page.screenshot({path:`.evidence/tables-${width}.png`,fullPage:true});
    assert.deepEqual(failed,[]);
    await page.close();
  });
}

test('every generated page loads with a single main heading', async () => {
  const { readFile, readdir } = await import('node:fs/promises');
  const paths=[];
  async function walk(dir){for(const x of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${x.name}`;if(x.isDirectory())await walk(p);else if(x.name==='index.html')paths.push(p);}}
  await walk('public');
  assert.ok(paths.length>=64);
  const page=await browser.newPage();
  for(const path of paths){const url=origin+path.replace(/^public/,'').replace(/index.html$/,'');const r=await page.goto(url);assert.equal(r.status(),200,url);assert.equal(await page.locator('h1').count(),1,url);}
  const text=await readFile('public/_headers','utf8');assert.match(text,/script-src 'none'/);assert.match(text,/frame-ancestors 'none'/);
  await page.close();
});


test('table of contents stays on the current preview origin', async () => {
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(origin + '/docs/font/');
  await page.getByRole('complementary',{name:'On this page'}).getByRole('link',{name:'Declaring fonts',exact:true}).click();
  assert.equal(new URL(page.url()).origin, origin);
  assert.equal(new URL(page.url()).hash, '#declaring-fonts');
  const source = page.getByRole('link',{name:'Fontsource',exact:true});
  assert.ok(await source.count() > 0);
  assert.equal(await source.first().getAttribute('href'), 'https://fontsource.org/');
  await page.close();
});
