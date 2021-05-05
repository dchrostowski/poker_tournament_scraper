const puppeteer = require('puppeteer')
const {waitFor, insertRecord, insertRunning} = require('../util/util')
const db = require('../util/db')
const {TournamentResult, PlayerPosition, RunningTournament} = require('../util/db_models')


const SWCScraper = async (config) => {
    const {bitcoinValue,running} = config
    

    const printRequest = response => null;
  
    const parseResponse = (async (response) => {
      response = response.response
      let jsonMatch = response.payloadData.match(/^42\/poker\/,(.+)$/)
      let jsonData
  
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[1])
        jsonData = JSON.parse(jsonData[1])
        if (jsonData.hasOwnProperty('t') && 
            jsonData['t'] === 'LobbyTournamentInfo') {

            
            let tourneyName = jsonData.info.n
            if (!tourneyName) return
            if (!running && jsonData.tables.length > 0) return
            
  
            let rawPlayers = jsonData.players
            let incompletePlayers = false
            let cryptoMultiplier
            
            if(jsonData.info.m === 82) {
              cryptoMultiplier = config.cryptocurrency.uBTC.usdValue
            }

            else if(jsonData.info.m === 102) {
              cryptoMultiplier = config.cryptocurrency.uBCH.usdValue
            }

            const unsortedPlayers = rawPlayers.map((player) => {
              
                
                const prize1 = player['main-prize-amount'] / 100 * cryptoMultiplier
                const prize2 = player['second-prize-amount'] / 100 * cryptoMultiplier

                if(!player.hasOwnProperty('player-nick')) incompletePlayers = true
                  console.log(player.cash)
                  return PlayerPosition({
                    playerName: player['player-nick'],
                    position: player['place'] + 1,
                    chips: player.cash,
                    prize1: prize1,
                    prize2: prize2,
                    rebuyAmount: (jsonData.info.b / 100 * cryptoMultiplier) + (jsonData.info.e / 100 * cryptoMultiplier),
                    totalPrize: prize1+prize2
                  })
              })

              if (incompletePlayers) {
                return
              }

              else {
                let badData = false
                unsortedPlayers.forEach((player) => {
                  if(!running && player.position === 0) {
                    console.log("bad data, skipping")
                    badData = true
                    return
                  }
                })
    
                if(badData) return

                if(running) {
                  let stillPlaying = unsortedPlayers.filter(player => player.chips > 0)
                  let eliminated = unsortedPlayers.filter(player => player.chips === 0)
                  eliminated = eliminated.sort((a,b) => (a.position > b.position ? 1 : -1))
                  stillPlaying = stillPlaying.sort((a,b) => (a.chips < b.chips ? 1 : -1))

                  let i=1
                  stillPlaying.forEach((player) => {
                    player['position'] = i
                    i++
                  })

                  const sortedRunning = stillPlaying.concat(eliminated)

                  const runningTournament = new RunningTournament({
                    tournamentName: tourneyName,
                    tournamentId: jsonData.info.i,
                    uniqueId: 'SWC_' + jsonData.info.i,
                    site: 'swcpoker.club',
                    players: sortedRunning,
                    lastUpdate: new Date().getTime()
                  })

                  insertRunning(runningTournament)

                }

                else {
                  const sortedPlayers = unsortedPlayers.sort((a,b) => (a.position > b.position ? 1 : -1))
                  const tournamentData = {}
                  tournamentData['site'] = 'swcpoker.club'
                  tournamentData['tournamentId'] = jsonData.info.i
                  tournamentData['uniqueId'] = 'SWC_' + jsonData.info.i
                  tournamentData['tournamentName'] = tourneyName
                  tournamentData['startDate'] = jsonData.info.sd
                  tournamentData['endDate'] = jsonData.info.le
                  tournamentData['results'] = sortedPlayers
                  tournamentData['bitcoinValue'] = bitcoinValue
                  tournamentData['buyin'] = jsonData.info.b / 100 * cryptoMultiplier
                  tournamentData['entryFee'] = jsonData.info.e / 100 * cryptoMultiplier
                  tournamentData['currency'] = 'USD'
      
                  const dbTournamentData = new TournamentResult({...tournamentData})
                  insertRecord(dbTournamentData)
                }
                
                //m === 82 ? uBTC
                //m === 102 ? uBCH
                

              }
  

        }
      }
    })
  
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    try {
      await page.setViewport({
        width: 1920,
        height: 2000,
        deviceScaleFactor: 1,
      })
  
      this.tournamentAndPlayers = {}
  
      console.log("Loading play.swcpoker.club...")
      await page.goto('https://play.swcpoker.club', { waitUntil: 'networkidle0', timeout: 90000 })
      const [signin, forgot, signup, cancel] = await page.$x('//div[@class="simple-button-content"]')
      console.log("Navigating to lobby...")
      await cancel.click()
      await waitFor(400)
  
      const [lobby_div] = await page.$x('//div[@class="navigation-panel-back-content"]')
      await lobby_div.click()
      await waitFor(4000)
  
  
      const [tournaments_btn] = await page.$x('//div[@class="menu-item-content" and text()="Tournaments"]')
      await tournaments_btn.click()
      await waitFor(5000)
  
      const cdp = await page.target().createCDPSession();
      await cdp.send('Network.enable');
      await cdp.send('Page.enable');
  
      cdp.on('Network.webSocketFrameReceived', parseResponse); // Fired when WebSocket message is received.
      cdp.on('Network.webSocketFrameSent', printRequest);
  
      
      let [statusButton] = await page.$x('//div[@class="tournament-list-header"]/div[contains(@class,"tournament-status")]')
      
      await statusButton.click()
      await waitFor(2000)
      
      await statusButton.click()
      await waitFor(2000)
      console.log("running is ", running)
      if(!running) {
        await statusButton.click()
        await waitFor(2000)
      }

      let targetDivsXpath
      console.log("running is ")
      if(running) targetDivsXpath = '//div[@class="tournament-line-wrapper"]//div[@class="cell tournament-status"]/div[text()="Running"] | //div[@class="tournament-line-wrapper"]//div[@class="cell tournament-status"]/div[text()="Late Registration"]'
      else targetDivsXpath = '//div[@class="tournaments"]//div[@class="panel tournament-line completed"]'
      console.log(targetDivsXpath)

      let targetDivs = await page.$x(targetDivsXpath)
      console.log("TYPE OF FUCKING TARGETDIVS", typeof targetDivs)

      
      const numDivs = targetDivs.length
      console.log("found " + numDivs + " divs.")
      
      for (let i = 0; i < numDivs; i++) {
        console.log("i=" + i)
        console.log("there are " + targetDivs.length + " divs")
        let div = targetDivs[i]
        await div.click()
        await waitFor(5000)
        let [backButton] = await page.$x('//div[@class="navigation-panel-back-content"]')
        await backButton.click()
        await waitFor(2500)

        targetDivs = await page.$x(targetDivsXpath)
        
        await waitFor(2500)
      }
      console.log("end loop")
    }
    catch (err) {
      console.error(err)
    }
    finally {
      await page.close()
      await browser.close()
    }
  
  }

  exports.SWCScraper = SWCScraper