const puppeteer = require('puppeteer');
const fs = require('fs');

if (!process.env.CAUTH || !process.env.COURSE_IDS) {
    console.error('ERROR: Environment variables CAUTH and COURSE_IDS must be defined.');
    process.exit(1);
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  });
}

const cookie = {
  name: 'CAUTH',
  value: process.env.CAUTH,
  domain: '.coursera.org',
  url: 'https://www.coursera.org/',
  path: '/',
  httpOnly: true,
  secure: true
};

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setCookie(cookie);
  await page.setViewport({
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
  });

  const courses = process.env.COURSE_IDS.split(',');
  console.log(`Courses read from COURSE_IDS env variable: ${courses.join(',')}`);

  for (let courseName of courses) {

    fs.mkdirSync(`screenshots/${courseName}`, { recursive: true });

    await page.goto(`https://www.coursera.org/learn/${courseName}/home/assignments`);

    await delay(10000);

    const links = await page.evaluate(() => {
      let urls = [];
      let hrefs = document.querySelectorAll('a');
      hrefs.forEach(function (el) {
        if (el.href && el.href.indexOf('/exam') > -1) {
          urls.push(el.href + '/view-attempt');
        }
      });
      return urls;
    });

    console.log("Found these links: ", links);

    let i = 0;
    for (let link of links) {
      i++;
      await page.goto(link);
      await delay(10000);

      try {
        await page.click('button.continue-button');
      } catch {
        console.warn("Continue button not found.")
      }

      await page.evaluate(() => {
        function removeElement(node) { node.parentNode.removeChild(node); }
        function removeClassName(node) { node.attributes.class.value = ''; }

        removeElement(document.querySelector("#rendered-content"));
        removeElement(document.getElementsByClassName('rc-TunnelVisionHeader')[0]);
        const tvEl = document.getElementsByClassName('rc-TunnelVision')[0]
        removeClassName(tvEl.children[0]);
        removeClassName(tvEl.children[1]);
        document.body.attributes.style = 'overflow-y: scroll;';
        document.getElementsByClassName('rc-TunnelVisionWrapper__content')[0].attributes.style = 'overflow: inherit';

      });
      await page.screenshot({ path: `screenshots/${courseName}/${i}.png`, fullPage: true });
    }

  }


  await browser.close();
})();
