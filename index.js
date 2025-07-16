alert("For better experience use the desktop mode or pc.")
const hfa = document.querySelectorAll('.hfa');
const dfa = document.querySelectorAll('.dfa');

///////////city suggestion/////////////////////////////
const searchCity = document.querySelector("#citySearch");
let lastInput;

function fetchCities(query) {

  const suggestionsList = document.getElementById("suggestions");
  let states = [];
  if (query === "") {
    suggestionsList.innerHTML = "";
    suggestionsList.classList.remove("addres");
  }
  else if (query.length < 4) return;

  clearTimeout(lastInput);
  lastInput = setTimeout(async () => {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1`);

    const data = await response.json();
    const suggestionsList = document.getElementById("suggestions");
    suggestionsList.innerHTML = "";
    data.forEach(city => {

      const address = city.address;
      const cityName = address.state_district || "";
      const state = address.state;
      if (states.includes(state)) return;
      else states.push(state)
      const country = address.country;
      const listItem = document.createElement("li");
      listItem.textContent = `${cityName}, ${state}, ${country}`;
      suggestionsList.classList.add("addres");
      suggestionsList.appendChild(listItem);

      listItem.onclick = (e) => {

        document.getElementById("citySearch").value = listItem.textContent
        suggestionsList.innerHTML = "";
        suggestionsList.classList.remove("addres");
        getLatiLongi(searchCity.value)
      };
    });
    states = [];
  }, 1000);
}

searchCity.addEventListener("input", (e) => {
  fetchCities(e.target.value);
});

////////////////////////finding latitude and longitude//////////////////////////

async function getLatiLongi(cityName) {
  const coOrdinate = await fetch(`https://nominatim.openstreetmap.org/search?q=${cityName}&format=json`)
  const latiLongi = await coOrdinate.json();
  const latitude = latiLongi[0].lat;
  const longitude = latiLongi[0].lon;
  weather(latitude, longitude);
}

///////////////////////////fetching weather data/////////////////////////////

async function weather(latitude, longitude) {

  const currentResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=auto&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m`);

  const cData = await currentResponse.json();
  const currentData = cData['current'];
  const currentUnits = cData['current_units']

  const timeString = currentData['time'];
  const dateObj = new Date(timeString);
  const currentHour = dateObj.getHours();
  const ampm = currentHour >= 12 ? "pm" : "am";

  const currentDate = dateObj.getDate();
  const currentMonth = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  const daysInMonth = new Date(year, currentMonth, 0).getDate();


const dayOne = dateObj.toISOString().slice(0,10);

let dayTwo = new Date(timeString);
dayTwo.setDate(dayTwo.getDate()-1);
dayTwo = dayTwo.toISOString().slice(0,10);

  const hourlyResponse = await fetch(`https://api.open-meteo.com/v1/forecast?timezone=auto&latitude=${latitude}&longitude=${longitude}&forecast_days=2&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,rain,weather_code,pressure_msl,surface_pressure,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index`);

  const hourlydata = await hourlyResponse.json();
  const visiAndUvindex = hourlydata['hourly'];

  const otherCurrents = [visiAndUvindex['visibility'][currentHour], visiAndUvindex['uv_index'][currentHour], visiAndUvindex['weather_code'][currentHour]];
  currentWeather(currentData, currentUnits, otherCurrents);

  hourlyWeather(hourlydata['hourly'], currentData["is_day"], currentHour);

  const dailyresponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,uv_index_clear_sky_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,cloud_cover_max,precipitation_probability_max,precipitation_probability_mean,precipitation_probability_min,temperature_2m_min&timezone=auto`);

  const dailydata = await dailyresponse.json();

  dailyForcast(dailydata['daily'], currentDate, currentMonth, daysInMonth);
  const aqiresponse = await fetch(`https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=e2f439e75d6dc749e7c3cb8b8d9527fa534d81a9`);
  const aqiData = await aqiresponse.json();
  setAqi(aqiData['data']['aqi']);

  const archive = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${dayTwo}&end_date=${dayOne}&daily=sunrise,sunset&timezone=auto`)
  const archiveData = await archive.json();
  const previousDay = archiveData['daily']['sunset'][0];

  const sunSetRiseData = [currentData['is_day'], dailydata['daily']['sunrise'], dailydata['daily']['sunset'], dailydata['daily']['sunshine_duration'], dailydata['daily']['daylight_duration']]
  sunSetRise(sunSetRiseData, previousDay, dateObj,ampm);
}

////////////////////////device location/////////////////////////
async function deviceLocation() {

  const devicecordinates = await fetch(`https://us1.api-bdc.net/data/reverse-geocode-client`);
  const deviceLocation = await devicecordinates.json();
  const lati = deviceLocation['latitude'];
  const longi = deviceLocation['longitude'];
  searchCity.value = `${deviceLocation['city']}, ${deviceLocation['principalSubdivision']}`;
  weather(lati, longi);
}

window.onload = deviceLocation;

////////////////////////////setting current data//////////////////////////

function currentWeather(currentData, currentUnits, otherCurrents) {

  const currentTemp = currentData['temperature_2m'] + currentUnits['temperature_2m']
  document.querySelector(".today-temp").innerText = currentTemp;


  const weatherCondition = weatherConditions(otherCurrents[2])
  document.querySelector('.today-condition').innerText = weatherCondition[0];
  document.querySelector('.today-discription').innerText = weatherCondition[1];

  const fleeslike = currentData['apparent_temperature'] + currentUnits['apparent_temperature'];
  document.querySelector('.feelslike').innerText = fleeslike;

  const humidity = currentData['relative_humidity_2m'] + currentUnits['relative_humidity_2m'];
  document.querySelector('.humidity').innerText = humidity;

  const pressure = currentData['pressure_msl'] + " " + currentUnits['pressure_msl'];
  document.querySelector('.pressure').innerText = pressure;

  const wind_drec = degreesToDirection(currentData['wind_direction_10m'])

  document.querySelector('.wd').innerText = wind_drec + " wind";

  document.querySelector('.ws').innerText = currentData['wind_speed_10m'] + " km/h";


  document.querySelector('.visibility').innerText = `${otherCurrents[0] / 1000} Km`;

  const uvCategory = getUVCategory(otherCurrents[1]);
  document.querySelector('.uv').innerText = otherCurrents[1] + " " + uvCategory;
}


////////////////////////////hourly weather ///////////////////////////////////////
function hourlyWeather(hourly, isDay, C_hour) {

  let times = C_hour;

  hfa.forEach(hw => {
    hw.innerHTML = "";
    let ampm = times > 12 ? "pm" : "am";
    const time = document.createElement('b');
    const temp = document.createElement('p');

    if (hw === hfa[0]) {
      time.innerText = "Now";
      temp.innerText = `${hourly["apparent_temperature"][times]} °C`;
    } else {
      let timess = times % 12 == 0 ? 12 : times % 12;
      time.innerText = `${timess}:00 ${ampm}`;
      temp.innerText = `${hourly["apparent_temperature"][times]} °C`;
    }

    const precipitation_probability = hourly["precipitation_probability"][times];
    let cloudIcon = getIcon(precipitation_probability, isDay);

    const wIcon = document.createElement('i');
    wIcon.classList.add("fa-solid");
    wIcon.classList.add("fa-lg");
    wIcon.classList.add(cloudIcon);

    hw.appendChild(time);
    hw.appendChild(temp);
    hw.appendChild(wIcon);
    times++;
    if (times >= 24) times = 0;

  });

}

///////////////////////////daily forecast/////////////////////////////////////////////////

function dailyForcast(daily, C_date, C_month, daysInMonth) {

  let nDate = C_date + 1;
  let cMonth = C_month;
  let index = 0;

  dfa.forEach(el => {
    el.innerHTML = "";
    if (nDate > daysInMonth) {
      nDate = 1;
      cMonth++;
    }
    const date = document.createElement('b');
    const minMaxTemp = document.createElement('p');
    const condition = document.createElement('p');

    if (index == 0) {
      date.innerText = "Today";
    } else {

      date.innerText = `${nDate}/${cMonth}`;
      nDate++;
    }

    minMaxTemp.innerText = daily["apparent_temperature_max"][index] + "° / " + daily["apparent_temperature_min"][index] + "°";

    const discripAndCondition = weatherConditions(daily['weather_code'][index]);

    condition.innerText = discripAndCondition[0].slice(0, 9) + "...";

    index++;
    el.appendChild(date);
    el.appendChild(minMaxTemp);
    el.appendChild(condition);

    el.addEventListener("mouseenter", (e) => {

      const element = e.target;
      element.lastElementChild.innerText = discripAndCondition[0];
    })

    el.addEventListener("mouseleave", (e) => {

      const element = e.target;
      element.lastElementChild.innerText = discripAndCondition[0].slice(0, 9) + "...";
    })

  });

}

//////////////////////////range of uv index////////////////////////
function getUVCategory(uvIndex) {
  if (uvIndex == 0) return "very weak";
  else if (uvIndex <= 2) return "Low";
  else if (uvIndex <= 5) return "Moderate";
  else if (uvIndex <= 7) return "High";
  else if (uvIndex <= 10) return "Very High";
  return "Extreme";
}

/////////////////////////get icon////////////////////////////////

function getIcon(precPro, isDay) {
  if (precPro == 0 & isDay == 1) {
    return "fa-sun-bright";
  }
  else if (precPro == 0 & isDay == 0) {
    return "fa-moon-stars";
  }
  else if (precPro < 15) return "fa-cloud";
  else if (precPro < 30) return "fa-clouds";
  else if (precPro < 50) return "fa-cloud-bolt";
  else if (precPro < 70) return "fa-cloud-drizzle";
  else if (precPro < 85) return "fa-cloud-showers";
  else if (precPro > 85) return "fa-cloud-showers-heavy";
}

/////////////////////////////wind direction///////////////////////////////
function degreesToDirection(degree) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degree / 45) % 8;
  return directions[index];
}

////////////////////////////weather conditions /////////////////////////////

function weatherConditions(weatherCode) {
  const weatherCodeLookup = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Drizzle: Light intensity",
    53: "Drizzle: Moderate intensity",
    55: "Drizzle: Dense intensity",
    56: "Freezing drizzle: Light intensity",
    57: "Freezing drizzle: Dense intensity",
    61: "Rain: Slight intensity",
    63: "Rain: Moderate intensity",
    65: "Rain: Heavy intensity",
    66: "Freezing rain: Light intensity",
    67: "Freezing rain: Heavy intensity",
    71: "Snow fall: Slight intensity",
    73: "Snow fall: Moderate intensity",
    75: "Snow fall: Heavy intensity",
    77: "Snow grains",
    80: "Rain showers: Slight",
    81: "Rain showers: Moderate",
    82: "Rain showers: Violent",
    85: "Snow showers: Slight",
    86: "Snow showers: Heavy",
    95: "Thunderstorm: Slight or moderate",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };

  const weatherCodeDescription = {
    0: "A perfect day with clear blue skies and lots of sunshine.",
    1: "Mostly sunny with a few wispy clouds.",
    2: "Some sun, some clouds — a partly cloudy sky.",
    3: "Completely overcast with a gray sky and no sunshine.",
    45: "Visibility is low due to fog — drive carefully.",
    48: "Cold, icy fog forming frost — watch out for slippery surfaces.",
    51: "Light drizzle — a few drops in the air.",
    53: "Moderate drizzle — might want a light umbrella.",
    55: "Heavy drizzle — damp and persistent, take cover.",
    56: "A chilly mist — light freezing drizzle in the air.",
    57: "Thick freezing drizzle making surfaces icy and slick.",
    61: "Slight rain — gentle pitter-patter on rooftops.",
    63: "Steady moderate rain — don’t forget your umbrella.",
    65: "Heavy rain — roads may start to flood.",
    66: "Cold rain freezing on contact — extremely slippery.",
    67: "Heavy freezing rain — dangerous for driving and walking.",
    71: "Light snow — delicate flakes in the air.",
    73: "Moderate snowfall — enough to start covering the ground.",
    75: "Heavy snowfall — grab the shovel!",
    77: "Tiny snow grains — like powdered sugar in the air.",
    80: "Slight rain showers — short and light bursts of rain.",
    81: "Moderate rain showers — on and off but noticeable.",
    82: "Violent rain showers — heavy bursts, maybe thunder.",
    85: "Scattered light snow showers — chilly and brisk.",
    86: "Heavy snow showers — expect quick accumulation.",
    95: "Thunderstorm with rumbles — pack up and stay indoors.",
    96: "Thunderstorm with some hail — take cover quickly.",
    99: "Severe thunderstorm with heavy hail — avoid being outside."
  };

  return [weatherCodeLookup[weatherCode], weatherCodeDescription[weatherCode]];
}


//////////////set AQI ////////////////////////
function setAqi(aqIndex) {

  const aqiLevels = [
    {
      range: [0, 50],
      category: "Good",
      condition: "Air quality is satisfactory, and air pollution poses little or no risk.",
      color: "#00E400"
    },
    {
      range: [51, 100],
      category: "Moderate",
      condition: "Air quality is acceptable; however, some pollutants may be a concern for sensitive individuals.",
      color: "#FFFF00"
    },
    {
      range: [101, 150],
      category: "Unhealthy for Sensitive Groups",
      condition: "Members of sensitive groups may experience health effects. The general public is unlikely to be affected.",
      color: "#FF7E00"
    },
    {
      range: [151, 200],
      category: "Unhealthy",
      condition: "Everyone may begin to experience health effects; sensitive groups may experience more serious effects.",
      color: "#FF0000"
    },
    {
      range: [201, 300],
      category: "Very Unhealthy",
      condition: "Health alert: everyone may experience more serious health effects.",
      color: "#8F3F97"
    },
    {
      range: [301, 500],
      category: "Hazardous",
      condition: "Health warnings of emergency conditions. The entire population is more likely to be affected.",
      color: "#7E0023"
    }
  ];

  let candition = ""
  let discrip = "";

  aqiLevels.forEach(aqi => {
    const lower_bound = aqi.range[0];
    const upper_bound = aqi.range[1];
    if (lower_bound <= aqIndex && aqIndex <= upper_bound) {
      candition = aqi.category;
      discrip = aqi.condition;
      return;
    }
  })

  document.querySelector(".aqi-condition").innerText = candition + ` ${aqIndex}`;
  document.querySelector(".aqi-discription").innerText = discrip;
  document.querySelector(".aqIndex div").style.left = `${aqIndex / 5}%`

}


function sunSetRise(data, pData, now,ampm) {

  const sm1 = document.querySelector(".sm1");
  const sm2 = document.querySelector(".sm2");
  const set1 = document.querySelector(".set1");
  const set2 = document.querySelector(".set2");

  if (data[0]) {

    sm1.classList.value = "fa-regular fa-sunrise fa-sm sm1";
    sm2.classList.value = "fa-regular fa-sunset fa-sm sm2";
    set1.firstElementChild.innerText = 'Sunrise';
    set1.lastElementChild.innerText = convertTime(data[1][0])
    set2.firstElementChild.innerText = "Sunset";
    set2.lastElementChild.innerText = convertTime(data[2][0]);

    const sunrise = new Date(data[1][0]);
    const timeLasped = Math.floor((now - sunrise) / 1000);
    const passedPercentage = (timeLasped / data[4][0]) * 100;
    const degree = (passedPercentage / 100) * 180;

    displaaceSun(degree, data[0]);

  }
  else if (!data[0] && ampm === 'pm') {

    sm2.classList.value = "fa-regular fa-sunrise fa-sm sm2";
    sm1.classList.value = "fa-regular fa-sunset fa-sm sm1";
    set1.firstElementChild.innerText = 'Sunset';
    set1.lastElementChild.innerText = convertTime(data[2][0])
    set2.firstElementChild.innerText = "Sunrise";
    set2.lastElementChild.innerText = convertTime(data[1][1]);

    const sunset = new Date(data[2][0]);
    const nextSunrise = new Date(data[1][1]);
    const timeLasped = Math.floor((now - sunset) / 1000);
    const toatalT = Math.floor((nextSunrise - sunset) / 1000);
    const passedPercentage = (timeLasped / toatalT) * 100;
    const degree = (passedPercentage / 100) * 180;
    displaaceSun(degree, data[0]);
  }
  else if (!data[0] && ampm === 'am'){
    sm2.classList.value = "fa-regular fa-sunrise fa-sm sm2";
    sm1.classList.value = "fa-regular fa-sunset fa-sm sm1";
    set1.firstElementChild.innerText = 'Sunset';
    set1.lastElementChild.innerText = convertTime(pData)
    set2.firstElementChild.innerText = "Sunrise";
    set2.lastElementChild.innerText = convertTime(data[1][0]);

    const sunset = new Date(pData);
    const nextSunrise = new Date(data[1][0]);
    const timeLasped = Math.floor((now - sunset) / 1000);
    const toatalT = Math.floor((nextSunrise - sunset) / 1000);
    const passedPercentage = (timeLasped / toatalT) * 100;
    const degree = (passedPercentage / 100) * 180;
    displaaceSun(degree, data[0]);
  }

}

function convertTime(time) {
  const date = new Date(time);

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  const period = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${period}`;
}

function displaaceSun(degree, isDay) {
  if (isDay) {
    document.querySelector('.orbiter').classList.value = "orbiter sun";
  }
  else {
    document.querySelector('.orbiter').classList.value = "orbiter moon";
  }

  const startAngle = Math.PI;
  const rotateBy = degree * (Math.PI / 180);
  const endAngle = startAngle + rotateBy;

  let angle = startAngle;
  const radius = 116;
  const orbiter = document.querySelector('.orbiter');

  const interval = setInterval(() => {
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    orbiter.style.transform = `translate(${x}px, ${y}px)`;

    angle += 0.02;

    if (angle >= endAngle) {
      clearInterval(interval);
    }
  }, 16);

}