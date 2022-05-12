const WebSocket = require("ws");

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
} = require("./util");
console.log(subscribeTournamentMessage);

const getTournamentData = (socketUrl) => {
  const ws = new WebSocket(socketUrl);

  const socketData = {
    msgId: 1002,
    tournamentList: [],
    state: "init",
    tournamentData: {},
    completedIDs: [],
    runningIDs: [],
    authorized: false,
    complete: false,
  };

  const isComplete = () => {
    if (socketData.state !== "lobbyInfo") return false;

    if (socketData.state === "lobbyInfo") {
      if (socketData.tournamentList.length === 0) return false;
      if (socketData.complete) return true;
      for (let i = 0; i < socketData.tournamentList.length; i++) {
        let tId = socketData.tournamentList[i].tournamentId;
        if (!socketData.tournamentData.hasOwnProperty(tId)) {
          console.log(`${tId} is missing`);
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
    console.log(JSON.stringify(socketData));
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
    console.log("disconnected");
    clearInterval(ping);
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
          console.log("sending message " + idx);
          ws.send(
            JSON.stringify({ ...message, id: socketData.msgId }),
            incrementMsgId
          );
        }, idx * 500);
      });
    }

    if (isComplete()) {
      console.log("data extraction complete");
      ws.close();
    }

    const jsonResponse = JSON.parse(data.toString());

    switch (jsonResponse.t) {
      case "TournamentPlayers":
        console.log("tournament players");
        console.log(jsonResponse.players)

        const playerData = parsePlayerData(jsonResponse);
        const tournamentState =
          socketData.tournamentData[jsonResponse.tournamentId].state;

        if (playerData === null) {
            console.log('null')
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
            console.log(jsonResponse.players.length);
            console.log(playerData);
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
        console.log("got tDetail");
        console.log(tDetail.state);
        if (tDetail.state === "completed") {
          console.log(
            "requesting player data for completed tournament" +
              tDetail.tournamentName
          );
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
          console.log(
            "requesting player data for running tournament" +
              tDetail.tournamentName
          );
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
        console.log("tournament list:");
        console.log(tournamentList);
        if (tournamentList !== null) socketData.tournamentList = tournamentList;
        break;
      default:
        console.log(`got unhandled |${jsonResponse.t}| message `);
    }

    if (isAuthorized(jsonResponse)) {
      if (socketData.tournamentList.length === 0) {
        setTimeout(function timeout() {
          ws.send(
            JSON.stringify({
              ...tournamentListMessage(),
              id: socketData.msgId,
            }),
            incrementMsgId
          );
          // ws.send(getTournamentListMessage(socketData.msgId), (err) => {
          //     if(err) raise(err)
          //     socketData.msgId = socketData.msgId + 1
          // })
        }, 2000);
      }
    }
  });
};

getTournamentData("wss://web.stockpokeronline.com/front");
