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

        },
        GetCountries: () => {
            return { "locale": "", "skin": "", "version": 0, "t": "GetCountries" }
        },
        GetUserDetails: (pid) => {
            return {
                playerId: pid,
                "t": "GetPlayerDetails"
            }
        },
        LoginWithAuthToken: (authToken) => {
            return {
                "login": "",
                "password": authToken,
                "oldAuth": "null",
                "tfaAuth": "",
                "tfaType": 95,
                "t": "Login"
            }
        },

        GetTableState: (tableId, entryIdx, isRealTable) => {
            //entryIdx should be 0
            // isRealTable should be false
            return { "tableId": tableId, "playerEntryIdx": entryIdx, "isRealTable": isRealTable, "t": "GetTableState" }

        }
    }

}

export default MessageGenerator