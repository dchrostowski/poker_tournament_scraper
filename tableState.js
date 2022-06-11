import WebSocketScraper from "./web_socket_scraper.js"
const args = process.argv.slice(2)
console.log(args)


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



let tableId1 = args[0]
const scenario = args[1]

const tableId = Number(tableId1)

console.log("tableid starting with is |" + tableId + "|")

import MessageGenerator from './message.js'

const { GetTableState } = MessageGenerator()


const defaultCallback = (resp) => {
    console.log(resp)


}

const scraper = new WebSocketScraper(stockConfig.socketUrl, stockConfig.site, defaultCallback)
await scraper.init()
console.log("initialized")
const tournamentList = await scraper.getTournamentList()



const getTableLoop2 = async () => {
    const resp = await scraper.sendMessage(GetTableState(tableId))

}

const runningTableData = await scraper.selectTable(tableId)
console.log(runningTableData)



const printFooter = (label) => {
    return `=====${label}=====${new Date().toLocaleTimeString()}===${scenario}=====`
}

//const interval = setInterval(getTableLoop2, 5000)

await scraper.sendMessage(GetTableState(tableId))

if (scenario == 2 || scenario == 1) {
    scraper.setResponseCallback(async (resp) => {
        if (resp.t === 'TableState') {
            const { seats, ...everythingElse } = resp
            if (scenario == 1) {
                console.log(everythingElse)
                console.log(printFooter())

            }
            else {

                console.log(seats)
                console.log(printFooter())


            }
        }

        else if (resp.t === 'GameState') {
            return await scraper.sendMessage(GetTableState(tableId))
        }
    })
}

if (scenario == 3 || scenario == 4 || scenario == 5 || scenario == 6 || scenario == 7) {
    scraper.setResponseCallback((resp) => {
        if (resp.t === 'GameState') {
            const { events, gameState } = resp
            const { s, ...everythingElse1 } = gameState
            const seats = s

            if (scenario == 3) {
                console.log("----------------------------------------------------")
                console.log(events)
                console.log(printFooter('GAME STATE EVENTS'))
            }
            else if (scenario == 4) {

                console.log("----------------------------------------------------")
                console.log(everythingElse1);
                console.log(printFooter('GAME STATE'))
            }
            else if (scenario == 5) {

                console.log("----------------------------------------------------")
                console.log([s[0], s[1], s[2]]);
                console.log(printFooter('GAME STATE S[0-4'))

            }

            else if (scenario == 6) {

                console.log("----------------------------------------------------")
                console.log([s[3], s[4], s[5]]);
                console.log(printFooter('GAME STATE S[5-9'))

            }

            else if (scenario == 7) {

                const actionMap = {
                    1: 'folded',
                    2: 'checked',
                    3: 'called',
                    8: 'bet',
                    9: 'raised',
                    6: 'posted the small blind',
                    7: 'posted the big blind',
                    16: "timed out and mucked their cards",
                    10: 'won the hand',
                    11: 'mucked their hand'
                }

                // seats.forEach((seat, idx) => {
                //     if (seat !== null) {
                //         console.log("Seat " + idx + ": " + seat.n)
                //     }

                // })

                // t 7 s 3 f 4000

                if (events) {


                    const pot = gameState.d?.p
                    const communityCards = gameState.d?.c

                    ///if (communityCards) console.log("community cards: " + communityCards)

                    //if (pot) console.log("Pot: " + pot)

                    events.forEach((event) => {
                        const seatIndex = event['s']
                        const actionIndex = event['a']

                        //console.log(event)


                        if (event?.s && event?.a && event.t === 9) {


                            const playerName = seats[seatIndex]?.n || 'Nobody'
                            const action = actionMap[actionIndex] || 'did something'


                            const remainingChips = seats[seatIndex]['c']



                            let playedChips = event?.f


                            if (playedChips) {
                                playedChips = `with ${playedChips} chips`
                            }
                            else {
                                playedChips = ""
                            }

                            let allIn = ""
                            if (typeof remainingChips === 'undefined' || remainingChips === 0 && event?.a !== 10) {
                                allIn = " and is all-in"

                            }

                            const statement = `${playerName} ${action} ${playedChips}${allIn}`
                            if (event?.a !== 10 && event?.a !== 16) {
                                console.log(statement)
                            }
                            if (action === 'did something') {
                                console.log("debug:")
                                console.log(event)
                            }



                        }

                        if (event?.t === 7 && event?.s && event?.f) {
                            const winner = seats[seatIndex]?.n
                            const amount = event?.f
                            console.log(`${winner} wins the hand and gets ${amount} chips`)

                        }


                    })
                    console.log("-----------------------------------")



                }




            }


        }
    })

}



// }

// else if (scenario == 2) {
//     const scraper = new WebSocketScraper(rounderConfig.socketUrl, rounderConfig.site)
//     await scraper.init()
//     const getTableLoop2 = async () => {
//         const resp = await scraper.sendMessage(GetTableState, [tableId])
//         delete resp['seats']
//         console.log(resp)
//     }
//     setInterval(() => {
//         getTableLoop2()
//     }, 2000)
// }




// else if (scenario === 3) {


//     const cb1 = (resp) => {
//         console.log(new Date())
//         console.log("-----------------------------------------------------------")
//         console.log(resp.gameState.s)
//         console.log("-----------------------------------------------------------")
//     }

//     const scraper = new WebSocketScraper(rounderConfig.socketUrl, rounderConfig.site)


// }





