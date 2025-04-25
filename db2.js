import {MongoClient} from 'mongodb'

const {
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOSTNAME,
  MONGO_PORT,
  MONGO_DB
} = process.env

const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`
const client = new MongoClient(url)


export async function connectClient() {
  try {
    await client.connect()
    return client
  } catch (err) {
    console.log(err)
    console.log("error connecting to database.  Retrying...")
    return await connectClient()
  }
}

export async function closeDBConnection(client) {
  await client.close()
}