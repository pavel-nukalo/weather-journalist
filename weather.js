const axios = require('axios');
const config = require('config');

exports.getWeather = async (city, day) => {
  const endpoint = `http://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${config.get('OpenWeather.appID')}&lang=ru`;
  const response = await axios.get(endpoint);
  const data = response.data;
  const info = {
    name: data.city.name,
  };

  switch (day) {
    case 'today':
      Object.assign(info, data.list[0]);
      break;

    case 'tomorrow':
      Object.assign(info, data.list[8]);
      break;

    case 'day_after_tomorrow':
      Object.assign(info, data.list[16]);
      break;

    default:
      Object.assign(info, data.list[0]);
      break;
  }

  return info;
};

exports.renderWeatherReport = ({ name, main, weather, wind, clouds }) => {
  return `
Погода в городе <b>${name}</b>: ${weather && weather[0] && weather[0].description}
Температура: <b>${main.temp} °C</b>
Ощущается как: <b>${main.feels_like} °C</b>
Атмосферное давление: <b>${main.pressure} гПа</b>
Относительная влажность: <b>${main.humidity} %</b>
Скорость ветра: <b>${wind.speed} м/с</b>
Облачность: <b>${clouds.all} %</b> 
  `;
};