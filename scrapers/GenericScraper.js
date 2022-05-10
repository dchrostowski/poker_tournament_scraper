const puppeteer = require('puppeteer')
const {waitFor, insertRecord, insertRunning, updateRecord, updateRunning} = require('../util/util')
const db = require('../util/db')
const {TournamentResult, PlayerPosition, RunningTournament} = require('../util/db_models')
const fs = require('fs')

const {
  ROUNDER_USERNAME,
  ROUNDER_PASSWORD
} = process.env;

const GenericScraper = async (config) => {

    const getUniqueId = (tournamentId) => {
      return `${config.tournamentIdPrefix}_${tournamentId}`

    }

    const printRequest = response => null;
  
    const parseResponse = (async (response) => {
      
      response = response.response.payloadData
      response = JSON.parse(response)

      if (response.hasOwnProperty('t') && response.t === 'TournamentPlayers') {

      if(
        response.hasOwnProperty('players') && // shows players
        response.players.length > 0 && // there is at least one player
        response.players[0].hasOwnProperty('n')) { // the first player has a username in the data
          const tournamentId = response.tournamentId
          

          const unsortedPlayers = response.players.map((player) => {

            const bp = player.bp || 0
            const eb = player.eb || 0
            const rf = player.rf || 0
            const ma = player.ma || 0
            const nr = player.nr || 1
              
            return {
              playerName: player.n,
              position: player.p + 1,
              prize1:  ma/100,
              prize2: bp/100,
              totalPrize: (ma + bp) / 100,
              numRebuys: nr - 1,
              chips: player.c

            }
        })

        if(!config.running) {

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
            const results = sortedPlayers
            
            
            updateRecord(getUniqueId(tournamentId),results)
        }

        else if(config.running) {
          dbUnsortedPlayers = unsortedPlayers.map((player) => {
            return PlayerPosition({...player})
          })

          let eliminated = dbUnsortedPlayers.filter(player => player.position > 0)
          let stillPlaying = dbUnsortedPlayers.filter(player => player.position === 0)

          stillPlaying = stillPlaying.sort((a,b) => a.chips < b.chips ? 1 : -1)
          eliminated = eliminated.sort((a,b) => (a.position > b.position ? 1 : -1))
          for(let j=1; j<= stillPlaying.length; j++) {
              stillPlaying[j-1].position = j
          }

          const runningSortedPlayers = stillPlaying.concat(eliminated)
          
          updateRunning(getUniqueId(tournamentId), runningSortedPlayers )
        }
        }
      }
      
  
      if (response.hasOwnProperty('t') && response.t === 'LobbyTournamentInfo') {
        
        if(response.hasOwnProperty('info') && response.info.hasOwnProperty('n')) { 

          const tournamentData = {}
          
          tournamentData['site'] = config.site
          tournamentData['tournamentId'] = response.info.i
          tournamentData['uniqueId'] = config.tournamentIdPrefix + '_' + response.info.i
          tournamentData['tournamentName'] = response.info.n
          
          tournamentData['currency'] = config.currency

          if(config.running) {
            const runningTournament = new RunningTournament({
              tournamentName: tournamentData['tournamentName'],
              tournamentId: tournamentData['tournamentId'],
              uniqueId: tournamentData['uniqueId'],
              site: tournamentData['site'],
              lastUpdate: new Date().getTime()
            })

            insertRunning(runningTournament)

          }
          else if(!config.running) {
            tournamentData['startDate'] = response.info.sd
            tournamentData['endDate'] = response.info.le
            tournamentData['bitcoinValue'] = config.cryptocurrency.BTC.usdValue
            tournamentData['buyin'] = ( response.info.b || 0 ) / 100
            tournamentData['entryFee'] = (response.info.e || 0 ) / 100
            
            if(response.info.le.indexOf('0000-00-00') !== -1) {
              console.log("skip insert")
            }
            else {
              const dbTournamentResult = new TournamentResult({...tournamentData})
              insertRecord(dbTournamentResult)
            }
              
            
          }

         
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
  
      console.log(`Loading ${config.site}...`)
      await page.setExtraHTTPHeaders({'Sec-Fetch-Dest': 'script'})
      await page.goto(`https://play.${config.site}/`, { waitUntil: 'networkidle0', timeout: 60000 })
      

      const cdp = await page.target().createCDPSession();
      await cdp.send('Network.enable');
      await cdp.send('Page.enable');
      
      cdp.on('Network.webSocketFrameReceived', parseResponse); // Fired when WebSocket message is received.
      cdp.on('Network.webSocketFrameSent', printRequest);
      if(config.site === 'roundercasino.com') {
        
        await waitFor(3000)
        const [usernameInput] = await page.$x('//input[@name="username"]')
        const [passwordInput] = await page.$x('//input[@name="password"]')
        const [loginButton] = await page.$x('//div[contains(@class,"SimpleButton__content")]/div[text()="Sign In"]')
        
        try {
          usernameInput.click()
          await waitFor(1000)
          page.keyboard.type(ROUNDER_USERNAME)
          await waitFor(1000)

          passwordInput.click()
          await waitFor(1000)
          page.keyboard.type(ROUNDER_PASSWORD)
          await waitFor(1000)
          loginButton.click()
          await waitFor(3000)
        }
        catch(error) {
          console.log("error on login:")
          console.log(ROUNDER_USERNAME)
          console.log(ROUNDER_PASSWORD)
          console.log(error)
        }
        
      }

      const [tournamentButton] = await page.$x('//div[contains(@class,"lpg-lobby-tournaments_button")]')
      
      tournamentButton.click()
      await waitFor(3000)
      
      const [statusDropDown] = await page.$x('//div[@class="block Select__content"]/div[@class="block panel button Select__button"]/div[@class="block button-content"]/span[contains(text(),"Status")]')
      await waitFor(3000)

      
      statusDropDown.click()
      await waitFor(3000)
      
      const [any,completed,running,in_a_day,in_an_hour,late_reg] = await page.$x('//div[contains(@class, "Select__popup_item")]/div[contains(@class,"Checkbox__content")]')
      await waitFor(1000)
      any.click()
      await waitFor(1000)
      


      if(config.running) {
        await running.click()
        await waitFor(1000)
        await late_reg.click()
        await waitFor(1000)
        
      }
  
      else {
        await completed.click()
        await waitFor(3000)
      }

      

      const tourneyLobbyButtons = await page.$x('//div[@class="actions"]')
      
  
      for(let i=0; i<tourneyLobbyButtons.length; i++) {
        tourneyLobbyButtons[i].click()
        await waitFor(3000)
        await page.screenshot({path:'./rounder5.png'})
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

  exports.GenericScraper = GenericScraper
