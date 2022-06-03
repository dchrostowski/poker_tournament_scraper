const WebSocket = require("ws")
const fs = require("fs")

const {
  initialMessage,
  tournamentListMessage,
  lobbyTournamentInfoMessage,
  Tournament,
  parseTournamentList,
  parseLobbyTournamentInfo,
  generateLobbyTournamentInfoMessages,
  parsePlayerData,
  tournamentPlayersMessage,
  subscribeTournamentMessage,
  processPlayersCompleted,
  processPlayersRunning,
  processPlayersRegistering,
  createTournamentResult,
  createRunningTournament,
  createRegisteringTournament
} = require("./util")

const GenericWebSocketScraper = async (config, callback) => {
  const {
    socketUrl,
    site,
    tournamentIdPrefix,
    currency,
    cryptocurrency
  } = config
  const ws = new WebSocket(socketUrl)
  console.log("Getting tournament data for " + config.site + "...")

  const socketData = {
    tournamentNames: {},
    msgId: 1002,
    tournamentList: [],
    state: "init",
    tournamentData: {},
    completedIDs: [],
    runningIDs: [],
    authorized: false,
    complete: false,
    start: new Date().getTime(),
    runningTournamentList: [],
    completedTournamentList: [],
    missingData: {},
    registeringIDs: []
  }

  const export_final_data = () => {
    const filtered = Object.values(socketData.tournamentData).filter(
      t =>
        ["running", "completed", "registering"].indexOf(t.tournamentState) !==
        -1
    )

    return filtered.map(tournamentData => {
      switch (tournamentData.tournamentState) {
        case "running": {
          return createRunningTournament(tournamentData, config)
        }
        case "registering": {
          return createRegisteringTournament(tournamentData, config)
        }
        case "completed": {
          return createTournamentResult(tournamentData, config)
        }
      }
    })
  }

  const export_final_data2 = () => {
    const runningTournamentData = {}
    const completedTournamentData = {}
    const registeringTournamentData = {}
    const runningTournamentList = []
    const completedTournamentList = []
    const registeringTournamentList = []
    socketData.runningIDs.forEach(tId => {
      runningTournamentData[tId] = createRunningTournament(
        socketData.tournamentData[tId],
        config
      )
      runningTournamentList.push(runningTournamentData[tId])
    })

    socketData.completedIDs.forEach(tId => {
      completedTournamentData[tId] = createTournamentResult(
        socketData.tournamentData[tId],
        config
      )
      completedTournamentList.push(completedTournamentData[tId])
    })

    socketData.registeringIDs.forEach(tId => {
      registeringTournamentData[tId] = createRegisteringTournament(
        socketData.tournamentData[tId],
        config
      )
      registeringTournamentList.push(registeringTournamentData[tId])
    })

    return {
      running: runningTournamentList,
      completed: completedTournamentList,
      registering: registeringTournamentList
    }
  }

  const isComplete = () => {
    console.log(1)
    if (socketData.complete) {
      return true
    }
    const now = new Date().getTime()
    const elapsed = now - socketData.start
    if (elapsed > 180000) {
      console.log("timeout occurred")
      const all = export_final_data()
      callback(all)
      socketData.complete = true
      return socketData.complete
    }
    console.log(2)

    if (socketData.state !== "lobbyInfo" && socketData.state !== "playerData")
      return false

    if (socketData.state === "lobbyInfo") {
      console.log(3)
      if (socketData.tournamentList.length === 0) return false
      console.log(4)

      if (socketData.complete) return true
      for (let i = 0; i < socketData.tournamentList.length; i++) {
        let tId = socketData.tournamentList[i].tournamentId
        if (!socketData.tournamentData.hasOwnProperty(tId)) {
          socketData.missingData[tId] = (socketData.missingData[tId] || 0) + 1
          console.log(
            `\nmissing data for ${tId} - ${socketData.tournamentNames[tId]} ${
              socketData.missingData[tId]
            } times\n`
          )
          return false
        }
      }

      socketData.state = "playerData"
    }

    const runningAndCompletedIds = socketData.completedIDs
      .concat(socketData.runningIDs)
      .concat(socketData.registeringIDs)

    for (let i = 0; i < runningAndCompletedIds.length; i++) {
      let tId = runningAndCompletedIds[i]
      if (!socketData.tournamentData[tId].receivedPlayerData) {
        // console.log(
        //   `missing player data for ${tId} - ${
        //     socketData.tournamentNames[tId]
        //   } - type ${socketData.tournamentData[tId].tournamentType}`
        // )
        return false
      }
    }

    socketData.complete = true
    const parsedTournaments = export_final_data()

    callback(parsedTournaments)
    socketData.complete = true
    return socketData.complete
  }

  const incrementMsgId = () => {
    socketData.msgId = socketData.msgId + 1
  }

  const isAuthorized = response => {
    if (socketData.authorized) return true
    socketData.authorized = Boolean(response?.auth)
    return socketData.authorized
  }

  ws.on("open", function open() {
    console.log("connected")
    ws.send(JSON.stringify(initialMessage(socketData.msgId)), incrementMsgId)
  })

  const ping = setInterval(() => {
    ws.send(
      JSON.stringify({ ...tournamentListMessage(), id: socketData.msgId }),
      incrementMsgId
    )
  }, 5000)

  ws.on("close", function close(code, reason) {
    console.log(`${code}: ${reason.toString()}`)
    console.log("websocket disconnected")
    clearInterval(ping)
    return socketData
  })

  ws.on("message", function message(data) {
    if (socketData.tournamentList.length > 0 && socketData.state === "init") {
      socketData.state = "lobbyInfo"
      console.log("entered lobbyInfo state")
      const messages = generateLobbyTournamentInfoMessages(
        socketData.tournamentList
      )

      messages.forEach((message, idx) => {
        setTimeout(() => {
          console.log(
            `requesting LOBBY data for tournament ID ${
              message.tournamentId
            } - ${socketData.tournamentNames[message.tournamentId]}`
          )
          ws.send(
            JSON.stringify({ ...message, id: socketData.msgId }),
            incrementMsgId
          )
        }, idx * 250)
      })
    }

    if (isComplete()) {
      console.log("data extraction complete")
      ws.close()
    }

    const jsonResponse = JSON.parse(data.toString())

    switch (jsonResponse.t) {
      case "TournamentPlayers":
        console.log(
          `received PLAYER data for tournament ID ${
            jsonResponse.tournamentId
          } - ${socketData.tournamentNames[jsonResponse.tournamentId]}`
        )

        const tournamentState =
          socketData.tournamentData[jsonResponse.tournamentId].tournamentState
        const playerData = parsePlayerData(jsonResponse, tournamentState)

        if (playerData === null) {
          console.log(
            `Failed to parse player data for tournament ID ${
              jsonResponse.tournamentId
            }`
          )
        } else {
          if (tournamentState === "running") {
            const sortedPlayerData = processPlayersRunning(playerData)
            socketData.tournamentData[
              jsonResponse.tournamentId
            ].results = sortedPlayerData
            socketData.tournamentData[
              jsonResponse.tournamentId
            ].receivedPlayerData = true
          }
          if (tournamentState === "completed") {
            const sortedPlayerData = processPlayersCompleted(playerData)

            socketData.tournamentData[
              jsonResponse.tournamentId
            ].results = sortedPlayerData
            socketData.tournamentData[
              jsonResponse.tournamentId
            ].receivedPlayerData = true
          }

          if (tournamentState === "registering") {
            const sortedPlayerData = processPlayersRegistering(playerData)
            socketData.tournamentData[
              jsonResponse.tournamentId
            ].results = sortedPlayerData
            socketData.tournamentData[
              jsonResponse.tournamentId
            ].receivedPlayerData = true
          }
        }

        break
      case "LobbyTournamentInfo": {
        const tDetail = parseLobbyTournamentInfo(jsonResponse)
        socketData.tournamentData[tDetail.tournamentId] = tDetail
        console.log(
          `received LOBBY data for ${tDetail.tournamentState} tournament ${
            tDetail.tournamentId
          } - ${tDetail.tournamentName}`
        )

        if (tDetail.tournamentState === "completed") {
          console.log(
            `requesting PLAYER data for completed tournament ${
              tDetail.tournamentId
            } - ${tDetail.tournamentName}`
          )
          socketData.completedIDs.push(tDetail.tournamentId)
          ws.send(
            JSON.stringify({
              ...subscribeTournamentMessage(tDetail.tournamentId),
              id: socketData.msgId
            }),
            () => {
              incrementMsgId()
              ws.send(
                JSON.stringify({
                  ...tournamentPlayersMessage(tDetail.tournamentId),
                  id: socketData.msgId
                }),
                incrementMsgId
              )
            }
          )
        }
        if (tDetail.tournamentState === "running") {
          socketData.runningIDs.push(tDetail.tournamentId)
          console.log(
            `requesting PLAYER data for running tournament ${
              tDetail.tournamentId
            } - ${tDetail.tournamentName}`
          )
          ws.send(
            JSON.stringify({
              ...subscribeTournamentMessage(tDetail.tournamentId),
              id: socketData.msgId
            }),
            () => {
              incrementMsgId()
              ws.send(
                JSON.stringify({
                  ...tournamentPlayersMessage(tDetail.tournamentId),
                  id: socketData.msgId
                }),
                incrementMsgId
              )
            }
          )
        }

        if (
          tDetail.tournamentState === "registering" &&
          tDetail.tournamentType !== "sit-and-go"
        ) {
          console.log(
            `requesting PLAYER data for registering tournament ${
              tDetail.tournamentId
            } - ${tDetail.tournamentName}`
          )
          socketData.registeringIDs.push(tDetail.tournamentId)
          ws.send(
            JSON.stringify({
              ...subscribeTournamentMessage(tDetail.tournamentId),
              id: socketData.msgId
            }),
            () => {
              incrementMsgId()
              ws.send(
                JSON.stringify({
                  ...tournamentPlayersMessage(tDetail.tournamentId),
                  id: socketData.msgId
                }),
                incrementMsgId
              )
            }
          )
        }
        break
      }
      case "TournamentsList": {
        const tournamentList = parseTournamentList(jsonResponse)

        if (tournamentList !== null && socketData.tournamentList.length === 0) {
          socketData.tournamentList = tournamentList
          tournamentList.forEach(tourn => {
            socketData.tournamentNames[tourn.tournamentId] =
              tourn.tournamentName
          })
        }
        break
      }
      default: {
        console.log(`got unhandled |${jsonResponse.t}| message `)
      }
    }

    if (isAuthorized(jsonResponse)) {
      if (socketData.tournamentList.length === 0) {
        setTimeout(function timeout() {
          ws.send(
            JSON.stringify({
              ...tournamentListMessage(),
              id: socketData.msgId
            }),
            incrementMsgId
          )
        }, 2000)
      }
    }
  })
}

exports.GenericWebSocketScraper = GenericWebSocketScraper
