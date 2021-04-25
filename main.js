const {SWCScraper} = require('./SealsWithClubs')
const {StockPokerScraper} = require('./StockPokerOnline')


const runContinuously = async function () {
    console.log(1)
  
    while (true) {
      await SWCScraper()
      await StockPokerScraper()
  
    }
  }
  
  runContinuously()