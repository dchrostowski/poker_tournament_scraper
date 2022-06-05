import { TournamentResult, RunningTournament, RegisteringTournament } from "./db_models.js"

function ri(record) {
    return `${record.tournamentState} / ${record.tournamentId} - ${record.tournamentName}`
}



export async function insertIncomplete(record) {
    const rid = ri(record)
    try {
        const model = record.tournamentState === 'running' ? RunningTournament : RegisteringTournament
        const existing = await model.findOne({ uniqueId: record.uniqueId })

        if (existing) {
            console.log("udpating " + rid)
            existing.lastUpdate = record.lastUpdate
            existing.players = record.players
            await existing.save()

        }
        else {
            console.log("inserting " + rid)
            await record.save()
        }

    }
    catch (error) {
        console.error(error)
        throw error
    }

}

function generatePlayerRebuyAmountMap(existing) {
    const rebuyMap = {}
    for (let i = 0; i < existing.players.length; i++) {
        const player = existing.players[i]
        rebuyMap[player.playerName] = player.rebuyAmount
    }
    return rebuyMap
}

async function pruneRegisteringAndRunning(ms) {
    const targetDate = new Date()
    targetDate.setTime(targetDate.getTime() - ms)
    await RunningTournament.deleteMany({ lastUpdate: { $lt: targetDate } })
    await RegisteringTournament.deleteMany({ lastUpdate: { $lt: targetDate } })
}

export async function insertComplete(record) {

    const rid = ri(record)
    console.log(`${rid}`)
    try {
        const existingRunning = await RunningTournament.findOne({ uniqueId: record.uniqueId })
        if (existingRunning) {
            const rebuyMap = generatePlayerRebuyAmountMap(existingRunning)

            for (let i = 0; i < record.results.length; i++) {
                const player = record.results[i]
                console.log("updating rebuy amount for  player " + player.playerName)
                console.log(`${player.playerName} had ${rebuyMap[player.playerName]} in rebuys`)
                record.results[i].rebuyAmount = rebuyMap[player.name]
            }

        }

        const existing = await TournamentResult.findOne({ uniqueId: record.uniqueId })
        if (existing) {
            existing.results = record.results
            await existing.save()
            console.log(`updating/skipping duplicate completed tournament ${rid}`)

        }
        else {
            await record.save()
            console.log(`insert ${rid}`)

        }

        pruneRegisteringAndRunning(900000)
    }
    catch (error) {
        console.error(error)
        throw error
    }
}