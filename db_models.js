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
        tournamentId: { type: Number, required: true }, // id
        tournamentName: { type: String, required: true }, // info.n
        startDate: { type: Date, required: true }, //info.sd
        endDate: { type: Date, required: true }, //info.le 
        results: [playerPosition]
})

const TournamentResult = mongoose.model('TournamentResult', tournamentResult)
const PlayerPosition = mongoose.model('PlayerPosition', playerPosition)


module.exports = {TournamentResult, PlayerPosition}
