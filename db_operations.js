import { TournamentResult, RunningTournament, RunningTournamentArchive, RegisteringTournament, PlayerPosition } from "./db_models.js"

function ri(record) {
    return `${record.tournamentState} / ${record.tournamentId} - ${record.tournamentName}`
}



export async function insertRunningOrReg(record) {
    const rid = ri(record)
    const Model = record.constructor

    record.save((err) => {
        if (err) {
            if (err.code === 11000) {
                console.log(`${rid} - duplicate error updating...`)
                Model.findOne({ uniqueId: record.uniqueId }, (err, existing) => {
                    if (err) {
                        console.error("Fatal: unable to get and update duplicate record for " + rid)
                        throw err
                    }
                    else {

                        existing.players = record.players
                        existing.lastUpdate = new Date()
                        existing.save((err) => {
                            if (err) {
                                console.error("Fatal: unable to save changes to existing record for " + rid)
                                throw err
                            }
                        })

                    }
                })

            }
            else {
                console.error("Fatal error for " + rid)
                throw err
            }
        }
        else {
            console.log(`successful insertion for ${rid}`)
        }

    })

}

async function pruneRegisteringAndRunning(uniqueId) {
    const running = await RunningTournament.findOne({ 'uniqueId': uniqueId })
    if (running) {

        const archive = new RunningTournamentArchive(running.toObject())
        const rid = ri(archive)
        archive.save((err) => {
            if (err) {
                if (err.code === 11000) {
                    console.log(`${rid} - duplicate while attempting to archive`)
                }
                else {
                    console.log(`error while archiving ${rid}`)
                }
            }
            else {
                console.log(`archived ${rid}`)
            }
        })
    }
    await RegisteringTournament.deleteOne({ uniqueId: uniqueId })



    const targetDate = new Date()
    targetDate.setTime(targetDate.getTime() - (1000 * 20 * 60))


    const resRun = await RunningTournament.deleteMany({ lastUpdate: { $lt: targetDate } })
    console.log(`Deleted ${resRun.deletedCount} old running tournaments`)
    const regRun = await RegisteringTournament.deleteMany({ lastUpdate: { $lt: targetDate } })
    console.log(`Deleted ${regRun.deletedCount} old registering tournaments`)
}

export async function insertComplete(record) {
    const rid = ri(record)
    const Model = record.constructor
    const existing = await Model.findOne({ uniqueId: record.uniqueId })
    if (existing) {
        ri(`${rid} already exists in database, skipping...`)
        pruneRegisteringAndRunning(record.uniqueId)
    }
    else {
        const running = await RunningTournament.findOne({ uniqueId: record.uniqueId })
        if (running) {
            running.lastUpdate = new Date()
            running.save((err) => {
                if (err) {
                    console.log("error on updating " + rid)

                }
                else {
                    console.log("successfully updated " + rid)
                }
            })


        }

        record.save((err) => {
            if (err) {
                console.error(`error on insert ${rid}`)
                throw err
            }
            else {
                console.log("successfully inserted " + rid)


            }
        })


    }
}
