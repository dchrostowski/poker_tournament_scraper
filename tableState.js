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


                //c d h s
                const cardMap = {
                    0: "2c",
                    1: "2d",
                    2: "2h",
                    3: "2s",
                    4: "3c",
                    5: "3d",
                    6: "3h",
                    7: "3s",
                    8: "4c",
                    9: "4d",
                    10: "4h",
                    11: "4s",
                    12: "5c",
                    13: "5d",
                    14: "5h",
                    15: "5s",
                    16: "6c",
                    17: "6d",
                    18: "6h",
                    19: "6s",
                    20: "7c",
                    21: "7d",
                    22: "7h",
                    23: "7s",
                    24: "8c",
                    25: "8d",
                    26: "8h",
                    27: "8s",
                    28: "9c",
                    29: "9d",
                    30: "9h",
                    31: "9s",
                    32: "Tc",
                    33: "Td",
                    34: "Th",
                    35: "Ts",
                    36: "Jc",
                    37: "Jd",
                    38: "Jh",
                    39: "Js",
                    40: "Qc",
                    41: "Qd",
                    42: "Qh",
                    43: "Qs",
                    44: "Kc",
                    45: "Kd",
                    46: "Kh",
                    47: "Ks",
                    48: "Ac",
                    49: "Ad",
                    50: "Ah",
                    51: "As"

                }

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
                    let cardArray = []
                    if (communityCards) {
                        cardArray = communityCards.split(";")

                        cardArray.forEach((card, idx) => {
                            const cardId = cardMap[card] || '?'
                            cardArray[idx] = cardId

                        })

                    }

                    //if (pot) console.log("Pot: " + pot)

                    events.forEach((event) => {
                        const seatIndex = event['s']
                        const actionIndex = event['a']

                        //console.log(event)


                        if (event?.s && event?.a && event.t === 9) {

                            if (cardArray.length === 3) console.log("Flop:")
                            if (cardArray.length > 2) {
                                if (cardArray.length === 4) console.log("Turn:")
                            }

                            if (cardArray.length === 5) console.log("River")

                            if (cardArray.length > 2) {
                                console.log(cardArray)
                            }

                            const playerName = seats[seatIndex]?.n || 'Nobody'
                            let action = actionMap[actionIndex] || 'did something'


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
                            console.log(event)

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





