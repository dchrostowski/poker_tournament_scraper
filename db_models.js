import mongoose from 'mongoose'
const Schema = mongoose.Schema


const player = new Schema({
    uniqueId: {type: String, required: true, unique: true},
    playerName: {type: String, required: true },
    playerId: {type: Number, required: true},
    playerGivenName: {type:String, required:false},
    playerSurname: {type: String, required: false},
    site: {type: String, required: true},
    lastActive: {type: Date, required: true},
    country: {type: String, required: false}
})

const playerPosition = new Schema({
    playerName: { type: String, required: true },
    position: { type: Number, required: true },
    prize1: { type: Number, default: 0 },
    prize2: { type: Number, default: 0 },
    totalPrize: { type: Number, required: true },
    rebuyAmount: { type: Number, required: false },
    chips: { type: Number, required: false }
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
    tournamentState: { type: String, required: true },
    tournamentType: { type: String, required: true },
    buyin: { type: Number, required: true },
    entryFee: { type: Number, required: true },
    bounty: { type: Number, required: true },
    startingChips: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    bitcoinValue: { type: Number, required: false },
    currency: { type: String, required: true },
    results: { type: [playerPosition], required: true }

})

const runningTournament = new Schema({
    uniqueId: { type: String, required: true, unique: true },
    tournamentId: { type: Number, required: true },
    tournamentState: { type: String, required: true },
    tournamentType: { type: String, required: true },
    tournamentName: { type: String, required: true },
    startingChips: { type: Number, required: true },
    startDate: {type: Date, required: false},
    site: { type: String, required: true },
    lastUpdate: { type: Date, required: true },
    players: { type: [playerPosition], required: true }
})

const registeringTournament = new Schema({
    uniqueId: { type: String, required: true, unique: true },
    tournamentId: { type: Number, required: true },
    tournamentState: { type: String, required: true },
    tournamentType: { type: String, required: true },
    tournamentName: { type: String, required: true },
    startingChips: { type: Number, required: true },
    startDate: {type: Date, required: false},
    site: { type: String, required: true },
    lastUpdate: { type: Date, required: true },
    players: { type: [playerPosition], required: false }
})

export const TournamentResult = mongoose.model("TournamentResult", tournamentResult)
export const PlayerPosition = mongoose.model("PlayerPosition", playerPosition)
export const RunningTournament = mongoose.model("RunningTournament", runningTournament)
export const RunningTournamentArchive = mongoose.model('RunningTournamentArchive',runningTournament)
export const Player = mongoose.model('Player', player)

export const RegisteringTournament = mongoose.model(
    "RegisteringTournament",
    registeringTournament
)
const CryptocurrencyValue = mongoose.model(
    "CryptocurrencyValue",
    cryptocurrencyValue
)

