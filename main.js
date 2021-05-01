const {SWCScraper} = require('./scrapers/SealsWithClubs')
const { GenericScraper } = require('./scrapers/GenericScraper')
const { CoindeskScraper } = require('./scrapers/CoindeskScraper')
const {ScraperConfig} = require('./util/util')

const runContinuously = async function () {

    

    const stockPokerConfig = new ScraperConfig({
      site:'stockpokeronline.com', 
      tournamentIdPrefix:'SPO', 
      currency: 'USD',
      running: false
    })

    const rounderCasinoConfig = new ScraperConfig({
      site:'roundercasino.com',
      tournamentIdPrefix:'RC',
      currency: "USD",
      running: false
    })
  
    while (true) {
      const bitcoinPrice = await CoindeskScraper()
      stockPokerConfig['bitcoinValue'] = bitcoinPrice
      rounderCasinoConfig['bitcoinValue'] = bitcoinPrice
      await GenericScraper(stockPokerConfig)
      await GenericScraper(rounderCasinoConfig)
      await SWCScraper(bitcoinPrice)
    }
  }

runContinuously()


