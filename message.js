const MessageGenerator = () => {
    return {
        GetTournamentList: () => {
            return {
                tournamentType: -1,
                t: "GetTournamentsList"
            }
        },
        InitialMessage: () => {
            return {
                clientVersion: "HTML5",
                locale: "en",
                protocolVersion: 0,
                skinName: "stockpoker",
                t: "ClientVersion"

            }
        },
        GetLobbyTournamentInfo: (tournamentId) => {
            return {
                tournamentId: tournamentId,
                t: "GetLobbyTournamentInfo"
            }

        },
        GetTournamentPlayers: (tournamentId) => {
            return {
                tournamentId: tournamentId,
                offset: 0,
                amount: -1,
                sortBy: "",
                t: "GetTournamentPlayers"
            }

        }
    }

}

export default MessageGenerator