/* eslint-disable no-await-in-loop */
import {launch, SetCookie} from 'puppeteer'
import {mkdirSync} from 'fs'

function delay(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

export function getCookie(cauth: string): SetCookie {
  return {
    name: 'CAUTH',
    value: cauth,
    domain: '.coursera.org',
    url: 'https://www.coursera.org/',
    path: '/',
    httpOnly: true,
    secure: true,
  }
}

export async function capture(courseIds: string[], cookie: SetCookie, outputDir: string, delayMs = 5000) {
  const browser = await launch({headless: true})
  const page = await browser.newPage()
  await page.setCookie(cookie)
  await page.setViewport({
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
  })

  for (const courseId of courseIds) {
    const outputDirCourse = `${outputDir}/${courseId}`
    mkdirSync(outputDirCourse, {recursive: true})
    console.log(`Writing files to ${outputDirCourse}`)

    const url = `https://www.coursera.org/learn/${courseId}/home/assignments`
    console.log('Fetch URL: ' + url)
    await page.goto(url)

    console.log(`Wait for ${delayMs / 1000} seconds.`)
    await delay(delayMs)

    const links = await page.evaluate(() => {
      const urls: string[] = []
      const hrefs = document.querySelectorAll('a')
      hrefs.forEach(function (el) {
        if (el.href && el.href.indexOf('/exam') > -1) {
          urls.push(el.href + '/view-attempt')
        }
      })
      return urls
    })

    console.log('Found these links: ', links)

    for (let i = 0; i < links.length; i++) {
      console.log(`Fetch page ${i + 1} of ${links.length}`)
      const link = links[i]

      console.log('Fetch URL: ' + link)
      await page.goto(link)
      console.log(`Wait for ${delayMs / 1000} seconds.`)
      await delay(delayMs)

      try {
        await page.click('button.continue-button')
        console.info('Found continue button and pressed it.')
      } catch {
        // Nothing to do here, because the button appears only once per session.
      }

      await page.evaluate(() => {
        function removeElement(node: HTMLElement) {
 node.parentNode!.removeChild(node)
        }
        function removeClassName(node: HTMLElement) {
          node.classList.remove(...node.classList)
        }

        removeElement(document.querySelector('#rendered-content') as HTMLElement)
        removeElement(document.getElementsByClassName('rc-TunnelVisionHeader')[0] as HTMLElement)
        const tvEl = document.getElementsByClassName('rc-TunnelVision')[0] as HTMLElement
        removeClassName(tvEl.children[0] as HTMLElement)
        removeClassName(tvEl.children[1] as HTMLElement)
        document.body.style.overflowY = 'scroll';
        (document.getElementsByClassName('rc-TunnelVisionWrapper__content')[0] as HTMLElement).style.overflow = 'inherit'
      })
      await page.screenshot({path: `${outputDirCourse}/${i}.png`, fullPage: true})
    }
  }

  await browser.close()
}

