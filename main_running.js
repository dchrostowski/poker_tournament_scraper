const {SWCScraper} = require('./scrapers/SealsWithClubs')
const { GenericScraper } = require('./scrapers/GenericScraper')
const { CoindeskScraper } = require('./scrapers/CoindeskScraper')
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
      currency: 'uBTC',
      running: true
    })
  
    while (true) {
      await SWCScraper(swcConfig)
      //await GenericScraper(rounderCasinoConfig)
      //await GenericScraper(stockPokerConfig)

    }
  }

runContinuously()


