import WebSocket from 'ws';
import MessageGenerator from './message.js'
const { GetTournamentList, InitialMessage, GetLobbyTournamentInfo, GetTournamentPlayers, GetUserDetails, LoginWithAuthToken, GetTableState, SelectTable } = MessageGenerator()
import { parseTournamentList, parseLobbyTournamentInfo, parseTournamentPlayers } from './util.js'

class WebSocketScraper {
  constructor(websocketUrl, site, respCB) {
    this.ws = new WebSocket(websocketUrl)
    this.authToken = null
    this.websocketUrl = websocketUrl
    this.site = site
    this._msgId = 1001
    this.lobbyState = null
    this.initialized = false
    this.lobbyTournamentInfo = {}
    this.tournamentList = []
    this.responses = {}
    this.gameStates = {}
    const defaultFunc = () => { }
    this.responseCallback = respCB
  }





  incrementMsgId = async () => {
    this._msgId = this._msgId + 1
  }

  getMsgId = async () => {
    return this._msgId
  }

  _handleIncomingMessage = (resp) => {

    const t = resp.t
    this.responses[resp?.srcMsgId] = resp



    if (typeof this.responseCallback === 'function') this.responseCallback(resp)

    switch (t) {
      case 'AuthState': {
        this.authToken = resp.auth
        break;
      }
      case 'LobbyState': {
        this.initialized = true
        break;
      }
      case 'GameState': {
        if (!this.gameStates[resp.gameState.ti]) {
          this.gameStates[resp.gameState.ti] = [resp]
        }
        else {
          this.gameStates[resp.gameState.ti].push(resp)
        }


        break;
      }
      default:
        return

    }
  }

  getAuthToken = () => {

    return new Promise((resolve, reject) => {
      const check = () => {
        console.log("waiting on auth token")
        if (this.authToken !== null) {
          return resolve(this.authToken)
        }
        setTimeout(check, 50)

      }
      check()
    })



  }

  setResponseCallback = async (cb) => {
    this.responseCallback = cb
  }

  loginWithToken = async (authTkn) => {
    if (!this.initialized) {
      throw ("socket not initialized!")
    }
    const msgId = await this.getMsgId()

    this.ws.send(JSON.stringify({ ...LoginWithAuthToken(authTkn), id: msgId }), this.incrementMsgId)

    return new Promise((resolve, reject) => {
      const check = () => {
        if (this.responses[msgId]) {
          return resolve(this.responses[msgId])
        }
        setTimeout(check, 50)

      }
      check()
    })

  }

  init = () => {
    this.ws.on('open', () => {
      console.log('connected to ' + this.websocketUrl)
      this.ping = setInterval(() => {
        this.ws.send(
          JSON.stringify({ ...InitialMessage(), id: this._msgId }), this.incrementMsgId)
      }, 5000)
    });

    this.ws.on("close", (code, reason) => {
      console.log(`${code}: ${reason.toString()}`)
      console.log(`websocket ${this.websocketUrl} disconnected`)
      clearInterval(this.ping)
      console.log(this.gameStates)

    })

    this.ws.on('message', (data) => {
      const jsonResponse = JSON.parse(data.toString())
      this._handleIncomingMessage(jsonResponse)

    });

    return new Promise((resolve, reject) => {
      const check = () => {
        if (this.initialized) return resolve()
        setTimeout(check, 50)
      }
      check()
    })

  }

  closeScraper = async () => {
    this.ws.close()

  }

  getTournamentList = async () => {
    if (!this.initialized) {
      throw ("socket not initialized!")
    }
    if (this.tournamentList.length > 0) return this.tournamentList


    this.ws.send(JSON.stringify({ ...GetTournamentList(), id: this._msgId }), this.incrementMsgId)
    const msgId = await this.getMsgId()

    return new Promise((resolve, reject) => {
      const checkTList = () => {
        if (this.tournamentList.length > 0) return this.tournamentList

        if (this.responses[msgId]) {

          const tList = parseTournamentList(this.responses[msgId])
          this.tournamentList = tList
          return resolve(tList)
        }
        setTimeout(checkTList, 50)
      }
      checkTList()
    })
  }

  getLobbyTournamentInfo = async (tournamentId) => {
    if (!this.initialized) {
      throw ("socket not initialized!")
    }
    const msgId = await this.getMsgId()
    this.ws.send(JSON.stringify({ ...GetLobbyTournamentInfo(tournamentId), id: msgId }), this.incrementMsgId)

    return new Promise((resolve, reject) => {
      const check = () => {
        if (this.responses[msgId]) {
          const lobbyTournInfo = parseLobbyTournamentInfo(this.responses[msgId])
          return resolve(lobbyTournInfo)
        }
        setTimeout(check, 50)

      }
      check()
    })

  }

  getTournamentPlayers = async (tournamentId, tState) => {
    if (!this.initialized) {
      throw ("socket not initialized!")
    }
    const msgId = await this.getMsgId()

    this.ws.send(JSON.stringify({ ...GetTournamentPlayers(tournamentId), id: msgId }), this.incrementMsgId)

    return new Promise((resolve, reject) => {
      const check = () => {
        if (this.responses[msgId]) {
          const playerInfo = parseTournamentPlayers(this.responses[msgId], tState, this.site)
          return resolve(playerInfo)
        }
        setTimeout(check, 50)

      }
      check()
    })

  }

  getUserDetails = async (pid) => {
    if (!this.initialized) {
      throw ("socket not initialized!")
    }
    const msgId = await this.getMsgId()

    this.ws.send(JSON.stringify({ ...GetUserDetails(pid), id: msgId }), this.incrementMsgId)

    return new Promise((resolve, reject) => {
      const check = () => {
        if (this.responses[msgId]) {
          const playerInfo = this.responses[msgId]
          return resolve(this.responses[msgId])
        }
        setTimeout(check, 50)

      }
      check()
    })

  }

  geTableState = async (tableId, entryIdx, isReal) => {
    if (!this.initialized) {
      throw ("socket not initialized!")
    }
    const msgId = await this.getMsgId()

    this.ws.send(JSON.stringify({ ...GetTableState(tableId, entryIdx, isReal), id: msgId }), this.incrementMsgId)

    return new Promise((resolve, reject) => {
      const check = () => {
        if (this.responses[msgId]) {
          const responseData = this.responses[msgId]
          return resolve(responseData)
        }
        setTimeout(check, 50)

      }
      check()
    })
  }

  selectTable = async (tableId) => {
    if (!this.initialized) {
      throw ("socket not initialized!")
    }



    const msgId = await this.getMsgId()
    console.log("sending ")
    console.log(JSON.stringify({ ...SelectTable(tableId), id: msgId }))
    console.log("-----------------------------------------")
    this.ws.send(JSON.stringify({ ...SelectTable(tableId), id: msgId }), this._incrementMsgId)

    return new Promise((resolve, reject) => {
      const check = () => {
        if (this.responses[msgId]) {
          const responseData = this.responses[msgId]

          return resolve(responseData)
        }
        setTimeout(check, 50)

      }
      check()
    })

  }

  sendMessage = async (message) => {
    if (!this.initialized) {
      throw ("socket not initialized!")
    }
    const msgId = await this.getMsgId()


    this.ws.send(JSON.stringify({ ...message, id: msgId }), this.incrementMsgId)

    return new Promise((resolve, reject) => {
      const check = () => {

        if (this.responses[msgId]) {
          const responseData = this.responses[msgId]
          return resolve(responseData)
        }
        setTimeout(check, 50)

      }
      check()
    })

  }
}


export default WebSocketScraper
