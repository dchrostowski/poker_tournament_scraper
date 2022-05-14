
const {GenericWebSocketScraper} = require('./socketScraper/GenericWebSocketScraper')
const {getDBConnection} = require('./socketScraper/db')
const {insertCompleted, insertRunning} = require('./socketScraper/util')
getDBConnection()


//console.log(db)


const rounderConfig = {
    site: 'roundercasino.com',
    tournamentIdPrefix: 'RC',
    currency: 'USD',
    cryptocurrency: null,
    socketUrl: 'wss://web.latpoker.com/front',
  }
  
  const stockConfig = {
    site: 'stockpokeronline.com',
    tournamentIdPrefix: 'SPO',
    currency: 'USD',
    cryptocurrency: null,
    socketUrl: 'wss://web.stockpokeronline.com/front',
  }

  const run = (configs) => {

    configs.forEach((config) => {
      return GenericWebSocketScraper(config, (running,completed) => {
      
        console.log(running)
        console.log(completed)
        console.log('CALLBACK HERE')
  
        for(let i=0; i<completed.length; i++) {
          const result = completed[i]
          insertCompleted(result)
  
        }
  
        for(let i=0; i<running.length; i++) {
          const result = running[i]
          insertRunning(result)
  
        }
        return run([config])
  
      })

    })
   
    

    

  }

  run([rounderConfig,stockConfig])