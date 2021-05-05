
const puppeteer = require('puppeteer')
const { waitFor } = require('../util/util')

async function getPrice(url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  let priceFloat = null
  try {
    
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    })
    console.log(`laoding ${url}...`)
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
    const xpath = '//section[@class="coin-info"]//div[@class="data-definition"]/div[@class="price-large"]'

    const [priceDiv] = await page.$x(xpath)
    const priceText = await page.evaluate(div => div.innerText, priceDiv)

    console.log(priceText)
    priceFloat = parseFloat(priceText.replace(/\$|,/g, ''))
    

  }
  catch (err) {
    console.error(err)
  }

  finally {
    await page.close()
    await browser.close()
    return priceFloat
  }
}


const CoindeskScraper = async () => {

  const btcValue = await getPrice(`https://www.coindesk.com/price/bitcoin`)
  const bchValue = await getPrice(`https://www.coindesk.com/price/bitcoin-cash`)

  console.log("bitcoin is worth $" + btcValue)
  console.log("bitcoin cash is worth $" + bchValue)

  return {
    BTC: {name: 'bitcoin', usdValue: btcValue, abbreviation: 'BTC'},
    BCH: {name: 'bitcoin cash', usdValue: bchValue, abbreviation: 'BCH'},
    uBTC: {name: 'micro bitcoin', usdValue: btcValue/1000000, abbreviation: 'uBTC'},
    uBCH: {name: 'micro bitcoin cash', usdValue: bchValue/1000000, abbreviation: 'uBCH'}
  }

  

}

exports.CoindeskScraper = CoindeskScraper