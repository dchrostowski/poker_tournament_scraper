const {SWCScraper} = require('./scrapers/SealsWithClubs')
const { GenericScraper, ScraperConfig } = require('./scrapers/GenericScraper')
const { CoindeskScraper } = require('./scrapers/CoindeskScraper')


const runContinuously = async function () {

    

    const stockPokerConfig = new ScraperConfig({
      site:'stockpokeronline.com', 
      tournamentIdPrefix:'SPO', 
      currency: 'USD'
    })

    const rounderCasinoConfig = new ScraperConfig({
      site:'roundercasino.com',
      tournamentIdPrefix:'RC',
      currency: "USD"
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


