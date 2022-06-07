import WebSocket from 'ws';
import MessageGenerator from './message.js'
const { GetTournamentList, InitialMessage, GetLobbyTournamentInfo, GetTournamentPlayers } = MessageGenerator()
import { parseTournamentList, parseLobbyTournamentInfo, parseTournamentPlayers } from './util.js'

class WebSocketScraper {
  constructor(websocketUrl,site) {
    this.ws = new WebSocket(websocketUrl)
    this.websocketUrl = websocketUrl
    this.site = site
    this._msgId = 1001
    this.lobbyState = null
    this.initialized = false
    this.lobbyTournamentInfo = {}
    this.tournamentList = []
    this.responses = {}



  }

  incrementMsgId = async () => {
    this._msgId = this._msgId + 1
  }

  getMsgId = async () => {
    return this._msgId
  }

  _handleIncomingMessage = (resp) => {

    const t = resp.t
    switch (t) {
      case 'LobbyState': {
        this.initialized = true

        break;
      }
      case 'TournamentsList': {
        this.responses[resp.srcMsgId] = resp
        break;
      }
      case 'LobbyTournamentInfo': {
        this.responses[resp.srcMsgId] = resp
        break;
      }
      case 'TournamentPlayers': {
        this.responses[resp.srcMsgId] = resp
        break;
      }
    }
  }

  init = () => {
    this.ws.on('open', () => {
      console.log('connected to ' + this.websocketUrl)
      this.ping = setInterval(() => {
        this.ws.send(
          JSON.stringify({ ...InitialMessage(), id: this._msgId }), this.incrementMsgId()
        )
      }, 5000)
    });

    this.ws.on("close", (code, reason) => {
      console.log(`${code}: ${reason.toString()}`)
      console.log(`websocket ${this.websocketUrl} disconnected`)
      clearInterval(this.ping)

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
    this.ws.send(JSON.stringify({ ...GetLobbyTournamentInfo(tournamentId), id: msgId }), this.incrementMsgId())

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

    this.ws.send(JSON.stringify({ ...GetTournamentPlayers(tournamentId), id: msgId }), this.incrementMsgId())

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
}

export default WebSocketScraper