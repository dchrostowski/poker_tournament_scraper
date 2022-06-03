const {
  GenericWebSocketScraper
} = require("./socketScraper/GenericWebSocketScraper")
const { getDBConnection } = require("./socketScraper/db")
const {
  insertCompleted,
  insertRunning,
  insertRegistering,
  pruneRegistering
} = require("./socketScraper/util")
getDBConnection()

//console.log(db)

const rounderConfig = {
  site: "roundercasino.com",
  tournamentIdPrefix: "RC",
  currency: "USD",
  cryptocurrency: null,
  socketUrl: "wss://web.latpoker.com/front"
}

const stockConfig = {
  site: "stockpokeronline.com",
  tournamentIdPrefix: "SPO",
  currency: "USD",
  cryptocurrency: null,
  socketUrl: "wss://web.stockpokeronline.com/front"
}

const insertData = tournament => {
  switch (tournament.tournamentState.tournamentState) {
    case "running": {
      insertRunning(tournament)
      break
    }
    case "registering": {
      insertRegistering(tournament)
      break
    }
    case "completed": {
      insertCompleted(tournament)
      break
    }
  }

  pruneRegistering(300000)
}

const run = configs => {
  configs.forEach(config => {
    return GenericWebSocketScraper(config, function(tournaments) {
      try {
        tournaments.forEach(tournament => {
          insertData(tournament)
        })
      } catch (err) {
        console.error(err)
      } finally {
        return run([config])
      }
    })
  })
}

run([stockConfig])

// const pruneRegistering = ms => {
//   let targetDate = new Date()
//   targetDate.setTime(targetDate.getTime() - ms)
//   console.log(
//     `pruning all registering tournaments last updated before ${targetDate}...`
//   )

//   RegisteringTournament.deleteMany(
//     { lastUpdated: { $lt: targetDate } },
//     err => {
//       if (err) {
//         console.log("Error while trying to prune registered tournaments")
//         console.error(err)
//       } else {
//         console.log("sucessfully pruned registering tournaments")
//       }
//     }
//   )
// }
