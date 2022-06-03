const mongoose = require("mongoose")
const { waitFor } = require("./util")

const {
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOSTNAME,
  MONGO_PORT,
  MONGO_DB
} = process.env

const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`
console.log(url)

console.log(url)
let connection
async function getDBConnection() {
  await waitFor(2000)
  try {
    return await mongoose.connect(url, { useNewUrlParser: true })
  } catch (err) {
    console.log(err)
    console.log("error connecting to database.  Retrying...")
    return await getDBConnection()
  }
}

//return doConnect()

module.exports = { getDBConnection }
