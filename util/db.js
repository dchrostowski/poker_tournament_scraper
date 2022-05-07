const mongoose = require('mongoose');
const {waitFor} = require('./util')


const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_HOSTNAME,
    MONGO_PORT,
    MONGO_DB
} = process.env;


const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
console.log(url)
let connection
async function doConnect() {
    
        await waitFor(2000)
        try {
            connection = await mongoose.connect(url, {useNewUrlParser: true});
            return connection
        }
        catch(err) {
            console.log(err)
            console.log("error connecting to database.  Retrying...")
            return doConnect()
        }

    

}


return doConnect()



