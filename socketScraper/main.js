const {GenericWebSocketScraper} = require('./GenericWebSocketScraper')
const db = require('./socketScraper/db')

const rounderConfig = {
    site: 'roundercasino.com',
    tournamentIdPrefix: 'RC',
    currency: 'USD',
    cryptocurrency: null,
    socketUrl: 'wss://web.stockpokeronline.com/front',
  }
  
  const stockConfig = {
    site: 'stockpokeronline.com',
    tournamentIdPrefix: 'SPO',
    currency: 'USD',
    cryptocurrency: null,
    socketUrl: 'wss://web.stockpokeronline.com/front',
  }

  GenericWebSocketScraper(stockConfig, (running,completed) => {
    
    console.log(running)
    console.log(completed)
    console.log('CALLBACK HERE')
  })