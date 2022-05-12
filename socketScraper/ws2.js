const WebSocket = require("ws");

const {
  initialMessage,
  tournamentListMessage,
  lobbyTournamentInfoMessage,
  Tournament,
  parseTournamentList,
  parseLobbyTournamentInfo,
  generateLobbyTournamentInfoMessages,
  parsePlayerData
} = require("./util");

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
    if (socketData.state !== "playerData") return false;

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
      console.log("entered playerData state")
    }

    const runningAndCompletedIds = socketData.completedIDs.concat(socketData.runningIDs)

    for (let i = 0; i<runningAndCompletedIds.length; i++) {
        let tId = runningAndCompletedIds[i]
        if(!socketData.tournamentData[tId].recievedPlayerData) {
            return false
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
    ws.send(initialMessage(socketData.msgId), incrementMsgId);
  });

  const ping = setInterval(() => {
    ws.send(tournamentListMessage(socketData.msgId), incrementMsgId);
  }, 5000);

  ws.on("close", function close(code, reason) {
    console.log(`${code}: ${reason.toString()}`);
    console.log("disconnected");
    clearInterval(ping);
  });

  ws.on("message", function message(data) {
    if (socketData.tournamentList.length > 0 && socketData.state === "init") {
      socketData.state = "lobbyInfo";
      console.log("entered lobbyInfo state")
      const messages = generateLobbyTournamentInfoMessages(
        socketData.tournamentList
      );

      messages.forEach((message, idx) => {
        setTimeout(() => {
          console.log("sending message " + idx);
          ws.send({ ...message, id: socketData.msgId }, incrementMsgId);
        }, idx * 300);
      });
    }

    if (isComplete()) {
      console.log("data extraction complete");
      ws.close();
    }

    const jsonResponse = JSON.parse(data.toString());

    switch (jsonResponse.t) {
      case "GetTournamentPlayers":

      case "LobbyTournamentInfo":
        const tDetail = parseLobbyTournamentInfo(jsonResponse);
        socketData.tournamentData[tDetail.tournamentId] = tDetail;
        if (tDetail.state === "completed") {
          socketData.completedIDs.push(tDetail.tournamentId);
          ws.send(
            { ...tournamentPlayersMessage(), id: socketData.msgId },
            incrementMsgId
          );
        }
        if (tDetail.state === "running") {
          socketData.runningIDs.push(tDetail.tournamentId);
          ws.send(
            { ...tournamentPlayersMessage(), id: socketData.msgId },
            incrementMsgId
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
            { ...tournamentListMessage(), id: socketData.msgId },
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
