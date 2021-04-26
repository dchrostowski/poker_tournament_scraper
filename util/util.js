
const insertRecord = (tournamentRecord) => {
    const {tournamentName, uniqueId, results, site} = tournamentRecord
    console.log(`inserting ${results.length} results for ${tournamentName} (${uniqueId})...`)
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
      //console.log("Waiting ", timeToWait / 1000, " seconds...")
      setTimeout(() => {
        resolve()
      }, timeToWait)
  
    })
  }

  exports.waitFor = waitFor
  exports.insertRecord = insertRecord