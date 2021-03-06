import mongoose from 'mongoose'


const {
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOSTNAME,
  MONGO_PORT,
  MONGO_DB
} = process.env

const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`
console.log(url)

const waitFor = async timeToWait => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, timeToWait)
  })
}
export async function getDBConnection() {
  await waitFor(2000)
  try {
    return await mongoose.connect(url, { useNewUrlParser: true })
  } catch (err) {
    console.log(err)
    console.log("error connecting to database.  Retrying...")
    return await getDBConnection()
  }
}