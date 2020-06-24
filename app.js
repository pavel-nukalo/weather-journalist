const TelegramBot = require('node-telegram-bot-api');
const cyrillicToTranslit = require('cyrillic-to-translit-js');
const config = require('config');
const { getUser, setUser } = require('./db');
const { getWeather, renderWeatherReport } = require('./weather');

const bot = new TelegramBot(config.get('TelegramBot.token'), Object.assign({}, config.get('TelegramBot.options')));

bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id;
  const html = `
Вас приветствует Погодный Журналист ;)
Этот бот покажет вам прогноз погоды на сегодня и ближайшие дни в вашем городе.
Сперва скажите боту в каком городе вы находитесь:

/city <b>город</b>

Бот запомнит город, и повторно вводить его не придется.
Теперь когда бот настроен, введите команду:

/weather

и выберите период на который хотите узнать погоду.
  `;

  bot.sendMessage(chatId, html, { parse_mode: 'HTML' });
});

bot.onText(/\/city/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match.input.split(' ')[1];

  if (!input) {
    bot.sendMessage(chatId, 'Введите название города.');
    return;
  }

  try {
    const city = cyrillicToTranslit().transform(input);
    await getWeather(city);
    await setUser(chatId, { city });

    bot.sendMessage(chatId, 'Город найден. Бот его запомнил.');
  } catch (e) {
    bot.sendMessage(chatId, 'Город не найден, проверьте корректность ввода названия города...');
  }
});

bot.onText(/\/weather/, async (msg, match) => {
  const chatId = msg.chat.id;

  try {
    const user = await getUser(chatId);
    const city = user ? user.city : '';

    if (!city) {
      const html = `
Сперва введите свой город: 
/city <b>город</b>
      `;

      bot.sendMessage(chatId, html, { parse_mode: 'HTML' });
      return;
    }

    const message = 'Выберите период, на который вы хотите узнать погоду:';
    const options = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: 'Сегодня', callback_data: 'today' }],
          [{ text: 'Завтра', callback_data: 'tomorrow' }],
          [{ text: 'Послезавтра', callback_data: 'day_after_tomorrow' }]
        ]
      })
    };

    bot.sendMessage(chatId, message, options);
  } catch (e) {
    bot.sendMessage(chatId, 'При обращении к БД что-то пошло не так...');
  }
});

bot.on('callback_query', async callbackQuery => {
  const chatId = callbackQuery.message.chat.id;

  try {
    const user = await getUser(chatId);
    const city = user ? user.city : '';
    const day = callbackQuery.data;
    const info = await getWeather(city, day);
    const html = renderWeatherReport(info);

    bot.editMessageText(html, {
      message_id: callbackQuery.message.message_id,
      chat_id: callbackQuery.from.id,
      parse_mode: 'HTML'
    });
  } catch (e) {
    bot.sendMessage(chatId, 'При обращении к сервису погоды что-то пошло не так...');
  }
});

console.log('App starts');