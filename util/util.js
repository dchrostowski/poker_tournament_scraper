const {Tournament, TournamentResult, RunningTournament, CryptocurrencyValue} = require('./db_models')


class ScraperConfig {
  constructor({site,tournamentIdPrefix,cryptocurrency, currency, running}) {
      this.site = site
      this.tournamentIdPrefix = tournamentIdPrefix
      this.cryptocurrency = cryptocurrency
      this.currency = currency
      this.running = running
  }
}



function deleteRunning(uid) {
  RunningTournament.deleteOne({uniqueId:uid}, function(err) {
    if(err) {
      console.log(err)
    }
  })
}

function validateChips(players) {
  
  for(let i=0; i<players.length; i++) {
    if(players[i].chips > 0) {
      return true
    }
  }
  return false
}

function validateNoChips(players) {

  for(let i=0; i<players.length; i++) {
    if(players[i].chips > 0) {
      return false
    }
  }
  return true
}

function insertCryptoRecord(args) {
  const cryptoRecord = new CryptocurrencyValue({date: new Date().getTime(),...args})
  cryptoRecord.save(function(err) {
    if(err) {
      console.error(err)
    }
    ``
  })

}


const updateRunning = (uniqueId,players) => {

  RunningTournament.findOne({uniqueId: uniqueId}, function(err,existing) {
    if(err) {
      console.log(err)
    }
    if(existing) {
      existing['players'] = players
      existing['lastUpdate'] = Date.now()
      existing.save(function(err) {
        if(err) {
          console.log(`error while inserting running ${site} tournament ${tournamentName}`)
          console.log(err)
        }
        else {
          console.log(`inserted running ${site} tournament ${tournamentName}`)
        }
      })
    }
    

  })
}

const insertRunning = ((runningRecord) => {
  const {tournamentName, uniqueId, results, site} = runningRecord
      runningRecord.save(function(err) {
        if(err) {
          console.log(`error while attempting to update ${site} tournament ${tournamentName}`)
          console.log(err)
        }
        else {
          console.log(`updated running ${site} tournament ${tournamentName}`)
        }
      })
  });



const updateRecord = (uniqueId, results) => {
  TournamentResult.findOne({uniqueId: uniqueId}, function(err,existing) {
    if(existing) {
      existing['results'] = results
      existing['lastUpdate'] = Date.now()
      existing.save(function(err) {
        if(err) {
          console.log(`error while inserting running ${existing['site']} tournament ${existing['tournamentName']}`)
          console.log(err)
        }
        else {
          console.log(`inserted running ${existing['site']} tournament ${existing['tournamentName']}`)
        }
      })
    }
    else {
      console.error(`can't find existing record ${uniqueId}`)
    }

  })

  if(validateNoChips(results)) {
    deleteRunning(uniqueId)
    console.log("deleting completed tournament from running")
    
  }

}

const insertRecord = (tournamentRecord) => {
    const {tournamentName, uniqueId, site} = tournamentRecord
    tournamentRecord.save(function (err) {
      if (err) {
        if (err.code == 11000) {
          console.log(`duplicate tournament id for ${uniqueId}.  Ignoring.`)
        }
        else {
          console.error(err)
        }
  
      }
      else {
        console.log(`Successfully inserted tournament record for ${tournamentName}`)
      }
    })

    
  }
  
  
  const waitFor = async (timeToWait) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, timeToWait)
  
    })
  }

  module.exports = {waitFor,insertRecord,insertRunning,ScraperConfig,insertCryptoRecord, updateRecord, updateRunning}
