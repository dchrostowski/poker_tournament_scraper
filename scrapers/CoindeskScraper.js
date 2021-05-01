
const puppeteer = require('puppeteer')
const {waitFor} = require('../util/util')


const CoindeskScraper = async () => {

    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    try {
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      })

  
      console.log(`Loading coindesk.com/calculator...`)
      await page.goto(`https://coindesk.com/calculator/`, { waitUntil: 'networkidle0', timeout: 60000 })
      await waitFor(3000)  
    
      
      const [idk,bitcoinInput] = await page.$x('//div[@class="bitcoin-calculator"]//div[@class="input-wrapper"]/input[1]')
      const bitcoinValue = await page.evaluate(x => x.value, bitcoinInput)
      console.log("bitcoin is worth $" +  bitcoinValue)
      return parseFloat(bitcoinValue.replace(/,/g, ''))


    }

    catch (err) {
        console.error(err)
      }

    finally {
        await page.close()
        await browser.close()
    }

}

exports.CoindeskScraper = CoindeskScraper