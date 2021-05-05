const {SWCScraper} = require('./scrapers/SealsWithClubs')
const { GenericScraper } = require('./scrapers/GenericScraper')
const { CoindeskScraper } = require('./scrapers/CoindeskScraper')
const {ScraperConfig, insertCryptoRecord} = require('./util/util')

const runContinuously = async function () {

    

    const stockPokerConfig = new ScraperConfig({
      site:'stockpokeronline.com', 
      tournamentIdPrefix:'SPO', 
      currency: 'USD',
      running: false,
      cryptocurrency: null
    })

    const rounderCasinoConfig = new ScraperConfig({
      site:'roundercasino.com',
      tournamentIdPrefix:'RC',
      currency: "USD",
      cryptocurrency: null,
      running: false
    })

    const swcConfig = new ScraperConfig({
      site: 'swcpoker.club',
      tournamentPrefix: 'SWC',
      currency: 'USD',
      running: false,
      cryptocurrency: null

    })
  
    while (true) {
      const cryptoVals = await CoindeskScraper()

      
      stockPokerConfig.cryptocurrency = cryptoVals
      rounderCasinoConfig.cryptocurrency = cryptoVals
      swcConfig.cryptocurrency = cryptoVals

      await GenericScraper(stockPokerConfig)
      await GenericScraper(rounderCasinoConfig)
      await SWCScraper(swcConfig)
      Object.keys(cryptoVals).forEach(key => insertCryptoRecord(cryptoVals[key]))
    }
  }

runContinuously()


