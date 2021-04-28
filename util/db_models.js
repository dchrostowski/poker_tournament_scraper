const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const playerPosition = new Schema({
        playerName: { type: String, required: true },
        position: { type: Number, required: true },
        prize1: { type: Number, default: 0 },
        prize2: { type: Number, default: 0 },
        totalPrize: { type: Number, required: true}
});

const tournamentResult = new Schema({
        uniqueId: {type: String, required: true, unique: true},
        site: { type: String, required: true },
        tournamentId: { type: Number, required: true },
        tournamentName: { type: String, required: true },
        buyin: {type: Number, required: true},
        entryFee: {type: Number, required: true},
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        bitcoinValue: {type: Number, required: true},
        currency: {type: String, required: true},
        results: [playerPosition]
})

const TournamentResult = mongoose.model('TournamentResult', tournamentResult)
const PlayerPosition = mongoose.model('PlayerPosition', playerPosition)


module.exports = {TournamentResult, PlayerPosition}
