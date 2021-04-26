const puppeteer = require('puppeteer')
const {waitFor, insertRecord} = require('../util/util')
const db = require('../util/db')
const {TournamentResult, PlayerPosition} = require('../util/db_models')


const StockPokerScraper = async () => {

    const printRequest = response => null;
  
    const parseResponse = (async (response) => {
      
      response = response.response.payloadData
      response = JSON.parse(response)
  
      if (response.hasOwnProperty('t') && response.t === 'LobbyTournamentInfo') {
        if(
          response.hasOwnProperty('info') && // has info
          response.tables.length == 0 && // has 0 tables left
          response.hasOwnProperty('players') && // shows players
          response.players.length > 0 && // there is at least one player
          response.players[0].hasOwnProperty('n')) { // the first player has a username in the data
          
          const tournamentData = {}
          tournamentData['site'] = 'stockpokeronline.com'
          tournamentData['tournamentId'] = response.info.i
          tournamentData['uniqueId'] = 'SPO_' + response.info.i
          tournamentData['tournamentName'] = response.info.n
          tournamentData['startDate'] = response.info.sd
          tournamentData['endDate'] = response.info.le

          console.log(tournamentData)
  
          
  
          const unsortedPlayers = response.players.map((player) => {
              return {
                playerName: player.n,
                position: player.p + 1,
                prize1:  player.ma/100,
                prize2: player.sa/100,
                totalPrize: (player.ma + player.sa) / 100
              }
          })
  
          const winners = unsortedPlayers.filter((player) => player.position === 1)
          const losers = unsortedPlayers.filter((player) => player.position > 1)
  
          const sortedWinners = winners.sort((a,b) => (a.prize1 < b.prize1 ? 1 : -1))
          for(let i=0; i<sortedWinners.length; i++) {
            sortedWinners[i].position = i+1
          }
          const sortedLosers = losers.sort((a,b) => (a.position > b.position ? 1 : -1))
         
  
          const sortedPlayers = sortedWinners.concat(sortedLosers)
          const databaseSortedPlayers = sortedPlayers.map((player) => {
              return new PlayerPosition({...player})
          })
  
          for(let i=0; i<sortedPlayers.legnth; i++) {
            sortedPlayers[i]['prize1'] = sortedPlayers[i]['prize1']/100
            sortedPlayers[i]['prize2'] = sortedPlayers[i]['prize2']/100
            sortedPlayers[i]['totalPrize'] = sortedPlayers[i]['totalPrize']/100
          }
          tournamentData['results'] = sortedPlayers
  
          const dbTournamentResult = new TournamentResult({...tournamentData})
          insertRecord(dbTournamentResult)
        }
      }
      return
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
  
      console.log("Loading play.stockpokeronline.com...")
      await page.goto('https://play.stockpokeronline.com/', { waitUntil: 'networkidle0', timeout: 60000 })

      
      
      const cdp = await page.target().createCDPSession();
      await cdp.send('Network.enable');
      await cdp.send('Page.enable');
      
      cdp.on('Network.webSocketFrameReceived', parseResponse); // Fired when WebSocket message is received.
      cdp.on('Network.webSocketFrameSent', printRequest);
      // MISSING XPATH '//div[contains(@class,"Table__head")]/div[contains(@class,"Table__column" ) and contains(@class, "trct-status")]'
      
      const [tournamentButton] = await page.$x('//div[contains(@class,"lpg-lobby-tournaments_button")]')
      tournamentButton.click()
      await waitFor(3000)
      const [tournamentStateHeader] = await page.$x('//div[contains(@class,"Table__head")]/div[contains(@class,"Table__column" ) and contains(@class, "trct-status")]')
      await waitFor(3000)
      await tournamentStateHeader.click()
      await waitFor(3000)
      
      
      const tourneyLobbyButtons = await page.$x('//div[@class="actions"]')
      await page.screenshot({'path': './look_at_tournaments.png'})
  
      for(let i=0; i<tourneyLobbyButtons.length; i++) {
        tourneyLobbyButtons[i].click()
        await waitFor(3000)
        const [xButton] = await page.$x('//div[contains(@class,"close_action")]')
        await waitFor(2000)
        xButton.click()
        await waitFor(3000)
  
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

  exports.StockPokerScraper = StockPokerScraper