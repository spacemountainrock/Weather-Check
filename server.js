const fetch = require("node-fetch");
const express = require("express");
require("dotenv").config();
const app = express();
app.use(express.static(__dirname));
app.use(express.json({ limit: "1mb" }));

const darkskyKey = process.env.DARK_SKY_KEY;
const mapboxKey = process.env.MAP_BOX_KEY;
const windyKey = process.env.WINDY_KEY;
app.listen(3000, () => {
  console.log("listening at 3000");
});

console.log(process.env);

app.post("/api", (req, resp) => {
  fetch(
    `https://api.darksky.net/forecast/${darkskyKey}/${req.body.lat},${req.body.lon}?exclude=minutely,alerts,flags,offset&units=si`
  )
    .then(res => {
      res.json().then(res => {
        const raw = processData(res);
        const weatherCheckData = weatherCheck(raw);
        resp.json(weatherCheckData);
      });
    })
    .catch(e => {
      resp.status(500).json(e);
    });
});

app.post("/search", (req, resp) => {
  fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${req.body.searchTerm}.json?access_token=${mapboxKey}&autocomplete=true`
  ).then(res => res.json().then(res => resp.json(res)));
});

app.post("/geolocation", (req, resp) => {
  fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/%20${req.body.lon},${req.body.lat}.json?access_token=${mapboxKey}&autocomplete=true&types=country,region,district,locality,place`
  )
    .then(res => res.json().then(res => resp.json(res)))
    .catch(e => console.log(e));
});

app.get("/keys", (req, resp) => {
  resp.json({ mapboxKey: mapboxKey, windyKey: windyKey });
});

app.post("/offlineapi", (req, resp) => {
  // console.log(req.body);
  fetch("http://localhost:3000/weather-data.json").then(res => {
    // const raw = processData(res);
    res.json().then(res => {
      const raw = processData(res);
      const weatherCheckData = weatherCheck(raw);
      resp.json(weatherCheckData);
    });
  });
});

function processData(obj) {
  const processedObj = Object.assign({}, obj);

  return expandObj(processedObj);
  function expandObj(processedObj) {
    Object.keys(processedObj).map((entry, index) => {
      if (typeof processedObj[entry] === "object") {
        expandObj(processedObj[entry]);
      } else {
        const entryText = entry.toString().toLowerCase();
        if ((entryText.indexOf("temp") > -1 && entryText.indexOf("time") == -1) || entryText === "dewpoint") {
          processedObj[entry] = {
            celsius: Math.round(processedObj[entry]).toString(),
            fahrenheit: Math.round(processedObj[entry] * 1.8 + 32).toString()
          };
        } else if (entryText.indexOf("distance") > -1 || entryText === "visibility") {
          processedObj[entry] = {
            kilometers: Math.round(processedObj[entry]).toString(),
            miles: Math.round(processedObj[entry] * 0.621).toString()
          };
        } else if (entryText.indexOf("time") > -1 && entryText.indexOf("zone") == -1) {
          processedObj[entry] = new Date(processedObj[entry] * 1000).toLocaleString("en-GB", {
            timeZone: obj.timezone
          });
        } else if (entryText.indexOf("intensity") > -1 && entryText.indexOf("time") == -1) {
          processedObj[entry] = {
            mmph: Math.round(processedObj[entry]).toString(),
            inph: Math.round(processedObj[entry] / 25.4).toString()
          };
        } else if (entryText === "windgust" || entryText === "windspeed") {
          processedObj[entry] = {
            meterspersecond: Math.round(processedObj[entry]).toString(),
            milesperhour: Math.round(processedObj[entry] * 2.237).toString(),
            knots: Math.round(processedObj[entry] * 1.944).toString()
          };
        } else if (entryText === "pressure") {
          processedObj[entry] = {
            hPa: Math.round(processedObj[entry]).toString(),
            millibar: Math.round(processedObj[entry]).toString(),
            torr: Math.round(processedObj[entry] * 0.75).toString()
          };
        } else if (entryText === "ozone") {
          processedObj[entry] = Number.parseFloat(processedObj[entry]).toFixed();
        } else if (entryText === "uvindex") {
          processedObj[entry] = processedObj[entry];
        }
      }
    });
    return processedObj;
  }
}

function weatherCheck(raw) {
  raw.hourly.data = raw.hourly.data.filter((e, i) => {
    return i > 0 && i < 13;
  });
  raw.daily.data = raw.daily.data.filter((e, i) => {
    return i >= 0 && i < 8;
  });
  return raw;
}
