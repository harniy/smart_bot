const TelegramBot = require('node-telegram-bot-api');
const MongoClient = require('mongodb').MongoClient;
const botTOKEN = require('./config.json')


const { start, randonWord, addWordToUser, learnWords, userLearnWords } = require('./index')


const token = botTOKEN.token

const bot = new TelegramBot(token, {polling: true});

const url = botTOKEN.URL

const client = new MongoClient(url, { useUnifiedTopology: true });


bot.setMyCommands([
    { command: '/start', description: 'Начальное приветствие' },
    { command: '/new', description: 'Узнать новое слово' },
    { command: '/learn', description: 'Посмотреть изученные слова' },
])

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.username
    const text = msg.text


    if(text === '/start'){
        const begin = async () => {
            await client.connect();
            const users = client.db().collection('users')
            const user = await users.findOne({ name: name})
            if(user === null) {
                console.log('Пользователь создан')
                await users.insertOne({ name: name, chatID: chatId, words: []})
            }else {
                console.log('Пользователь уже есть')
            }
        }
        begin()

        bot.sendMessage(chatId, `Приветствую ${name}🤗🖐!  Давай вместе повышать словарный запас и изучать что то новое👨‍🎓 \nНажмите /new и узнайте новое слово 🙃`)
    }

    if(text === '/new') {
        async function random() {
            let word = await randonWord(name)
            bot.sendMessage(chatId, `${word[0].title} - ${word[0].detail}`)
            bot.sendMessage(chatId, `Продолжим?💡 Нажми => /new`)
        }
        random()
    }

    if(text === '/learn') {
        async function learn() {
            let words = await learnWords(name)
            if(words.length) {
                let userWords = await userLearnWords(words)
               await bot.sendMessage(chatId, userWords)
               await bot.sendMessage(chatId, 'Отправьте мне слово и я покажу вам его описание 😉')
            }   else {
                bot.sendMessage(chatId, 'Вы еще ничего не изучили 🤔 Нажмите /new и узнайте новое слово 🙃')
            }
        }
        learn()
    }

    if(text === '/help') {
        let helpText = `Телеграм-бот, созданный для развлечения, а не для работы.\n*Доступные команды:*\n`;
        helpText += COMMANDS.map(
          (command) => `*/${command.command}* ${command.description}`
        ).join(`\n`);

        bot.sendMessage(chatId, helpText)
    }

    if(text !== '/new' && text !== '/start' && text !== '/help' && text !== '/learn' && text !== '/send-to-all-users'){

        let getInfo = new Promise(res =>{
            res(start(text))
        })
        getInfo.then(data => {
            console.log('Полученные данные с сервера!~~~')
            const info = JSON.parse(data)
            if(info === null){
                return bot.sendMessage(chatId, 'Такого слова нет...')
            }
            bot.sendMessage(chatId, `${info.title} - ${info.detail}`)
        })
    }
  });

  bot.onText(/\/send-to-all-users/, (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text

    async function sendMessages() {
        await client.connect()
        let usersCollect = await client.db().collection('users')
        let allUsers = await usersCollect.distinct("chatID")
        let usersName = await usersCollect.distinct('name')

        let wordOfDay = await getRandomWord(usersName)


        await bot.sendMessage(chatId, 'Рассылка начата!')

        await interval(allUsers, 0, chatId, usersName, wordOfDay[0])
        
        
    }

    sendMessages()
    
    
  })

async function interval(users, num = 0, chatId, usersName, wordOfDay){
    let count = num
    let userCount = users.length

    for(let i = num; i < userCount; i++) {
        count ++

        bot.sendMessage(users[i], `Слово дня 🤓🧐🎓`)
        bot.sendMessage(users[i], `${wordOfDay.title} - ${wordOfDay.detail}`)
        if(count >= userCount) {
            await bot.sendMessage(chatId, 'Рассылка закончена!')
            break
        }
        if(count % 25 == 0){ 
            console.log('pause')
            setTimeout(() => {
               return interval(users, count, chatId, usersName, wordOfDay)
            }, 2000);
            break
        }
        console.log(count)
    }
}


async function getRandomWord(users){
    await client.connect()
    let words = await client.db().collection('wordsdb')
    let word = await words.aggregate(
        [ { $sample: { size: 1 } } ]
     ).toArray()

     let id = word[0]._id

     users.forEach(name => {
        addWordToUser(name, id)
     })

     return word
}