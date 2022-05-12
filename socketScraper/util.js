// (r._jCFcX = 65), //announced
// (r._x1Qpu = 71), // registering
// (r._u0W9A = 83), //seating
// (r._5yiix = 82), // running
// (r._x3WqU = 67), // cancelled
// (r._fwdNH = 68), // done
// (r._VKOY7 = 85), // unfinished
// (t.a = r);

const Tournament = (id, name) => {
  return {
    tournamentId: id,
    tournamentName: name,
  };
};

const TournamentDetail = (lobbyTournamentInfo) => {
  const state = getTournamentState(lobbyTournamentInfo);
  const id = lobbyTournamentInfo.info.i;
  const name = lobbyTournamentInfo.info.n;
  const startDate = lobbyTournamentInfo.info.sd;
  const endDate = state === "completed" ? lobbyTournamentInfo.info.le : null;
  const buyIn = lobbyTournamentInfo.info.b / 100;
  const entryFee = lobbyTournamentInfo.info.e / 100;
  const bounty = lobbyTournamentInfo.info.bkv || 0;

  return {
    state: state,
    tournamentId: id,
    tournamentName: name,
    buyin: buyIn,
    entryFee: entryFee,
    startDate: startDate,
    endDate: endDate,
    results: [],
    recievedPlayerData: false,
  };
};

const parseTournamentList = (data) => {
  console.log("parse tournament list");
  if (data.tournaments[0]?.n) {
    return data.tournaments.map((item, idx) => {
      return Tournament(item.i, item.n);
    });
  }
  return null;
};

const parseLobbyTournamentInfo = (data) => {
  if (data?.info?.n) {
    return TournamentDetail(data);
  }
};

const getTournamentState = (tournamentData) => {
  const stateMap = {
    65: "announced",
    71: "registering",
    83: "seating",
    82: "running",
    67: "cancelled",
    68: "completed",
    85: "unfinished",
  };
  if (tournamentData?.t !== "LobbyTournamentInfo" || !tournamentData?.info?.s) {
    throw "Invalid tournament info";
  }

  return stateMap[tournamentData.info.s];
};

const initialMessage = (msgId) => {
  return JSON.stringify({
    clientVersion: "HTML5",
    locale: "en",
    protocolVersion: 0,
    skinName: "stockpoker",
    id: msgId,
    t: "ClientVersion",
  });
};

const tournamentListMessage = () => {
  return JSON.stringify({
    tournamentType: -1,
    t: "GetTournamentsList",
  });
};

const lobbyTournamentInfoMessage = (tournamentId) => {
  return JSON.stringify({
    tournamentId: tournamentId,
    t: "GetLobbyTournamentInfo",
  });
};

const tournamentPlayersMessage = (tournamentId) => {
  return JSON.stringify({
    tournamentId: tournamentId,
    offset: 0,
    amount: -1,
    sortBy: "",
    t: "GetTournamentPlayers",
  });
};

const generateLobbyTournamentInfoMessages = (tournamentList) => {
  return tournamentList.map((t) => {
    const message = lobbyTournamentInfoMessage(t.tournamentId);
    return message;
  });
};

const parsePlayerData = (playerDataResponse) => {
    return ['hi']
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
  parsePlayerData
};
