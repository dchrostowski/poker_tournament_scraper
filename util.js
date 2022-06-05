

const stateMap = {
    65: "announced",
    71: "registering",
    83: "seating",
    82: "running",
    67: "cancelled",
    68: "completed",
    85: "unfinished"
}

const typeMap = {
    71: "sit-and-go",
    83: "scheduled",
    77: "manual"
}


class Tournament {
    constructor(id, name, stateId, typeId) {
        this.id = id
        this.name = name
        this.state = stateMap[stateId]
        this.type = typeMap[typeId]
    }
}

class LobbyTournamentInfo {
    constructor(info) {
        this.id = info.i
        this.name = info.n
        this.state = stateMap[info.s]
        this.type = typeMap[info.tt]
        this.startDate = info?.sd
        this.endDate = info?.le || null
        this.buyIn = (info?.b || 0) / 100
        this.entryFee = (info?.e || 0) / 100
        this.bounty = (info?.bkv || 0) / 100
        this.startingChips = info.sf

    }
}

export function parseTournamentList(response) {
    console.log("parsing tournament list...")
    const rawTournaments = response.tournaments
    return rawTournaments.map(rawT => {
        return new Tournament(rawT.i, rawT.n, rawT.s, rawT.tt)
    })
}

export function parseLobbyTournamentInfo(resp) {
    console.log("parsing lobby tournament info...")
    return new LobbyTournamentInfo(resp.info)
}

function getUnsortedPlayers(playerDataResponse, tState) {
    if (!playerDataResponse?.players || !playerDataResponse?.players[0]?.n) {
        return null
    }

    const unsortedPlayers = playerDataResponse.players.map(player => {
        const bp = player?.bp || 0
        const eb = player?.eb || 0
        const rf = player?.rf || 0
        const ma = player?.ma || 0

        const pdata = {
            playerName: player.n,
            position: (player?.p || 0) + 1,
            prize1: ma / 100,
            prize2: bp / 100,
            totalPrize: (ma + bp) / 100,
            chips: player.c
        }

        if (tState === "running") pdata["rebuyAmount"] = (eb + rf) / 100

        return pdata
    })

    return unsortedPlayers
}

function processRunningPlayers(unsortedPlayers) {
    let eliminated = unsortedPlayers.filter(player => player.position > 0)
    let stillPlaying = unsortedPlayers.filter(player => player.position === 0)

    stillPlaying = stillPlaying.sort((a, b) => (a.chips < b.chips ? 1 : -1))
    eliminated = eliminated.sort((a, b) => (a.position > b.position ? 1 : -1))
    for (let j = 1; j <= stillPlaying.length; j++) {
        stillPlaying[j - 1].position = j
    }

    const runningSortedPlayers = stillPlaying.concat(eliminated)
    return runningSortedPlayers

}


export function parseTournamentPlayers(response, tState) {

    const players = response?.players || []

    if (players.length === 0) return []

    const unsortedPlayers = getUnsortedPlayers(response, tState)
    if (tState === 'running' || tState === 'registering') {
        const sortedPlayers = processRunningPlayers(unsortedPlayers)
        return sortedPlayers

    }
    else if (tState === "completed") {
        const winners = unsortedPlayers.filter(player => player.position === 1)
        const losers = unsortedPlayers.filter(player => player.position > 1)

        const sortedWinners = winners.sort((a, b) => (a.prize1 < b.prize1 ? 1 : -1))
        for (let i = 0; i < sortedWinners.length; i++) {
            sortedWinners[i].position = i + 1
        }
        const sortedLosers = losers.sort((a, b) => (a.position > b.position ? 1 : -1))

        const sortedPlayers = sortedWinners.concat(sortedLosers)

        for (let i = 0; i < sortedPlayers.legnth; i++) {
            sortedPlayers[i]["prize1"] = sortedPlayers[i]["prize1"] / 100
            sortedPlayers[i]["prize2"] = sortedPlayers[i]["prize2"] / 100
            sortedPlayers[i]["totalPrize"] = sortedPlayers[i]["totalPrize"] / 100
        }
        return sortedPlayers

    }
}