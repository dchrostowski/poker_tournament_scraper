import { TournamentResult, RunningTournament, RegisteringTournament } from "./db_models.js"

function ri(record) {
    return `${record.tournamentState} / ${record.tournamentId} - ${record.tournamentName}`
}



export async function insertIncomplete(record) {
    const rid = ri(record)
    try {
        const model = record.tournamentState === 'running' ? RunningTournament : RegisteringTournament
        console.log(model)
        await model.findOneAndUpdate({ uniqueId: record.uniqueId },record, {
            upsert: true
        } )

    console.log(`upserted ${rid}`)

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

        await TournamentResult.findOneAndUpdate({ uniqueId: record.uniqueId }, record, {
            upsert:true
        })

        pruneRegisteringAndRunning(900000)
    }
    catch (error) {
        console.error(error)
        
    }
}
