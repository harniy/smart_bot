const MongoClient = require('mongodb').MongoClient;
const monhoURL = require('./config.json')


const url = monhoURL.URL


const client = new MongoClient(url, { useUnifiedTopology: true });

const start = async (args) => {
    try {
        /*         await client.connect();
                console.log('Подключение к базе даееых успешно!~~~')
                await client.db().createCollection('wordsdb')
                const words = client.db().collection('wordsdb')
                await words.insertOne({ title:"амперсант", detail:"спец символ"})
                const word = await words.findOne({title:"амперсант"})
        
                console.log(word) */
        await client.connect();
        /*         const words = await client.db().collection('wordsdb')
                const word = await words.findOne({title:"Фрустрация"})
         */
        if (args) {
            let arg = args[0].toUpperCase() + args.slice(1)
            console.log("Армументы получены:", arg)
            const words = await client.db().collection('wordsdb')
            const word = await words.findOne({ title: arg })
            return JSON.stringify(word)
        }

    } catch (e) {
        console.log(e)
    }
}

// RANDOM WORD FUNCTION
let randonWord = async (name) => {
    await client.connect()
    let words = await client.db().collection('wordsdb')
    let word = await words.aggregate(
        [ { $sample: { size: 1 } } ]
     ).toArray()

     let id = word[0]._id

     addWordToUser(name, id)
     
    return word
}

// ADD WORD TO USER ARRAY
let addWordToUser = async (nickNAme, wordID) => {
    let userCollect = await client.db().collection('users')
    let addWord = await userCollect.update({ name: nickNAme} , { $addToSet : {words: wordID}})
}

// GET PERSONAL USER WORDS
let learnWords = async (nickNAme) => {
    await client.connect()
    let findUser = await client.db().collection('users')
    let user = await findUser.findOne({name: nickNAme})
    let userWords = user.words
    
    return userWords
}

// WRITE TEXT WITH USER WORDS
let userLearnWords = async (words) => {
    let userWordsCollect = await client.db().collection('wordsdb')
    let a = "*Пройденные слова:\n"

    for(let i = 0; i < words.length; i++) {
        let p = await userWordsCollect.findOne({ _id: words[i]})
        let newStr = p.title[0].toUpperCase() + p.title.slice(1)
        a += `${newStr} \n`
    }
    return a
}

module.exports = { start, randonWord, addWordToUser, learnWords, userLearnWords }


