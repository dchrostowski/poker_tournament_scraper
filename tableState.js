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

const scraper = new WebSocketScraper(rounderConfig.socketUrl, rounderConfig.site, defaultCallback)
await scraper.init()
console.log("initialized")
const tournamentList = await scraper.getTournamentList()



const getTableLoop2 = async () => {
    const resp = await scraper.sendMessage(GetTableState(tableId))

}

const runningTableData = await scraper.selectTable(tableId)
console.log(runningTableData)



const printFooter = (label) => {
    return `=====${label}=====${new Date().getTime()}===${scenario}=====`
}

const interval = setInterval(getTableLoop2, 5000)


if (scenario == 2 || scenario == 1) {
    scraper.setResponseCallback((resp) => {
        if (resp.t === 'TableState') {
            const { seats, ...everythingElse } = resp
            if (scenario == 1) {
                console.log("----------TableState" + new Date() + "-------------")
                console.log(everythingElse)
                console.log(printFooter())

            }
            else {

                console.log(seats)

            }
        }
    })
}

if (scenario == 3 || scenario == 4 || scenario == 5 || scenario == 6) {
    scraper.setResponseCallback((resp) => {
        if (resp.t === 'GameState') {
            const { events, gameState } = resp
            const { s, ...everythingElse1 } = gameState

            console.log("scenario: " + scenario)
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
                console.log('wut')
                console.log(printFooter('GAME STATE S[0-4'))

            }

            else if (scenario == 6) {

                console.log("----------------------------------------------------")
                console.log([s[3], s[4], s[5]]);
                console.log(printFooter('GAME STATE S[5-9'))

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





