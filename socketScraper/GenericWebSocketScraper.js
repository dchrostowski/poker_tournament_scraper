const WebSocket = require("ws");
const fs = require('fs')

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
  createTournamentResult,
  createRunningTournament
} = require("./util");





const GenericWebSocketScraper = async (config, callback) => {
  const {socketUrl, site, tournamentIdPrefix, currency, cryptocurrency} = config
  const ws = new WebSocket(socketUrl);
  console.log("Getting tournament data for " + config.site + "...")

  const socketData = {
    msgId: 1002,
    tournamentList: [],
    state: "init",
    tournamentData: {},
    completedIDs: [],
    runningIDs: [],
    authorized: false,
    complete: false,
    start: new Date().getTime()
  };

  const isComplete = () => {
    if(socketData.complete) {
      return true
    }
    const now = new Date().getTime()
    const elapsed = now - socketData.start
    if(elapsed > 180000) {
      console.log("timeout occurred")
      callback([],[])
      socketData.complete = true
      return socketData.complete
    }

    if (socketData.state !== "lobbyInfo") return false;

    if (socketData.state === "lobbyInfo") {
      if (socketData.tournamentList.length === 0) return false;
      if (socketData.complete) return true;
      for (let i = 0; i < socketData.tournamentList.length; i++) {
        let tId = socketData.tournamentList[i].tournamentId;
        if (!socketData.tournamentData.hasOwnProperty(tId)) {
          return false;
        }
      }

      socketData.state = "playerData";
      console.log("entered playerData state");
    }

    const runningAndCompletedIds = socketData.completedIDs.concat(
      socketData.runningIDs
    );

    for (let i = 0; i < runningAndCompletedIds.length; i++) {
      let tId = runningAndCompletedIds[i];
      if (!socketData.tournamentData[tId].receivedPlayerData) {
        return false;
      }
    }

    socketData.complete = true;
    const runningTournamentData = {}
    const completedTournamentData = {}
    const runningTournamentList = []
    const completedTournamentList = []
    socketData.runningIDs.forEach((tId) => {
      runningTournamentData[tId] = createRunningTournament(socketData.tournamentData[tId], config)
      runningTournamentList.push(runningTournamentData[tId])
    })

    socketData.completedIDs.forEach((tId) => {
      completedTournamentData[tId] = createTournamentResult(socketData.tournamentData[tId], config)
      completedTournamentList.push(completedTournamentData[tId])
    })

    
    fs.writeFile('./running.json',JSON.stringify(runningTournamentData), err => console.error(err))

    fs.writeFile('./completed.json', JSON.stringify(completedTournamentData), err => console.error(err))
    callback(runningTournamentList, completedTournamentList)
    socketData.complete = true
    return socketData.complete;
  };

  const incrementMsgId = () => {
    socketData.msgId = socketData.msgId + 1;
  };

  const isAuthorized = (response) => {
    if (socketData.authorized) return true;
    socketData.authorized = Boolean(response?.auth);
    return socketData.authorized;
  };

  ws.on("open", function open() {
    console.log("connected");
    ws.send(JSON.stringify(initialMessage(socketData.msgId)), incrementMsgId);
  });

  const ping = setInterval(() => {
    ws.send(
      JSON.stringify({ ...tournamentListMessage(), id: socketData.msgId }),
      incrementMsgId
    );
  }, 5000);

  ws.on("close", function close(code, reason) {
    console.log(`${code}: ${reason.toString()}`);
    console.log("websocket disconnected");
    clearInterval(ping);
    return socketData
  });

  ws.on("message", function message(data) {
    if (socketData.tournamentList.length > 0 && socketData.state === "init") {
      socketData.state = "lobbyInfo";
      console.log("entered lobbyInfo state");
      const messages = generateLobbyTournamentInfoMessages(
        socketData.tournamentList
      );

      messages.forEach((message, idx) => {
        setTimeout(() => {
          console.log(`requesting data for tournament ID ${message.tournamentId}`);
          ws.send(
            JSON.stringify({ ...message, id: socketData.msgId }),
            incrementMsgId
          );
        }, idx * 250);
      });
    }

    if (isComplete()) {
      console.log("data extraction complete");
      ws.close();
    }

    const jsonResponse = JSON.parse(data.toString());

    switch (jsonResponse.t) {
      case "TournamentPlayers":
        console.log(`received player data for tournament ID ${jsonResponse.tournamentId}`)
        
        
        
        const tournamentState =
          socketData.tournamentData[jsonResponse.tournamentId].state;
          const playerData = parsePlayerData(jsonResponse, tournamentState);

        if (playerData === null) {
            console.log(`Failed to parse player data for tournament ID ${jsonResponse.tournamentId}`)
        } else {
          if (tournamentState === "running") {
            
            const sortedPlayerData = processPlayersRunning(playerData);
            socketData.tournamentData[jsonResponse.tournamentId].results =
              sortedPlayerData;
            socketData.tournamentData[
              jsonResponse.tournamentId
            ].receivedPlayerData = true;
          }
          if (tournamentState === "completed") {
            
            const sortedPlayerData = processPlayersCompleted(playerData);
            
              socketData.tournamentData[jsonResponse.tournamentId].results =
                sortedPlayerData;
              socketData.tournamentData[
                jsonResponse.tournamentId
              ].receivedPlayerData = true;
           
          }
        }

        break;
      case "LobbyTournamentInfo":
        const tDetail = parseLobbyTournamentInfo(jsonResponse);
        socketData.tournamentData[tDetail.tournamentId] = tDetail;
        console.log(`received data for ${tDetail.state} tournament ${tDetail.tournamentName}`)
        
        if (tDetail.state === "completed") {
          console.log(`requesting player data for completed tournament ${tDetail.tournamentName}`);
          socketData.completedIDs.push(tDetail.tournamentId);
          ws.send(
            JSON.stringify({
              ...subscribeTournamentMessage(tDetail.tournamentId),
              id: socketData.msgId,
            }),
            () => {
              incrementMsgId();
              ws.send(
                JSON.stringify({
                  ...tournamentPlayersMessage(tDetail.tournamentId),
                  id: socketData.msgId,
                }),
                incrementMsgId
              );
            }
          );
        }
        if (tDetail.state === "running") {
          socketData.runningIDs.push(tDetail.tournamentId);
          console.log(`requesting player data for running tournament ${tDetail.tournamentName}`);
          ws.send(
            JSON.stringify({
              ...subscribeTournamentMessage(tDetail.tournamentId),
              id: socketData.msgId,
            }),
            () => {
              incrementMsgId();
              ws.send(
                JSON.stringify({
                  ...tournamentPlayersMessage(tDetail.tournamentId),
                  id: socketData.msgId,
                }),
                incrementMsgId
              );
            }
          );
        }
        break;
      case "TournamentsList":
        const tournamentList = parseTournamentList(jsonResponse);
        //console.log("Received list of tournaments");
        if (tournamentList !== null) socketData.tournamentList = tournamentList;
        break;
      default:
        console.log(`got unhandled |${jsonResponse.t}| message `);
    }

    if (isAuthorized(jsonResponse)) {
      if (socketData.tournamentList.length === 0) {
        //console.log("requesting list of tournaments...")
        setTimeout(function timeout() {
          ws.send(
            JSON.stringify({
              ...tournamentListMessage(),
              id: socketData.msgId,
            }),
            incrementMsgId
          );
        }, 2000);
      }
    }
  });
};


exports.GenericWebSocketScraper = GenericWebSocketScraper

