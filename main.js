import WebSocketScraper from "./web_socket_scraper.js"
import {
    PlayerPosition,
    TournamentResult,
    RunningTournament,
    RegisteringTournament
} from "./db_models.js"
import { getDBConnection } from "./db.js"
import { insertComplete, insertIncomplete } from "./db_operations.js"
import { execPath } from "process"

const runScraper = async (config) => {
    console.log("starting scraper for " + config.site)
    const scraper = new WebSocketScraper(config.socketUrl)
    await scraper.init()
    console.log("initialized")
    const tournamentList = await scraper.getTournamentList()
    console.log("got t list: " + tournamentList.length)


    const runningList = tournamentList.filter(t => t.state === 'running' && t.type !== 'sit-and-go')
    const registeringList = tournamentList.filter(t => t.state === 'registering' && t.type !== 'sit-and-go')
    const completedList = tournamentList.filter(t => t.state === 'completed' && t.type !== 'sit-and-go')

    for (let i = 0; i < runningList.length; i++) {
        const t = runningList[i]
        const lti = await scraper.getLobbyTournamentInfo(t.id)
        const pd = await scraper.getTournamentPlayers(t.id, t.state)
        const results = pd.map((player) => new PlayerPosition(player))

        const runningTournamentArgs = {
            uniqueId: `${config.tournamentIdPrefix}_${lti.id}`,
            tournamentId: lti.id,
            tournamentName: lti.name,
            tournamentState: lti.state,
            tournamentType: lti.type,
            startingChips: lti.startingChips,
            site: config.site,
            lastUpdate: new Date(),
            players: results,
        }

        insertIncomplete(RunningTournament(runningTournamentArgs))
    }

    for (let i = 0; i < registeringList.length; i++) {
        const t = registeringList[i]
        const lti = await scraper.getLobbyTournamentInfo(t.id)

        const pd = await scraper.getTournamentPlayers(t.id, t.state)
        const results = pd.map((player) => new PlayerPosition(player))
        const regTournamentArgs = {
            uniqueId: `${config.tournamentIdPrefix}_${lti.id}`,
            tournamentId: lti.id,
            tournamentName: lti.name,
            tournamentState: lti.state,
            tournamentType: lti.type,
            startingChips: lti.startingChips,
            site: config.site,
            lastUpdate: new Date(),
            players: results,
        }

        insertIncomplete(RegisteringTournament(regTournamentArgs))
    }

    for (let i = 0; i < completedList.length; i++) {
        const t = completedList[i]
        const lti = await scraper.getLobbyTournamentInfo(t.id)
        const pd = await scraper.getTournamentPlayers(t.id, t.state)
        const results = pd.map((player) => new PlayerPosition(player))


        const completedTournamentArgs = {
            uniqueId: `${config.tournamentIdPrefix}_${lti.id}`,
            site: config.site,
            tournamentId: lti.id,
            tournamentName: lti.name,
            tournamentState: lti.state,
            tournamentType: lti.type,
            buyin: lti.buyIn,
            entryFee: lti.entryFee,
            bounty: lti.bounty,
            startingChips: lti.startingChips,
            startDate: lti.startDate,
            endDate: lti.endDate,
            currency: config.currency,
            results: results
        }

        try{
          insertComplete(TournamentResult(completedTournamentArgs))
        }
        catch(err) {
          console.log(err)
        }

        

    }

    console.log("closing scraper")
    return await scraper.closeScraper()

}

const rounderConfig = {
    site: "roundercasino.com",
    tournamentIdPrefix: "RC",
    currency: "USD",
    cryptocurrency: null,
    socketUrl: "wss://web.latpoker.com/front"
}

const stockConfig = {
    site: "stockpokeronline.com",
    tournamentIdPrefix: "SPO",
    currency: "USD",
    cryptocurrency: null,
    socketUrl: "wss://web.stockpokeronline.com/front"
}


async function start() {
    await getDBConnection()
    let i = 1
    while (true) {
        console.log("run # " + i)
        await runScraper(stockConfig)
        await runScraper(rounderConfig)
        i++
    }

}


start()