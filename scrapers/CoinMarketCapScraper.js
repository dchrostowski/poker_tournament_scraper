
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
    
    const xpath = '//div[@class="priceValue "]/span'

    const [priceSpan] = await page.$x(xpath)
    const priceText = await page.evaluate(span => span.innerText, priceSpan)
    

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


const CoinMarketCapScraper = async () => {

  const btcValue = await getPrice(`https://coinmarketcap.com/currencies/bitcoin/`)
  const bchValue = await getPrice(`https://coinmarketcap.com/currencies/bitcoin-cash/`)
  
  return {
    BTC: {name: 'bitcoin', usdValue: btcValue, abbreviation: 'BTC'},
    BCH: {name: 'bitcoin cash', usdValue: bchValue, abbreviation: 'BCH'},
    uBTC: {name: 'micro bitcoin', usdValue: btcValue/1000000, abbreviation: 'uBTC'},
    uBCH: {name: 'micro bitcoin cash', usdValue: bchValue/1000000, abbreviation: 'uBCH'}
  }

  

}

exports.CoinMarketCapScraper = CoinMarketCapScraper