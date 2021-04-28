const {SWCScraper} = require('./scrapers/SealsWithClubs')
const { GenericScraper, ScraperConfig } = require('./scrapers/GenericScraper')
const { CoindeskScraper } = require('./scrapers/CoindeskScraper')


const runContinuously = async function () {
    console.log(1)

    const bitcoinPrice = await CoindeskScraper()

    const stockPokerConfig = new ScraperConfig({
      site:'stockpokeronline.com', 
      tournamentIdPrefix:'SPO', 
      bitcoinValue:bitcoinPrice,
      currency: 'USD'
    })

    const rounderCasinoConfig = new ScraperConfig({
      site:'roundercasino.com',
      tournamentIdPrefix:'RC',
      bitcoinValue:bitcoinPrice,
      currency: "USD"
    })
  
    while (true) {
      await GenericScraper(stockPokerConfig)
      await GenericScraper(rounderCasinoConfig)
      await SWCScraper(bitcoinPrice)
    }
  }

runContinuously()


