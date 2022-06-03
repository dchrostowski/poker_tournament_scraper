const mongoose = require("mongoose")
const Schema = mongoose.Schema

const playerPosition = new Schema({
  playerName: { type: String, required: true },
  position: { type: Number, required: true },
  prize1: { type: Number, default: 0 },
  prize2: { type: Number, default: 0 },
  totalPrize: { type: Number, required: true },
  rebuyAmount: { type: Number, required: false },
  numRebuys: { type: Number, required: false },
  numAddons: { type: Number, required: false },
  chips: { type: Number, required: false }
})

const tournamentState = new Schema({
  tournamentState: {
    type: String,
    enum: [
      "completed",
      "running",
      "registering",
      "seating",
      "announced",
      "cancelled",
      "unfinished"
    ]
  }
})

const tournamentType = new Schema({
  tournamentType: {
    type: String,
    enum: ["scheduled", "sit-and-go", "manual"]
  }
})

const cryptocurrencyValue = new Schema({
  name: { type: String, required: true },
  abbreviation: { type: String, required: true },
  date: { type: Date, required: true },
  usdValue: { type: Number, required: true }
})

const tournamentResult = new Schema({
  uniqueId: { type: String, required: true, unique: true },
  site: { type: String, required: true },
  tournamentId: { type: Number, required: true },
  tournamentName: { type: String, required: true },
  tournamentState: { type: tournamentState },
  tournamentType: { type: tournamentType },
  buyin: { type: Number, required: true },
  entryFee: { type: Number, required: true },
  bounty: { type: Number, required: false },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  bitcoinValue: { type: Number, required: false },
  currency: { type: String, required: true },
  results: { type: [playerPosition], required: true }
})

const runningTournament = new Schema({
  uniqueId: { type: String, required: true, unique: true },
  tournamentId: { type: Number, required: true },
  tournamentState: { type: tournamentState, required: true },
  tournamentType: { type: tournamentType, required: true },
  tournamentName: { type: String, required: true },
  site: { type: String, required: true },
  lastUpdate: { type: Date, required: true },
  players: { type: [playerPosition], required: true }
})

const registeringTournament = new Schema({
  uniqueId: { type: String, required: true, unique: true },
  tournamentId: { type: Number, required: true },
  tournamentState: { type: tournamentState, required: true },
  tournamentType: { type: tournamentType, required: true },
  tournamentName: { type: String, required: true },
  site: { type: String, required: true },
  lastUpdate: { type: Date, required: true },
  players: { type: [playerPosition], required: false }
})

const TournamentResult = mongoose.model("TournamentResult", tournamentResult)

const PlayerPosition = mongoose.model("PlayerPosition", playerPosition)
const RunningTournament = mongoose.model("RunningTournament", runningTournament)
const RegisteringTournament = mongoose.model(
  "RegisteringTournament",
  registeringTournament
)
const CryptocurrencyValue = mongoose.model(
  "CryptocurrencyValue",
  cryptocurrencyValue
)

const TournamentState = mongoose.model("TournamentState", tournamentState)
const TournamentType = mongoose.model("TournamentType", tournamentType)

module.exports = {
  TournamentResult,
  PlayerPosition,
  RunningTournament,
  CryptocurrencyValue,
  RegisteringTournament,
  TournamentState,
  TournamentType
}
