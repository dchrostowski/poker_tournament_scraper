import WebSocketScraper from "./web_socket_scraper.js"
import {
    PlayerPosition,
    TournamentResult,
    RunningTournament,
    RegisteringTournament
} from "./db_models.js"
import { getDBConnection } from "./db.js"
import { insertRunningOrReg, insertComplete } from "./db_operations.js"
import MessageGenerator from './message.js'
const { GetTournamentList, GetLobbyTournamentInfo } = MessageGenerator()
import { parseTournamentList, parseLobbyTournamentInfo } from './util.js'

const runScraper = async (config) => {
    console.log("starting scraper for " + config.site)
    const scraper = new WebSocketScraper(config.socketUrl, config.site)
    await scraper.init()
    console.log("initialized")

    const tournamentList = await scraper.sendMessage(GetTournamentList(), parseTournamentList)


    const runningList = tournamentList.filter(t => t.state === 'running' && t.type !== 'sit-and-go')
    const registeringList = tournamentList.filter(t => t.state === 'registering' && t.type !== 'sit-and-go')
    const completedList = tournamentList.filter(t => t.state === 'completed' && t.type !== 'sit-and-go')


    for (let i = 0; i < runningList.length; i++) {
        const t = runningList[i]
        //const lti = await scraper.getLobbyTournamentInfo(t.id)
        const lti = await scraper.sendMessage(GetLobbyTournamentInfo(t.id), parseLobbyTournamentInfo)
        const pd = await scraper.getTournamentPlayers(t.id, t.state)

        const runningTournamentArgs = {
            uniqueId: `${config.tournamentIdPrefix}_${lti.id}`,
            tournamentId: lti.id,
            tournamentName: lti.name,
            tournamentState: lti.state,
            tournamentType: lti.type,
            startDate: lti.startDate,
            startingChips: lti.startingChips,
            site: config.site,
            lastUpdate: new Date(),

        }

        let calcRebuyAddonTotal = false

        if (lti.rebuyCost !== null) {
            runningTournamentArgs['rebuy'] = lti.rebuyCost
            runningTournamentArgs['rebuyFee'] = lti.rebuyFee
            calcRebuyAddonTotal = true


        }

        if (lti.addonCost !== null) {
            runningTournamentArgs['addon'] = lti.addonCost
            runningTournamentArgs['addonFee'] = lti.addonFee
            calcRebuyAddonTotal = true
        }

        if (lti.bounty) {
            runningTournamentArgs['bounty'] = lti.bounty
        }

        console.log("calc?" + calcRebuyAddonTotal)




        const results = pd.map((player) => {
            if (calcRebuyAddonTotal) {
                const rebuyTotal = player.numRebuys * (runningTournamentArgs.rebuy + runningTournamentArgs.rebuyFee)
                const addonTotal = player.numAddons * (runningTournamentArgs.addon + runningTournamentArgs.addonFee)
                player['rebuyAddonTotal'] = parseFloat((rebuyTotal + addonTotal).toFixed(2))
            }
            return new PlayerPosition(player)
        })

        runningTournamentArgs['players'] = results
        insertRunningOrReg(RunningTournament(runningTournamentArgs))
    }

    for (let i = 0; i < registeringList.length; i++) {
        const t = registeringList[i]
        const lti = await scraper.sendMessage(GetLobbyTournamentInfo(t.id), parseLobbyTournamentInfo)

        const pd = await scraper.getTournamentPlayers(t.id, t.state)
        const results = pd.map((player) => new PlayerPosition(player))
        const regTournamentArgs = {
            uniqueId: `${config.tournamentIdPrefix}_${lti.id}`,
            tournamentId: lti.id,
            tournamentName: lti.name,
            tournamentState: lti.state,
            tournamentType: lti.type,
            startingChips: lti.startingChips,
            startDate: lti.startDate,
            site: config.site,
            lastUpdate: new Date(),
            players: results,
        }

        insertRunningOrReg(RegisteringTournament(regTournamentArgs))
    }

    for (let i = 0; i < completedList.length; i++) {
        const t = completedList[i]
        const lti = await scraper.sendMessage(GetLobbyTournamentInfo(t.id), parseLobbyTournamentInfo)
        const pd = await scraper.getTournamentPlayers(t.id, t.state)

        let calcRebuyAddonTotal = false

        let completedTournamentArgs = {
            uniqueId: `${config.tournamentIdPrefix}_${lti.id}`,
            site: config.site,
            tournamentId: lti.id,
            tournamentName: lti.name,
            tournamentState: lti.state,
            tournamentType: lti.type,
            buyin: lti.buyIn,
            entryFee: lti.entryFee,
            startingChips: lti.startingChips,
            startDate: lti.startDate,
            endDate: lti.endDate,
            currency: config.currency,
        }

        if (lti.rebuyCost !== null) {
            completedTournamentArgs['rebuy'] = lti.rebuyCost
            completedTournamentArgs['rebuyFee'] = lti.rebuyFee
            calcRebuyAddonTotal = true


        }

        if (lti.addonCost !== null) {
            completedTournamentArgs['addon'] = lti.addonCost
            completedTournamentArgs['addonFee'] = lti.addonFee
            calcRebuyAddonTotal = true
        }

        if (lti.bounty) {
            completedTournamentArgs['bounty'] = lti.bounty
        }




        const results = pd.map((player) => {
            if (calcRebuyAddonTotal) {
                const rebuyTotal = player.numRebuys * (completedTournamentArgs.rebuy + completedTournamentArgs.rebuyFee)
                const addonTotal = player.numAddons * (completedTournamentArgs.addon + completedTournamentArgs.addonFee)
                player['rebuyAddonTotal'] = parseFloat((rebuyTotal + addonTotal).toFixed(2))
            }
            return new PlayerPosition(player)
        })



        completedTournamentArgs['results'] = results





        try {
            insertComplete(TournamentResult(completedTournamentArgs))
        }
        catch (err) {
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