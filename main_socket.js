
const {GenericWebSocketScraper} = require('./socketScraper/GenericWebSocketScraper')
const {getDBConnection} = require('./socketScraper/db')
const {insertCompleted} = require('./socketScraper/util')
getDBConnection()


//console.log(db)


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

  const run = () => {
   
    return GenericWebSocketScraper(stockConfig, (running,completed) => {
      
      console.log(running)
      console.log(completed)
      console.log('CALLBACK HERE')

      for(let i=0; i<completed.length; i++) {
        result = completed[i]
        insertCompleted(result)

      }
      return run()

    })

    

  }

  run()