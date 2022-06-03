const {
  PlayerPosition,
  TournamentResult,
  RunningTournament,
  RegisteringTournament
} = require("./db_models")

const insertCompleted = tournamentResult => {
  tournamentResult.save(err => {
    if (err) {
      if (err.code === 11000) {
        console.log(
          `duplicate tournament ${tournamentResult.tournamentName}; skipping`
        )
      } else {
        console.error(err)
      }
    } else {
      console.log(
        `inserted results for completed tournament ${
          tournamentResult.tournamentName
        }`
      )
      console.log("checking if running tournament exists...")
      RunningTournament.findOne(
        { uniqueId: tournamentResult.uniqueId },
        (err, existing) => {
          if (err) {
            console.log("error when trying to find running tournament:")
            console.error(err)
          } else {
            const addonRebuyTotalMap = {}
            if (existing) {
              existing.players.forEach(player => {
                addonRebuyTotalMap[player.playerName] = player.rebuyAmount
              })

              tournamentResult.results.forEach((player, idx) => {
                tournamentResult.results[idx].rebuyAmount =
                  addonRebuyTotalMap[player.playerName]
              })
              tournamentResult.save(err => {
                if (err) {
                  console.error("unable to update completed tournament")
                  console.error(err)
                } else {
                  console.log("updated completed tournament")
                }
              })

              existing.deleteOne(
                { uniqueId: tournamentResult.uniqueId },
                err => {
                  if (err) {
                    console.log(
                      "error while trying to delete exisitng running tournament " +
                        tournamentResult.uniqueId
                    )
                    console.error(err)
                  }
                }
              )
            }
          }
        }
      )
    }
  })
}

const insertRunning = runningTournament => {
  runningTournament.save(err => {
    if (err) {
      if (err.code === 11000) {
        console.log(
          `duplicate running tournament ${
            runningTournament.tournamentName
          }; attepmting update`
        )
        RunningTournament.findOne(
          { uniqueId: runningTournament.uniqueId },
          (err, existing) => {
            if (err) {
              console.log(
                "unable to update running tournament with uid " +
                  runningTournament.uniqueId
              )
              console.error(err)
            } else {
              if (existing) {
                existing.players = runningTournament.players
                existing.lastUpdate = new Date().getTime()
                existing.save(err => {
                  if (err) {
                    console.log(
                      "unable to update running tournament with uid " +
                        runningTournament.uniqueId
                    )
                    console.error(err)
                  } else {
                    console.log(
                      `successfully updated running tournament ${
                        runningTournament.tournamentName
                      } (${runningTournament.uniqueId})`
                    )
                  }
                })
              }
            }
          }
        )
      } else {
        console.error(err)
      }
    } else {
      console.log(
        `inserted results for running tournament ${
          runningTournament.tournamentName
        }`
      )
    }
  })
}

const insertRegistering = registeringTournament => {
  registeringTournament.save(err => {
    if (err) {
      if (err.code === 11000) {
        console.log(
          `duplicate registering tournament ${
            registeringTournament.tournamentName
          }; attepmting update`
        )
        RegisteringTournament.findOne(
          { uniqueId: registeringTournament.uniqueId },
          (err, existing) => {
            if (err) {
              console.log(
                "unable to update registering tournament with uid " +
                  registeringTournament.uniqueId
              )
              console.error(err)
            } else {
              if (existing) {
                existing.players = registeringTournament.players
                existing.lastUpdate = new Date().getTime()
                existing.save(err => {
                  if (err) {
                    console.log(
                      "unable to update registering tournament with uid " +
                        registeringTournament.uniqueId
                    )
                    console.error(err)
                  } else {
                    console.log(
                      `successfully updated registering tournament ${
                        registeringTournament.tournamentName
                      } (${registeringTournament.uniqueId})`
                    )
                  }
                })
              }
            }
          }
        )
      } else {
        console.error(err)
      }
    } else {
      console.log(
        `inserted results for registering tournament ${
          registeringTournament.tournamentName
        }`
      )
    }
  })
}

const pruneRegistering = ms => {
  let targetDate = new Date()
  targetDate.setTime(targetDate.getTime() - ms)
  console.log(
    `pruning all registering tournaments last updated before ${targetDate}...`
  )

  RegisteringTournament.deleteMany(
    { lastUpdated: { $lt: targetDate } },
    err => {
      if (err) {
        console.log("Error while trying to prune registered tournaments")
        console.error(err)
      } else {
        console.log("sucessfully pruned registering tournaments")
      }
    }
  )
}

const deleteRunning = uid => {}

const Tournament = (id, name, tt) => {
  return {
    tournamentId: id,
    tournamentName: name,
    tt: tt
  }
}

const waitFor = async timeToWait => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, timeToWait)
  })
}

const createTournamentResult = (data, config) => {
  const {
    tournamentId,
    tournamentName,
    tournamentState,
    tournamentType,
    buyin,
    entryFee,
    bounty,
    startDate,
    endDate,
    results
  } = data

  const uniqueId = `${config.tournamentIdPrefix}_${tournamentId}`
  const { site, currency } = config

  return new TournamentResult({
    uniqueId,
    site,
    tournamentId,
    tournamentName,
    tournamentState: tournamentState,
    tournamentType: tournamentType,
    buyin,
    entryFee,
    bounty,
    startDate,
    endDate,
    bitcoinValue: null,
    currency,
    results
  })
}

const createRunningTournament = (data, config) => {
  const {
    tournamentId,
    tournamentName,
    tournamentState,
    tournamentType,
    buyin,
    entryFee,
    bounty,
    startDate,
    endDate,
    results
  } = data
  const uniqueId = `${config.tournamentIdPrefix}_${tournamentId}`
  const { site, currency } = config
  const lastUpdate = new Date().getTime()

  return new RunningTournament({
    uniqueId,
    tournamentId,
    tournamentName,
    tournamentState,
    tournamentType,
    site,
    lastUpdate,
    players: results
  })
}

const createRegisteringTournament = (data, config) => {
  const {
    tournamentId,
    tournamentName,
    tournamentState,
    tournamentType,
    buyin,
    entryFee,
    bounty,
    startDate,
    endDate,
    results
  } = data
  const uniqueId = `${config.tournamentIdPrefix}_${tournamentId}`
  const { site, currency } = config
  const lastUpdate = new Date().getTime()

  return new RegisteringTournament({
    uniqueId,
    tournamentId,
    tournamentName,
    site,
    lastUpdate,
    tournamentState,
    tournamentType,
    players: results
  })
}

const TournamentDetail = lobbyTournamentInfo => {
  const id = lobbyTournamentInfo.info.i
  const state = getTournamentState(lobbyTournamentInfo)
  const tournamentType = getTournamentType(lobbyTournamentInfo)
  const tournamentState = getTournamentState(lobbyTournamentInfo)
  const name = lobbyTournamentInfo.info.n
  const startDate = lobbyTournamentInfo.info.sd
  const endDate = state === "completed" ? lobbyTournamentInfo.info.le : null
  const buyIn = (lobbyTournamentInfo.info.b || 0) / 100
  const entryFee = (lobbyTournamentInfo?.info?.e || 0) / 100
  const bounty = (lobbyTournamentInfo.info.bkv || 0) / 100

  return {
    tournamentState: tournamentState,
    tournamentType: tournamentType,
    tournamentId: id,
    tournamentName: name,
    buyin: buyIn,
    entryFee: entryFee,
    startDate: startDate,
    endDate: endDate,
    bounty: bounty,
    results: [],
    receivedPlayerData: false
  }
}

// mentState._NKtMf},TournamentState}(n(1).a);r._7K9Pm=65,r._5mmXv=71,r._09mww=83,r.
const parseTournamentList = data => {
  if (data.tournaments[0]?.n) {
    return data.tournaments
      .map((item, idx) => {
        return Tournament(item.i, item.n, item.tt)
      })
      .filter(
        tournament => tournament.tournamentId && tournament.tournamentName
      )
  }
  return null
}

const parseLobbyTournamentInfo = data => {
  if (data?.info?.n) {
    return TournamentDetail(data)
  }
}

const getTournamentState = tournamentData => {
  const stateMap = {
    65: "announced",
    71: "registering",
    83: "seating",
    82: "running",
    67: "cancelled",
    68: "completed",
    85: "unfinished"
  }
  if (tournamentData?.t !== "LobbyTournamentInfo" || !tournamentData?.info?.s) {
    throw "Invalid tournament info"
  }

  return stateMap[tournamentData.info.s]
}

const getTournamentType = tournamentData => {
  const typeMap = {
    71: "sit-and-go",
    83: "scheduled",
    77: "manual"
  }

  if (
    tournamentData?.t !== "LobbyTournamentInfo" ||
    !tournamentData?.info?.tt
  ) {
    throw "Invalid tournament info"
  }

  return typeMap[tournamentData.info.tt]
}

const initialMessage = msgId => {
  return {
    clientVersion: "HTML5",
    locale: "en",
    protocolVersion: 0,
    skinName: "stockpoker",
    id: msgId,
    t: "ClientVersion"
  }
}

const tournamentListMessage = () => {
  return {
    tournamentType: -1,
    t: "GetTournamentsList"
  }
}

const lobbyTournamentInfoMessage = tournamentId => {
  return {
    tournamentId: tournamentId,
    t: "GetLobbyTournamentInfo"
  }
}

const tournamentPlayersMessage = tournamentId => {
  return {
    tournamentId: tournamentId,
    offset: 0,
    amount: -1,
    sortBy: "",
    t: "GetTournamentPlayers"
  }
}

const generateLobbyTournamentInfoMessages = tournamentList => {
  return tournamentList.map(t => {
    const message = lobbyTournamentInfoMessage(t.tournamentId)
    return message
  })
}

const subscribeTournamentMessage = tournamentId => {
  return { tournamentId: tournamentId, t: "SubscribeTournament" }
}

const parsePlayerData = (playerDataResponse, tState, tType) => {
  if (tState === "registering" && !playerDataResponse?.players) {
    return []
  }

  if (!playerDataResponse?.players || !playerDataResponse?.players[0]?.n) {
    return null
  }

  const unsortedPlayers = playerDataResponse.players.map(player => {
    const bp = player?.bp || 0
    const eb = player?.eb || 0
    const rf = player?.rf || 0
    const ma = player?.ma || 0
    const nr = player?.nr || 1
    const na = player?.na || 0

    const pdata = {
      playerName: player.n,
      position: (player?.p || 0) + 1,
      prize1: ma / 100,
      prize2: bp / 100,
      totalPrize: (ma + bp) / 100,
      numAddons: na,
      chips: player.c
    }

    if (tState === "running") pdata["rebuyAmount"] = (eb + rf) / 100

    return pdata
  })

  return unsortedPlayers
}

const processPlayersRegistering = unsortedPlayers => {
  if (unsortedPlayers.length === 0) {
    return []
  }

  const dbUnsortedPlayers = unsortedPlayers.map((player, idx) => {
    return new PlayerPosition({ ...player, position: idx + 1 })
  })
}

const processPlayersRunning = unsortedPlayers => {
  const dbUnsortedPlayers = unsortedPlayers.map(player => {
    return new PlayerPosition({ ...player })
  })

  let eliminated = dbUnsortedPlayers.filter(player => player.position > 0)
  let stillPlaying = dbUnsortedPlayers.filter(player => player.position === 0)

  stillPlaying = stillPlaying.sort((a, b) => (a.chips < b.chips ? 1 : -1))
  eliminated = eliminated.sort((a, b) => (a.position > b.position ? 1 : -1))
  for (let j = 1; j <= stillPlaying.length; j++) {
    stillPlaying[j - 1].position = j
  }

  const runningSortedPlayers = stillPlaying.concat(eliminated)
  return runningSortedPlayers
}

const processPlayersCompleted = unsortedPlayers => {
  const winners = unsortedPlayers.filter(player => player.position === 1)
  const losers = unsortedPlayers.filter(player => player.position > 1)

  const sortedWinners = winners.sort((a, b) => (a.prize1 < b.prize1 ? 1 : -1))
  for (let i = 0; i < sortedWinners.length; i++) {
    sortedWinners[i].position = i + 1
  }
  const sortedLosers = losers.sort((a, b) => (a.position > b.position ? 1 : -1))

  const sortedPlayers = sortedWinners.concat(sortedLosers)
  const databaseSortedPlayers = sortedPlayers.map(player => {
    return new PlayerPosition({ ...player })
  })

  for (let i = 0; i < sortedPlayers.legnth; i++) {
    sortedPlayers[i]["prize1"] = sortedPlayers[i]["prize1"] / 100
    sortedPlayers[i]["prize2"] = sortedPlayers[i]["prize2"] / 100
    sortedPlayers[i]["totalPrize"] = sortedPlayers[i]["totalPrize"] / 100
  }
  return sortedPlayers
}

module.exports = {
  initialMessage,
  tournamentListMessage,
  lobbyTournamentInfoMessage,
  Tournament,
  parseLobbyTournamentInfo,
  parseTournamentList,
  generateLobbyTournamentInfoMessages,
  tournamentPlayersMessage,
  parsePlayerData,
  subscribeTournamentMessage,
  processPlayersCompleted,
  processPlayersRunning,
  processPlayersRegistering,
  createTournamentResult,
  waitFor,
  insertCompleted,
  createRunningTournament,
  createRegisteringTournament,
  insertRunning,
  insertRegistering,
  pruneRegistering
}
