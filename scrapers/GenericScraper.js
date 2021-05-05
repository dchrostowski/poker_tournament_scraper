const puppeteer = require('puppeteer')
const {waitFor, insertRecord, insertRunning} = require('../util/util')
const db = require('../util/db')
const {TournamentResult, PlayerPosition, RunningTournament} = require('../util/db_models')

const GenericScraper = async (config) => {

    const printRequest = response => null;
  
    const parseResponse = (async (response) => {
      
      response = response.response.payloadData
      response = JSON.parse(response)
  
      if (response.hasOwnProperty('t') && response.t === 'LobbyTournamentInfo') {
        if(
          response.hasOwnProperty('info') && // has info
          response.hasOwnProperty('players') && // shows players
          response.players.length > 0 && // there is at least one player
          response.players[0].hasOwnProperty('n')) { // the first player has a username in the data

          
          const tournamentData = {}
          tournamentData['site'] = config.site
          tournamentData['tournamentId'] = response.info.i
          tournamentData['uniqueId'] = config.tournamentIdPrefix + '_' + response.info.i
          tournamentData['tournamentName'] = response.info.n
          tournamentData['startDate'] = response.info.sd
          tournamentData['endDate'] = response.info.le
          tournamentData['bitcoinValue'] = config.cryptocurrency.BTC.usdValue
          tournamentData['buyin'] = response.info.b / 100
          tournamentData['entryFee'] = response.info.e / 100
          tournamentData['currency'] = config.currency

          console.log(tournamentData)
          
  
          
  
          const unsortedPlayers = response.players.map((player) => {
              
              return {
                playerName: player.n,
                position: player.p + 1,
                prize1:  player.ma/100,
                prize2: player.bp/100,
                totalPrize: (player.ma + player.bp) / 100,
                rebuyAmount: (player.eb + player.rf) / 100,
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
              tournamentData['results'] = sortedPlayers
              const dbTournamentResult = new TournamentResult({...tournamentData})
              insertRecord(dbTournamentResult)
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
            

            const runningTournament = new RunningTournament({
              tournamentName: tournamentData['tournamentName'],
              tournamentId: tournamentData['tournamentId'],
              uniqueId: tournamentData['uniqueId'],
              site: tournamentData['site'],
              players: runningSortedPlayers,
              lastUpdate: new Date().getTime()

            })

            insertRunning(runningTournament)
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
      await page.goto(`https://play.${config.site}/`, { waitUntil: 'networkidle0', timeout: 60000 })

      const cdp = await page.target().createCDPSession();
      await cdp.send('Network.enable');
      await cdp.send('Page.enable');
      
      cdp.on('Network.webSocketFrameReceived', parseResponse); // Fired when WebSocket message is received.
      cdp.on('Network.webSocketFrameSent', printRequest);
      const [tournamentButton] = await page.$x('//div[contains(@class,"lpg-lobby-tournaments_button")]')
      tournamentButton.click()
      await waitFor(3000)
      const [statusDropDown] = await page.$x('//div[@class="button-content"]/span[contains(text(),"Status")]/ancestor::div[@class="button-content"]')
      await waitFor(3000)
      await statusDropDown.click()
      await waitFor(3000)
  
      const [any,completed,running,in_a_day,in_an_hour,late_reg] = await page.$x('//div[contains(@class, "Select__popup_item")]/div[@class="Checkbox__content"]')
      await waitFor(1000)
      await any.click()
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