const {SWCScraper} = require('./scrapers/SealsWithClubs')
const { GenericScraper } = require('./scrapers/GenericScraper')
const { CoinMarketCapScraper } = require('./scrapers/CoinMarketCapScraper')
const {ScraperConfig} = require('./util/util')

const runContinuously = async function () {

    

    const stockPokerConfig = new ScraperConfig({
      site:'stockpokeronline.com', 
      tournamentIdPrefix:'SPO', 
      currency: 'USD',
      running: true
    })

    const rounderCasinoConfig = new ScraperConfig({
      site:'roundercasino.com',
      tournamentIdPrefix:'RC',
      currency: "USD",
      running: true
    })

    const swcConfig = new ScraperConfig({
      site: 'swcpoker.club',
      tournamentPrefix: 'SWC',
      currency: 'USD',
      running: true
    })
  
    while (true) {
      const cryptoVals = await CoinMarketCapScraper()
      swcConfig['cryptocurrency'] = cryptoVals
      rounderCasinoConfig['cryptocurrency'] = cryptoVals
      stockPokerConfig['cryptocurrency'] = cryptoVals
      
      await GenericScraper(rounderCasinoConfig)
      await GenericScraper(stockPokerConfig)
      //await SWCScraper(swcConfig)

    }
  }

runContinuously()


