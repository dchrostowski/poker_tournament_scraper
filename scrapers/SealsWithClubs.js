const puppeteer = require('puppeteer')
const {waitFor, insertRecord} = require('../util/util')
const db = require('../util/db')
const {TournamentResult, PlayerPosition} = require('../util/db_models')


const SWCScraper = async (bitcoinValue) => {

    const printRequest = response => null;
  
    const parseResponse = (async (response) => {
      //console.log(response)
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
            if (jsonData.tables.length > 0) return
            
  
            let rawPlayers = jsonData.players
  
            const unsortedPlayers = rawPlayers.map((player) => {
                  return PlayerPosition({
                    playerName: player['player-nick'],
                    position: player['place'] + 1,
                    prize1: player['main-prize-amount'] / 100,
                    prize2: player['second-prize-amount'] / 100,
                    totalPrize: (player['main-prize-amount'] + player['second-prize-amount']) / 100
                  })
              })
  
              let badData = false
              unsortedPlayers.forEach((player) => {
                if(player.position === 0) {
                  console.log("bad data, skipping")
                  badData = true
                  return
                }
              })
  
              if(badData) return
  
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
              tournamentData['buyin'] = jsonData.info.b / 100
              tournamentData['entryFee'] = jsonData.info.e / 100
              tournamentData['currency'] = 'uBTC'
  
              const dbTournamentData = new TournamentResult({...tournamentData})
              insertRecord(dbTournamentData)
        }
      }
    })
  
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    try {
      await page.setViewport({
        width: 1920,
        height: 1080,
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
      await waitFor(5000)
      await statusButton.click()
      await waitFor(5000)
      const completedDivs = await page.$x('//div[@class="tournaments"]//div[@class="panel tournament-line completed"]')
  
      for (let i = 0; i < completedDivs.length; i++) {
        let refreshCompleted = await page.$x('//div[@class="tournaments"]//div[@class="panel tournament-line completed"]')
        let div = refreshCompleted[i]
        await div.click()
        await waitFor(5000)
        let [backButton] = await page.$x('//div[@class="navigation-panel-back-content"]')
        await backButton.click()
        await waitFor(2500)
  
      }
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