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
    msgId: 1001,
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
    console.log("isCopmlete1")
    console.log(socketData.state)

    

    if (socketData.state !== "lobbyInfo") return false;
    
    
    if (socketData.state === "lobbyInfo") {
      if (socketData.tournamentList.length === 0) return false;
      console.log(1)
      if (socketData.complete) return true;
      for (let i = 0; i < socketData.tournamentList.length; i++) {
        let tId = socketData.tournamentList[i].tournamentId;
        if (!socketData.tournamentData.hasOwnProperty(tId)) {
          console.log(`missing tournament id ${tId}`)
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
    setTimeout(() => {
      ws.send(JSON.stringify(initialMessage(socketData.msgId)), incrementMsgId);

    }, 2000)
    
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
      socketData.state = 'lobbyInfo'
      
      const messages = generateLobbyTournamentInfoMessages(
        socketData.tournamentList
      );
      console.log("messages:")
      console.log(messages)

      messages.forEach((message, idx) => {
        setTimeout(() => {
          //console.log(`requesting data for tournament ID ${message.tournamentId}`);
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
            //console.log(`Failed to parse player data for tournament ID ${jsonResponse.tournamentId}`)
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
        console.log("got lobby tournament info")
        const tDetail = parseLobbyTournamentInfo(jsonResponse);
        socketData.tournamentData[tDetail.tournamentId] = tDetail;
        //console.log(`received data for ${tDetail.state} tournament ${tDetail.tournamentName}`)
        //console.log(tDetail.state)
        
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
        
        if (tournamentList !== null) socketData.tournamentList = tournamentList;
        console.log(tournamentList)
        console.log('-=---------------------------------------')
        break;

      default:
        console.log(`got unhandled |${jsonResponse.t}| message `);
    }

    if (isAuthorized(jsonResponse)) {
      if (socketData.tournamentList.length === 0 && socketData.state === 'lobbyInfo1') {
        //console.log("requesting list of tournaments...")
        socketData.state = 'lobbyInfo2'
        setTimeout(function timeout() {
          
          
          
          if(socketData.state === 'init') {
            ws.send(
              JSON.stringify({
                ...tournamentListMessage(),
                id: socketData.msgId,
              }),
              () => { console.log("sent list message"); incrementMsgId(); socketData.state = "lobbyInfo1" }
            );

          }
          
        }, 2000);
      }
    }
  });
};


exports.GenericWebSocketScraper = GenericWebSocketScraper

