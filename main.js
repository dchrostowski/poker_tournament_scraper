const {SWCScraper} = require('./scrapers/SealsWithClubs')
const {StockPokerScraper} = require('./scrapers/StockPokerOnline')


const runContinuously = async function () {
    console.log(1)
  
    while (true) {
      await StockPokerScraper()
      await SWCScraper()
      
  
    }
  }
  
  runContinuously()
