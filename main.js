const {
  GenericWebSocketScraper
} = require("./socket_scraper/GenericWebSocketScraper");
const { getDBConnection } = require("./socket_scraper/db");
const {
  insertCompleted,
  insertRunning,
  insertRegistering,
  pruneRegistering
} = require("./socket_scraper/util");
getDBConnection();

//console.log(db)

const rounderConfig = {
  site: "roundercasino.com",
  tournamentIdPrefix: "RC",
  currency: "USD",
  cryptocurrency: null,
  socketUrl: "wss://web.latpoker.com/front"
};

const stockConfig = {
  site: "stockpokeronline.com",
  tournamentIdPrefix: "SPO",
  currency: "USD",
  cryptocurrency: null,
  socketUrl: "wss://web.stockpokeronline.com/front"
};

const insertData = tournament => {
  switch (tournament.tournamentState.tournamentState) {
    case "running": {
      insertRunning(tournament);
      break;
    }
    case "registering": {
      insertRegistering(tournament);
      break;
    }
    case "completed": {
      insertCompleted(tournament);
      break;
    }
  }

  pruneRegistering(300000);
};

const run = configs => {
  configs.forEach(config => {
    return GenericWebSocketScraper(config, function(tournaments) {
      try {
        tournaments.forEach(tournament => {
          insertData(tournament);
        });
      } catch (err) {
        console.error(err);
      } finally {
        return run([config]);
      }
    });
  });
};

run([stockConfig, rounderConfig]);
