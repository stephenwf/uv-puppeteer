const base = 'http://universalviewer.io/examples/';
const puppeteer = require('puppeteer');
const mkdirp = require('mkdirp');

(async () => {

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 710 });
  await page.goto(base, {waitUntil: 'networkidle0'});

  let manifests = await page.evaluate(() => {
    const dropDown = document.getElementById('manifestSelect');
    const options = Array.from(dropDown.querySelectorAll('option'));

    return options.map(opt => ({ name: opt.innerText, manifest: opt.getAttribute('value') }))
  });

  const from = 0;

  manifests = manifests.slice(from)

  let j = from;
  console.log(`Found ${manifests.length} Manifests`);

  for (const manifest of manifests) {
    j = j + 1;
    if ([
      'http://wellcomelibrary.org/iiif/b16659090/manifest',
      'http://wellcomelibrary.org/iiif/b20605055/manifest',
      'http://wellcomelibrary.org/iiif/b16748967/manifest',
      'http://wellcomelibrary.org/iiif/b17307922/manifest',
      'http://wellcomelibrary.org/iiif/b17502792/manifest',
      'http://wellcomelibrary.org/iiif/b17307703/manifest'
    ].indexOf(manifest.manifest) !== -1) {
      continue;
    }

    console.log(`Processing ${manifest.manifest}`);
    await page.goto(`${base}/404`);
    await page.goto(`${base}/#?manifest=${manifest.manifest}`, {waitUntil: ['networkidle0', 'load', 'domcontentloaded']});

    mkdirp.sync(`manifests/${j} - ${manifest.name}/pages`);

    await page.waitForSelector('.openseadragon-canvas');
    await page.screenshot({path: `manifests/${j} - ${manifest.name}/pages/page-0.png`});

    let canRun = await page.evaluate(() => {
      const btn = document.querySelector('.paging.btn.next');
      if (btn) {
        return !btn.classList.contains('disabled');
      }
      return false;
    });
    let i = 0;
    while (canRun) {
      i = i + 1;
      console.log(` => Page ${i}`);
      await page.waitForSelector('.paging.btn.next', {visible: true});
      await page.click('.paging.btn.next');
      await page.waitForSelector('.paging.btn.next');
      await page.waitForSelector('.openseadragon-canvas');
      await page.screenshot({path: `manifests/${j} - ${manifest.name}/pages/page-${i}.png`});

      canRun = await page.evaluate(() => {
        const btn = document.querySelector('.paging.btn.next');
        if (btn) {
          return !btn.classList.contains('disabled');
        }
        return false;
      });
    }
  }

  await browser.close();
})();
