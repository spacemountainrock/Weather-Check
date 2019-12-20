const app = {
  domElements: {
    app: document.querySelector(".app")
  },
  variables: {
    section: "dashboard",
    selectedPanel: "#collapseOne",
    myLocation: "",
    mapCenter: []
  },
  apiKeys: {
    mapBoxKey: "pk.eyJ1Ijoic3BhY2Vtb3VudGFpbnJvY2siLCJhIjoiY2p2YXZ3ZXViMG1ncDN6bnFhZWE0emRnZSJ9.yZn0LtmRupaZOAu6CSRPuA",
    windyKey: "2cLDNi6uYO0zNS9RxYVhI7cx5ACyLO2T"
  },
  getDarkySkyData: function(coords) {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(coords)
    };
    fetch("/api", options)
      .then(res => {
        res.json().then(res => {
          console.log(res);
          this.clientProcess(res);
        });
      })
      .catch(e => console.log(e));
  },
  offlineTest: function() {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    };
    fetch("/offlineapi", options)
      .then(res => {
        res.json().then(res => this.clientProcess(res));
      })
      .catch(e => console.log(e));
  },
  init: function(coords) {
    document.querySelector(".page-loader").style.display = "block";
    console.log(app.geocoder.variables.geocodedList[0].text);
    document.querySelector(".location-header h5").textContent = this.variables.myLocation;
    mapboxgl.accessToken = this.apiKeys.mapBoxKey;

    fetch("content/dashboard.html")
      .then(res => {
        res
          .text()
          .then(res => {
            document.querySelector(".main-content").innerHTML = res;
            map = new mapboxgl.Map({
              container: "map", // container id
              style: "mapbox://styles/mapbox/streets-v11", // stylesheet location
              center: app.variables.mapCenter, // starting position [lng, lat]
              zoom: 9, // starting zoom,
              interactive: false
            });

            // document.getElementById("geocoder").appendChild(geocoder.onAdd(map));
            map.on("movestart", function() {
              $(".app").removeClass("rightsidebar-open");
              $(".overlay").removeClass("overlay");
            });
            map.on("moveend", function() {
              console.log(map.getCenter());
            });
            $("select").selectpicker();
            $("#location .dropdown-menu").css("display", "block");
            coords ? this.getDarkySkyData(coords) : this.offlineTest();
            // this.offlineTest();
          })
          .catch(e => console.log(e));
      })
      .catch(e => console.log(e));
    // app.utilities.pageLoader(app.variables.section);
  },
  clientProcess: function(obj) {
    const weatherCheckObject = {
      dashboard: {
        dashboardCharts: {
          xaxis: null,
          yaxis: {
            temperature: {},
            windSpeed: {},
            windBearing: [],
            icon: [],
            summary: [],
            windGust: {}
          }
        }
      },
      charts: {
        xaxis: [],
        yaxis: {
          apparentTemperature: {},
          dewPoint: {},
          uvIndex: [],
          humidity: [],
          ozone: [],
          visibility: {},
          precipProbability: [],
          precipIntensity: {}
        }
      },
      weekly: {
        weeklyCharts: {
          xaxis: [],
          yaxis: {
            uvIndex: [],
            uvIndexTime: [],
            temperatureMax: {},
            temperatureMaxTime: [],
            temperatureMin: {},
            temperatureMinTime: [],
            humidity: [],
            windSpeed: {},
            windBearing: [],
            windGust: {},
            windGustTime: [],
            precipProbability: [],
            precipIntensity: {}
          }
        },
        weeklyData: []
      },
      map: {}
    };
    this.data.weatherCheckObj = Object.assign({}, weatherCheckObject);
    const { weatherCheckObj } = this.data;
    this.fetchDashboardData(obj);
    this.fetchWeeklyData(obj);
    this.fetchChartData(obj);
    this.data.filtered = this.utilities.filterUnits(JSON.parse(JSON.stringify(weatherCheckObj)));

    app.utilities.pageLoader(app.variables.section);
    // this.loadDashboardData(this.data.filtered.dashboard);
    document.querySelector(".page-loader").style.display = "none";
  },
  fetchDashboardData: function(obj) {
    const { weatherCheckObj } = this.data;
    const { dashboard } = weatherCheckObj;
    ({
      latitude: weatherCheckObj.map.latitude,
      longitude: weatherCheckObj.map.longitude,
      timezone: weatherCheckObj.timezone
    } = obj);
    dashboard.dashboardCharts.xaxis = obj.hourly.data.map((entry, index) => {
      return new Date(entry.time).toISOString().substr(11, 5);
      // return new Date(entry.time)
      //   .toISOString()
      //   .split(" ")[0]
      //   .slice(0, -3);
    });
    ({
      temperature: dashboard.temperature,
      time: dashboard.time,
      summary: dashboard.summary,
      apparentTemperature: dashboard.feelslike,
      uvIndex: dashboard.uvIndex,
      cloudCover: dashboard.cloudCover,
      dewPoint: dashboard.dewPoint,
      humidity: dashboard.humidity,
      icon: dashboard.icon,
      ozone: dashboard.ozone,
      precipIntensity: dashboard.precipIntensity,
      precipProbability: dashboard.precipProbability,
      pressure: dashboard.pressure,
      visibility: dashboard.visibility,
      windBearing: dashboard.windBearing,
      windGust: dashboard.windGust,
      windSpeed: dashboard.windSpeed
    } = obj.currently);
    ({
      sunriseTime: dashboard.sunriseTime,
      sunsetTime: dashboard.sunsetTime,
      temperatureMax: dashboard.temperatureMax,
      temperatureMaxTime: dashboard.temperatureMaxTime,
      temperatureMin: dashboard.temperatureMin,
      temperatureMinTime: dashboard.temperatureMinTime,
      moonPhase: dashboard.moonPhase,
      windGustTime: dashboard.windGustTime
    } = obj.daily.data[0]);

    dashboard.sunriseTime = new Date(dashboard.sunriseTime).toString().substr(16, 5);
    dashboard.sunsetTime = new Date(dashboard.sunsetTime).toString().substr(16, 5);
    dashboard.temperatureMaxTime = new Date(dashboard.temperatureMaxTime).toString().substr(16, 5);
    dashboard.temperatureMinTime = new Date(dashboard.temperatureMinTime).toString().substr(16, 5);
    dashboard.time = new Date(dashboard.time).toString().substr(16, 5);
    dashboard.windGustTime = new Date(dashboard.windGustTime).toString().substr(16, 5);

    this.utilities.mapProperties(dashboard.dashboardCharts.yaxis, obj.hourly.data);
  },
  fetchWeeklyData: function(obj) {
    const { weekly } = this.data.weatherCheckObj;
    obj.daily.data.map((e, i) => {
      if (i === 0) {
        return;
      }
      const {
        apparentTemperatureHigh,
        apparentTemperatureLow,
        visibility,
        pressure,
        humidity,
        cloudCover,
        dewPoint,
        moonPhase,
        ozone,
        sunriseTime,
        sunsetTime,
        temperatureMax,
        temperatureMin,
        icon,
        summary,
        time
      } = e;

      weekly.weeklyData.push({
        day: new Date(time).toDateString().substr(0, 3),
        date: `${new Date(time).toDateString().substr(8, 2)}/${new Date(time).toISOString().substr(5, 2)}`,
        // time: time,
        apparentTemperatureHigh,
        apparentTemperatureLow,
        visibility,
        pressure,
        humidity,
        cloudCover,
        dewPoint,
        moonPhase,
        ozone,
        sunriseTime: new Date(sunriseTime).toString().substr(16, 5),
        sunsetTime: new Date(sunsetTime).toString().substr(16, 5),
        temperatureMax,
        temperatureMin,
        icon,
        summary
      });
      weekly.weeklyCharts.xaxis.push(new Date(time).toDateString().substr(0, 3));
      // [
      //   "temperatureMaxTime",
      //   "temperatureMinTime",
      //   "windGustTime",
      //   "windBearing",
      //   "uvIndex",
      //   "humidity",
      //   "precipProbability"
      // ].map((en, ind) => {
      //   if (en.toLowerCase().indexOf("time") !== -1) {
      //     // return weekly.weeklyCharts.yaxis[en].push(e[en].substr(11, 5));
      //     e[en] = e[en].substr(11, 5);
      //   }
      //   weekly.weeklyCharts.yaxis[en].push(e[en]);
      // });
    });
    this.utilities.mapProperties(weekly.weeklyCharts.yaxis, obj.daily.data);
  },
  fetchChartData: function(obj) {
    const { charts } = this.data.weatherCheckObj;
    this.utilities.mapProperties(charts.yaxis, obj.hourly.data);
    charts.xaxis = obj.hourly.data.map((entry, index) => {
      return new Date(entry.time).toISOString().substr(11, 5);
      // return new Date(entry.time)
      //   .toISOString()
      //   .split(" ")[0]
      //   .slice(0, -3);
    });
  },
  loadDashboardData: function(dashboard) {
    console.log(dashboard);
    const current = document.querySelectorAll(".summary .card-details .value");
    const uvIndex = document.querySelector(".uv-index .card-details .description");
    const wind = document.querySelectorAll(".wind .card-details .value");
    const params = document.querySelectorAll(".other-params .value");
    document.querySelector(".summary .card-header-block .title").textContent = dashboard.summary;
    document.querySelector(".summary .card-header-block .value").childNodes[0].textContent = dashboard.temperature;
    current[0].childNodes[0].textContent = dashboard.feelslike;
    current[1].childNodes[0].textContent = dashboard.sunriseTime;
    current[2].childNodes[0].textContent = dashboard.temperatureMax;
    current[3].childNodes[0].textContent = dashboard.temperatureMin;
    current[4].childNodes[0].textContent = dashboard.moonPhase;
    current[5].childNodes[0].textContent = dashboard.sunsetTime;
    current[6].childNodes[0].textContent = dashboard.temperatureMaxTime;
    current[7].childNodes[0].textContent = dashboard.temperatureMinTime;
    document.querySelector(".uv-index .value").textContent = dashboard.uvIndex;
    if (dashboard.uvIndex <= 2) {
      uvIndex.textContent = "LOW";
      uvIndex.style.color = "#289500";
      uvIndex.nextElementSibling.textContent =
        "No protection needed. You can safely stay outside using minimal sun protection.";
    } else if (dashboard.uvIndex > 2 && dashboard.uvIndex <= 7) {
      uvIndex.textContent = "HIGH";
      uvIndex.style.color = "#f95901";
      uvIndex.nextElementSibling.textContent =
        "Protection needed. Seek shade during late morning through mid-afternoon.When outside, wear sunglasses.";
    } else if (dashboard.uvIndex > 7) {
      uvIndex.textContent = "VERY HIGH";
      uvIndex.style.color = "#d90011";
      uvIndex.nextElementSibling.textContent =
        "Extra protection needed. Be careful outside, especially during late morning through mid-afternoon.";
    }
    wind[0].textContent = dashboard.windSpeed;
    wind[1].textContent = dashboard.windGust;
    wind[2].textContent = dashboard.windBearing;
    wind[3].textContent = dashboard.windGustTime;
    wind[4].textContent = dashboard.dewPoint;
    wind[5].textContent = dashboard.humidity;
    wind[6].textContent = dashboard.precipProbability;
    wind[7].textContent = dashboard.precipIntensity;
    params[0].textContent = dashboard.pressure;
    params[1].textContent = dashboard.visibility;
    params[2].textContent = (parseFloat(dashboard.cloudCover) * 100).toFixed();
    params[3].textContent = dashboard.ozone;
    this.loadDashboardCharts(dashboard.dashboardCharts, app.data.svgStuff, app.data.bearingIcons);
  },
  loadWeeklyData: function(weekly) {
    const weeklyCard = document.querySelectorAll("#weekly-accordion .card");
    const weeklyEntry = weekly.weeklyData;
    console.log(weeklyEntry);
    weeklyCard.forEach((e, i) => {
      e.querySelector(".daily-card-header .title").textContent = weeklyEntry[i].day;
      e.querySelector(".daily-card-header .date").textContent = weeklyEntry[i].date;
      e.querySelector(".daily-card-details .degree").firstChild.textContent = (
        (parseInt(weeklyEntry[i].temperatureMax) + parseInt(weeklyEntry[i].temperatureMin)) /
        2
      ).toFixed();
      e.querySelectorAll(".values .value")[0].textContent = (
        (parseInt(weeklyEntry[i].apparentTemperatureHigh) + parseInt(weeklyEntry[i].apparentTemperatureLow)) /
        2
      ).toFixed();
      e.querySelectorAll(".values .value")[1].textContent = weeklyEntry[i].sunriseTime;
      e.querySelectorAll(".values .value")[2].textContent =
        (parseFloat(weeklyEntry[i].moonPhase) * 100).toFixed() + "%";
      e.querySelectorAll(".values .value")[3].textContent = weeklyEntry[i].sunsetTime;
      e.querySelector(".card-body-title").textContent = weeklyEntry[i].summary;
      e.querySelectorAll(".card-body-values .value")[0].textContent = weeklyEntry[i].visibility;
      e.querySelectorAll(".card-body-values .value")[1].textContent =
        (parseFloat(weeklyEntry[i].humidity) * 100).toFixed() + "%";
      e.querySelectorAll(".card-body-values .value")[2].textContent = weeklyEntry[i].pressure;
      e.querySelectorAll(".card-body-values .value")[3].textContent =
        (parseFloat(weeklyEntry[i].cloudCover) * 100).toFixed() + "%";
      e.querySelectorAll(".card-body-values .value")[4].textContent = weeklyEntry[i].ozone;
      e.querySelectorAll(".card-body-values .value")[5].textContent = weeklyEntry[i].dewPoint;
    });
    this.loadWeeklyCharts(weekly.weeklyCharts, this.data.weeklyBearing);
  },
  loadDashboardCharts: function(charts, svgIcons, bearingIcons) {
    var ctx = document.getElementById("Chart1").getContext("2d");
    var ctx2 = document.getElementById("Chart2").getContext("2d");
    const maxTemp = Math.max(...charts.yaxis.temperature);
    const maxWind = Math.max(...charts.yaxis.windSpeed);
    var myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "Temperature",
            data: charts.yaxis.temperature.map(e => parseInt(e)),
            backgroundColor: "#21cbff",
            borderColor: "",
            borderWidth: 0
          },
          {
            label: "Icons",
            data: charts.yaxis.temperature.map(e => {
              return parseInt(e) + maxTemp * 0.1;
            }),
            pointStyle: svgIcons,
            type: "line",
            backgroundColor: "#21cbff",
            fill: false,
            showLine: false
          }
        ]
      },

      options: {
        title: {
          display: "true",
          text: "Temperature"
        },
        legend: {
          display: false
        },
        layout: {},
        scales: {
          yAxes: [
            {
              gridLines: {
                // display: true,
                drawOnChartArea: true,
                color: "#2f3f4e",
                drawBorder: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data, index) {
              if (tooltipItem.datasetIndex === 0) {
                return data.datasets[0].data[tooltipItem.index];
              } else if (tooltipItem.datasetIndex === 1) {
                return charts.yaxis.summary[tooltipItem.index];
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          ease: "linear"
        },
        onResize: function(chart) {}
      }
    });
    var myChart2 = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "Wind",
            data: charts.yaxis.windSpeed.map(e => parseInt(e)),
            backgroundColor: "#21cbff",
            borderColor: "#21cbff",
            borderWidth: 1,
            fill: false
          },
          {
            label: "Icons",
            data: charts.yaxis.windSpeed.map(e => {
              return parseInt(e) + maxWind * 0.1;
            }),
            pointStyle: bearingIcons,
            type: "line",
            backgroundColor: "#21cbff",
            fill: false,
            showLine: false
          }
        ]
      },

      options: {
        title: {
          display: "true",
          text: "Wind"
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              if (tooltipItem.datasetIndex === 0) {
                return data.datasets[0].data[tooltipItem.index];
              } else if (tooltipItem.datasetIndex === 1) {
                return "Bearing: " + charts.yaxis.windBearing[tooltipItem.index];
              }
            }
          }
        },
        legend: {
          display: false
        },
        layout: {},
        scales: {
          yAxes: [
            {
              gridLines: {
                display: true,
                drawOnChartArea: true,
                color: "#2f3f4e",
                drawBorder: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ]
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          ease: "linear"
        }
      }
    });
  },
  loadWeeklyCharts: function(charts, weeklyBearing) {
    const ctx9 = document.getElementById("Chart9").getContext("2d");
    const ctx10 = document.getElementById("Chart10").getContext("2d");
    const ctx12 = document.getElementById("Chart12").getContext("2d");
    const ctx13 = document.getElementById("Chart13").getContext("2d");
    const maxWind = Math.max(...charts.yaxis.windSpeed);
    const myChart9 = new Chart(ctx9, {
      type: "bar",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "Maximum Temperature",
            data: charts.yaxis.temperatureMax.map(e => parseInt(e)),
            backgroundColor: "#fff",
            borderColor: "#21cbff",
            borderWidth: 2,
            fill: "false"
          },
          {
            label: "Minimum Temperature",
            data: charts.yaxis.temperatureMin.map(e => parseInt(e)),
            backgroundColor: "#fff",
            borderColor: "#21cbff",
            borderWidth: 2,
            fill: "false"
          }
        ]
      },

      options: {
        title: {
          display: "true",
          text: "Temperature"
        },
        legend: {
          display: false
        },
        layout: {},
        scales: {
          yAxes: [
            {
              gridLines: {
                // display: true,
                drawOnChartArea: true,
                color: "#2f3f4e",
                drawBorder: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data, index) {
              if (tooltipItem.datasetIndex === 0) {
                return (
                  "Temperature Max: " +
                  data.datasets[0].data[tooltipItem.index] +
                  " @ " +
                  charts.yaxis.temperatureMaxTime[tooltipItem.index]
                );
              } else if (tooltipItem.datasetIndex === 1) {
                return (
                  "Temperature Min: " +
                  data.datasets[1].data[tooltipItem.index] +
                  " @ " +
                  charts.yaxis.temperatureMinTime[tooltipItem.index]
                );
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          ease: "linear"
        },
        onResize: function(chart) {}
      }
    });
    const myChart10 = new Chart(ctx10, {
      type: "line",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "UV Index",
            data: charts.yaxis.uvIndex.map(e => parseInt(e)),
            backgroundColor: "#fff",
            borderColor: "#21cbff",
            borderWidth: 2,
            fill: "false"
          }
        ]
      },

      options: {
        title: {
          display: "true",
          text: "UV Index"
        },
        legend: {
          display: false
        },
        layout: {},
        scales: {
          yAxes: [
            {
              gridLines: {
                // display: true,
                drawOnChartArea: true,
                color: "#2f3f4e",
                drawBorder: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data, index) {
              if (tooltipItem.datasetIndex === 0) {
                return (
                  "UV Index: " +
                  data.datasets[0].data[tooltipItem.index] +
                  " @ " +
                  charts.yaxis.uvIndexTime[tooltipItem.index]
                );
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          ease: "linear"
        },
        onResize: function(chart) {}
      }
    });

    var myChart12 = new Chart(ctx12, {
      type: "bar",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "Wind",
            data: charts.yaxis.windSpeed.map(e => parseInt(e)),
            backgroundColor: "#21cbff",
            borderColor: "#21cbff",
            borderWidth: 1,
            fill: false
          },
          {
            label: "Icons",
            data: charts.yaxis.windSpeed.map(e => {
              return parseInt(e) + maxWind * 0.1;
            }),
            pointStyle: weeklyBearing,
            type: "line",
            backgroundColor: "#21cbff",
            fill: false,
            showLine: false
          }
        ]
      },

      options: {
        title: {
          display: "true",
          text: "Wind"
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              if (tooltipItem.datasetIndex === 0) {
                return data.datasets[0].data[tooltipItem.index];
              } else if (tooltipItem.datasetIndex === 1) {
                return "Bearing: " + charts.yaxis.windBearing[tooltipItem.index];
              }
            }
          }
        },
        legend: {
          display: false
        },
        layout: {},
        scales: {
          yAxes: [
            {
              gridLines: {
                display: true,
                drawOnChartArea: true,
                color: "#2f3f4e",
                drawBorder: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ]
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          ease: "linear"
        }
      }
    });
    var myChart13 = new Chart(ctx13, {
      type: "line",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "Precipitation Probability",
            data: charts.yaxis.precipProbability.map(e => parseFloat(e) * 100),
            backgroundColor: "#fff",
            borderColor: "#21cbff",
            borderWidth: 2,
            fill: false
          },
          {
            label: "Precipitation Intensity",
            data: charts.yaxis.precipIntensity.map(e => {
              return parseFloat(e);
            }),
            pointRadius: 0,
            hoverRadius: 0,
            type: "line",
            backgroundColor: "#21cbff",
            fill: false,
            showLine: false
          }
        ]
      },

      options: {
        title: {
          display: "true",
          text: "Precipitation"
        },
        legend: {
          display: false
        },
        layout: {},
        scales: {
          yAxes: [
            {
              gridLines: {
                // display: true,
                drawOnChartArea: true,
                color: "#2f3f4e",
                drawBorder: false
              },
              ticks: {
                beginAtZero: true,
                steps: 10,
                stepValue: 5,
                max: 100,
                fontSize: 10
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              if (tooltipItem.datasetIndex === 0) {
                return [
                  "Probability: " +
                    data.datasets[0].data[tooltipItem.index].toFixed() +
                    `${data.datasets[0].data[tooltipItem.index] > 0 ? "%" : ""}`
                ];
              } else if (tooltipItem.datasetIndex === 1) {
                return data.datasets[0].data[tooltipItem.index] === 0
                  ? ""
                  : data.datasets[0].data[tooltipItem.index] > 0 && data.datasets[1].data[tooltipItem.index] === 0
                  ? "Intensity: Nigligible"
                  : "Intensity" + data.datasets[1].data[tooltipItem.index];
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          ease: "linear"
        },
        onResize: function(chart) {}
      }
    });
  },
  loadCharts: function(charts) {
    const ctx3 = document.getElementById("Chart3").getContext("2d");
    const ctx4 = document.getElementById("Chart4").getContext("2d");
    const ctx5 = document.getElementById("Chart5").getContext("2d");
    const ctx6 = document.getElementById("Chart6").getContext("2d");
    const ctx7 = document.getElementById("Chart7").getContext("2d");
    const ctx8 = document.getElementById("Chart8").getContext("2d");
    const myChart3 = new Chart(ctx3, {
      type: "line",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "UV Index",
            data: charts.yaxis.uvIndex.map(e => parseInt(e)),
            backgroundColor: "#fff",
            borderColor: "#21cbff",
            borderWidth: 2,
            fill: "false"
          }
        ]
      },

      options: {
        title: {
          display: "true",
          text: "UV Index"
        },
        legend: {
          display: false
        },
        layout: {},
        scales: {
          yAxes: [
            {
              gridLines: {
                // display: true,
                drawOnChartArea: true,
                color: "#2f3f4e",
                drawBorder: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data, index) {
              if (tooltipItem.datasetIndex === 0) {
                return "UV Index: " + data.datasets[0].data[tooltipItem.index];
              } else if (tooltipItem.datasetIndex === 1) {
                return charts.yaxis.summary[tooltipItem.index];
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          ease: "linear"
        },
        onResize: function(chart) {}
      }
    });
    const myChart4 = new Chart(ctx4, {
      type: "line",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "Humidity",
            data: charts.yaxis.humidity.map(e => (e * 100).toFixed()),
            backgroundColor: "#fff",
            borderColor: "#21cbff",
            borderWidth: 2,
            fill: false
          }
        ]
      },

      options: {
        title: {
          display: "true",
          text: "Humidity"
        },
        legend: {
          display: false
        },
        layout: {},
        scales: {
          yAxes: [
            {
              gridLines: {
                // display: true,
                drawOnChartArea: true,
                color: "#2f3f4e",
                drawBorder: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data, index) {
              if (tooltipItem.datasetIndex === 0) {
                return "Humidity: " + data.datasets[0].data[tooltipItem.index] + "%";
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          ease: "linear"
        },
        onResize: function(chart) {}
      }
    });
    const myChart5 = new Chart(ctx5, {
      type: "line",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "Ozone",
            data: charts.yaxis.ozone.map(e => parseInt(e)),
            backgroundColor: "#fff",
            borderColor: "#21cbff",
            borderWidth: 2,
            pointStyle: "circle",
            fill: false
          }
        ]
      },

      options: {
        title: {
          display: "true",
          text: "Ozone"
        },
        legend: {
          display: false
        },
        layout: {},
        scales: {
          yAxes: [
            {
              gridLines: {
                display: true,
                drawOnChartArea: true,
                color: "#2f3f4e",
                drawBorder: false
              },
              ticks: {
                beginAtZero: true,
                callback: function(value) {
                  if (value % 1 === 0) {
                    return value;
                  }
                },
                fontSize: 10
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data, index) {
              if (tooltipItem.datasetIndex === 0) {
                return "Ozone: " + data.datasets[0].data[tooltipItem.index];
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          ease: "linear"
        },
        onResize: function(chart) {}
      }
    });

    var myChart6 = new Chart(ctx6, {
      type: "line",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "Precipitation Probability",
            data: charts.yaxis.precipProbability.map(e => parseFloat(e) * 100),
            backgroundColor: "#fff",
            borderColor: "#21cbff",
            borderWidth: 2,
            fill: false
          },
          {
            label: "Precipitation Intensity",
            data: charts.yaxis.precipIntensity.map(e => {
              return parseFloat(e);
            }),
            pointRadius: 0,
            hoverRadius: 0,
            type: "line",
            backgroundColor: "#21cbff",
            fill: false,
            showLine: false
          }
        ]
      },

      options: {
        title: {
          display: "true",
          text: "Precipitation"
        },
        legend: {
          display: false
        },
        layout: {},
        scales: {
          yAxes: [
            {
              gridLines: {
                // display: true,
                drawOnChartArea: true,
                color: "#2f3f4e",
                drawBorder: false
              },
              ticks: {
                beginAtZero: true,
                steps: 10,
                stepValue: 5,
                max: 100,
                fontSize: 10
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              if (tooltipItem.datasetIndex === 0) {
                return [
                  "Probability: " +
                    data.datasets[0].data[tooltipItem.index] +
                    `${data.datasets[0].data[tooltipItem.index] > 0 ? "%" : ""}`
                ];
              } else if (tooltipItem.datasetIndex === 1) {
                return data.datasets[0].data[tooltipItem.index] === 0
                  ? ""
                  : data.datasets[0].data[tooltipItem.index] > 0 && data.datasets[1].data[tooltipItem.index] === 0
                  ? "Intensity: Nigligible"
                  : "Intensity" + data.datasets[1].data[tooltipItem.index];
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          ease: "linear"
        },
        onResize: function(chart) {}
      }
    });
    const myChart7 = new Chart(ctx7, {
      type: "line",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "Visibility",
            data: charts.yaxis.visibility.map(e => parseInt(e)),
            backgroundColor: "#fff",
            borderColor: "#21cbff",
            borderWidth: 2,
            fill: false
          }
        ]
      },

      options: {
        title: {
          display: "true",
          text: "Visibility"
        },
        legend: {
          display: false
        },
        layout: {},
        scales: {
          yAxes: [
            {
              gridLines: {
                // display: true,
                drawOnChartArea: true,
                color: "#2f3f4e",
                drawBorder: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data, index) {
              return "Visibility: " + data.datasets[0].data[tooltipItem.index];
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          ease: "linear"
        },
        onResize: function(chart) {}
      }
    });

    const myChart8 = new Chart(ctx8, {
      type: "line",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "Dewpoint",
            data: charts.yaxis.dewPoint.map(e => parseInt(e)),
            backgroundColor: "#fff",
            borderColor: "#21cbff",
            borderWidth: 2,
            pointStyle: "circle",
            fill: false
          }
        ]
      },

      options: {
        title: {
          display: "true",
          text: "Dewpoint"
        },
        legend: {
          display: false
        },
        layout: {},
        scales: {
          yAxes: [
            {
              gridLines: {
                display: true,
                drawOnChartArea: true,
                color: "#2f3f4e",
                drawBorder: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ],
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                beginAtZero: true,
                fontSize: 10
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              if (tooltipItem.datasetIndex === 0) {
                return "Dewpoint: " + data.datasets[0].data[tooltipItem.index];
              }
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          ease: "linear"
        },
        onResize: function(chart) {}
      }
    });
  }
};
app.data = {
  filtered: {},
  svgStuff: [],
  bearingIcons: [],
  weeklyBearing: [],
  weatherCheckObj: {}
};
app.geocoder = {
  variables: {
    selectedLocation: "",
    geocodedList: [{ text: "My Location" }],
    geocoded: {}
  },
  init: function() {
    this.variables.selectedLocation = this.variables.geocodedList[0].text;
    this.displayGeocodedList();
    $("#location select").on("loaded.bs.select", this.onLoad.bind(this));
    $("#location select").on("changed.bs.select", this.onChange.bind(this));
    document.querySelector(".bs-searchbox input").addEventListener("keyup", this.onKeyUp.bind(this));
  },
  displayGeocodedList: function() {
    this.variables.geocodedList.map((e, i) => {
      const option = document.createElement("OPTION");
      option.textContent = e.text.replace(/\s+/g, " ");
      if (i === 0) {
        option.setAttribute("data-icon", "fa fa-map-marker");
      }
      document.querySelector("#location .selectpicker").appendChild(option);
    });
    $("#location .selectpicker").selectpicker("refresh");
  },
  onLoad: function(e) {
    document.querySelectorAll("#location .selectpicker option").forEach((e, i) => {
      e.remove();
    });
  },
  onChange: function(event, clickedIndex, isSelected, previousValue) {
    const _this = this;
    if (!isSelected) return;

    if (
      this.variables.geocodedList.filter(function(e, i) {
        return _this.variables.geocoded.features[clickedIndex].text === e.text;
      }).length > 0 &&
      document.querySelector(".bs-searchbox input").value.trim() !== ""
    ) {
      _this.variables.geocodedList = _this.variables.geocodedList.filter(function(e, i) {
        return e.text !== _this.variables.geocoded.features[clickedIndex].text;
      });
    }

    // console.log($(this)[0].value);
    // console.log($("#location .selectpicker").val());
    // console.log(clickedIndex, isSelected, previousValue);
    // console.log(geocoded[clickedIndex - 1].place_name);
    if (document.querySelector(".bs-searchbox input").value.trim() === "") {
      this.variables.selectedLocation = this.variables.geocodedList[clickedIndex].text;
      $("#location .selectpicker").selectpicker(
        "val",
        document.querySelectorAll("#location option")[clickedIndex].innerHTML
      );
      $("#location .selectpicker").selectpicker("refresh");
      app.variables.myLocation = this.variables.geocodedList[clickedIndex].text;
      app.variables.mapCenter = this.variables.geocodedList[clickedIndex].center;
      app.utilities.pageLoader(app.variables.section);
      app.init({
        lon: app.variables.mapCenter[0],
        lat: app.variables.mapCenter[1]
      });
      document.querySelector(".app").classList.remove("rightsidebar-open");
      document.querySelector("#overlay").classList.remove("overlay");
      // app.init();

      return;
    }

    // console.log(
    //   this.variables.geocodedList
    //     .filter((e, i) => {
    //       return e.text === this.variables.geocoded.features[clickedIndex].text;
    //     })
    //     .length()
    // );
    this.variables.geocodedList = [
      ...this.variables.geocodedList.slice(0, 1),
      this.variables.geocoded.features[clickedIndex],
      ...this.variables.geocodedList.slice(1)
    ];
    document.querySelectorAll("#location .selectpicker option").forEach((e, i) => {
      e.remove();
    });
    document.querySelector("#location input").value = "";
    this.displayGeocodedList();
    this.variables.selectedLocation = this.variables.geocodedList[1].text.replace(/\s+/g, " ");
    document.querySelector(".page-loader").style.display = "block";
    $("#location .selectpicker").selectpicker("val", this.variables.selectedLocation);
    $("#location .selectpicker").selectpicker("refresh");
    app.variables.myLocation = this.variables.geocodedList[1].text;
    app.variables.mapCenter = this.variables.geocodedList[1].center;

    app.utilities.pageLoader(app.variables.section);
    app.init({
      lon: app.variables.mapCenter[0],
      lat: app.variables.mapCenter[1]
    });
    document.querySelector(".app").classList.remove("rightsidebar-open");
    document.querySelector("#overlay").classList.remove("overlay");
    // document.querySelector(".page-loader").style.display = "none";
    // app.init();
  },
  onKeyUp: function(e) {
    if ([37, 38, 39, 40, 91, 13, 16, 17].indexOf(e.keyCode) !== -1) return;
    document.querySelectorAll("#location .selectpicker option").forEach((e, i) => {
      e.remove();
    });
    $("#location .selectpicker").selectpicker("refresh");
    if (e.target.value.trim() === "") {
      this.displayGeocodedList();
      $("#location .selectpicker").selectpicker("val", this.variables.selectedLocation);
      $("#location .selectpicker").selectpicker("refresh");
      return;
    }
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${e.target.value}.json?access_token=${app.apiKeys.mapBoxKey}&cachebuster=1574026833566&autocomplete=true&types=country%2Cregion%2Cdistrict%2Cpostcode%2Clocality%2Cplace%2Cneighborhood%2Caddress%2Cpoi`
    )
      .then(res => {
        res
          .json()
          .then(res => {
            this.variables.geocoded = Object.assign({}, res);
            this.variables.geocoded.features.map((e, i) => {
              const option = document.createElement("OPTION");
              option.text = e.place_name;
              document.querySelector("#location .selectpicker").appendChild(option);
            });
            $("#location .selectpicker").selectpicker("val", "");
            $("#location .selectpicker").selectpicker("refresh");
          })
          .catch(e => console.log(e));
      })
      .catch(e => console.log(e));
  }
};
app.settings = {
  variables: {
    selectToUserUnits: {
      "°C": "celsius",
      "°F": "fahrenheit",
      Knots: "knots",
      "m/s": "meterspersecond",
      mph: "milesperhour",
      Kilometers: "kilometers",
      Miles: "miles",
      "mm/h": "mmph",
      inph: "inph",
      hPa: "hPa",
      millibar: "millibar",
      Torr: "torr"
    },
    userUnits: ["celsius", "knots", "kilometers", "mmph", "hPa"]
  },
  init: function() {
    $("#units select").on("change", this.onChange.bind(this));
  },
  onChange: function(e) {
    const inputUnitsArray = [...document.querySelectorAll("#units select")].map(
      e => this.variables.selectToUserUnits[e.value]
    );
    if (
      this.variables.userUnits.every((e, i) => {
        return e === inputUnitsArray[i];
      })
    ) {
      document.getElementById("updateButton").disabled = true;
    } else {
      document.getElementById("updateButton").disabled = false;
      document.getElementById("updateButton").addEventListener(
        "click",
        function(e) {
          document.querySelector(".page-loader").style.display = "block";
          this.variables.userUnits = inputUnitsArray;
          document.getElementById("updateButton").disabled = true;
          document.querySelector(".app").classList.remove("rightsidebar-open");
          document.querySelector("#overlay").classList.remove("overlay");
          app.data.filtered = app.utilities.filterUnits(JSON.parse(JSON.stringify(app.data.weatherCheckObj)));
          app.utilities.pageLoader(app.variables.section);
          document.querySelector(".page-loader").style.display = "none";
        }.bind(this)
      );
    }
  }
};
app.charts = {
  variables: {
    chartGlobals: {
      global: {
        defaultFontColor: "#899397",
        defaultFontFamily: "Roboto",
        title: {
          display: true
        },
        legend: {
          display: false
        },
        layout: {
          padding: {
            left: 0,
            right: 10,
            top: -10,
            bottom: 10
          }
        },
        tooltips: {
          enabled: true,
          mode: "index",
          intersect: "true",
          position: "average",
          backgroundColor: "#455a64",
          titleFontFamily: "Roboto",
          titleFontSize: 16,
          titleMarginBottom: 10,
          bodyFontFamily: "Roboto",
          bodyFontSize: 12,
          bodySpacing: 8,
          xPadding: 10,
          yPadding: 10,
          caretPadding: 5,
          caretSize: 10,
          cornerRadius: 5,
          displayColors: false
        }
      },
      scale: {
        display: true
      }
    }
  },
  init: function() {
    app.utilities.getSetKeys(this.variables.chartGlobals, Chart.defaults);
    this.register();
  },
  register: function() {
    Chart.pluginService.register({
      afterInit: function(Chart) {
        if (Chart.chart.canvas.id === "Chart1") {
          app.data.filtered.dashboard.dashboardCharts.yaxis.icon.map((e, i) => {
            app.utilities.getWeatherIcon(e, new Image(20, 20)).then(res => {
              // Chart.config.data.datasets[1]._meta[Chart.chart.id].data[i]._model.pointStyle = svgStuff[i];
              Chart.config.data.datasets[1]._meta[Chart.chart.id].data[i]._model.pointStyle = res;
            });
          });
        } else if (Chart.chart.canvas.id === "Chart2") {
          app.data.filtered.dashboard.dashboardCharts.yaxis.windBearing.map((e, i) => {
            app.utilities.getWeatherIcon(undefined, new Image(20, 20), e, app.data.bearingIcons).then(res => {
              Chart.config.data.datasets[1]._meta[Chart.chart.id].data[i]._model.pointStyle = res;
            });
          });
        } else if (Chart.chart.canvas.id === "Chart12") {
          app.data.filtered.weekly.weeklyCharts.yaxis.windBearing.map((e, i) => {
            app.utilities.getWeatherIcon(undefined, new Image(25, 25), e, app.data.weeklyBearing).then(res => {
              Chart.config.data.datasets[1]._meta[Chart.chart.id].data[i]._model.pointStyle = res;
            });
          });
        }

        // if (Chart.config.data.datasets[1]) {
        //   var meta = Object.keys(Chart.config.data.datasets[1]._meta)[0];
        // } else {
        //   var meta = Object.keys(Chart.config.data.datasets[0]._meta)[0];
        // }

        // if (Chart.options.optionOne) {
        //   Chart.config.data.datasets[1]._meta[meta].data[0]._model.pointStyle = sun;
        //   Chart.config.data.datasets[1]._meta[meta].data[1]._model.pointStyle = moon;
        // }
        // if (Chart.options.optionTwo) {
        //   Chart.config.data.datasets[1]._meta[meta].data[0]._model.pointStyle = moon;
        //   Chart.config.data.datasets[1]._meta[meta].data[1]._model.pointStyle = moon;
        // }
      }
    });
  }
};
app.utilities = {
  variables: {
    conditionToIcon: {
      "clear-day": "sun-1",
      "clear-night": "moon-sea",
      rain: "rain-1",
      snow: "snowflake",
      sleet: "drizzle",
      wind: "wind",
      fog: "fog-2",
      cloudy: "mostly-cloudy-2",
      "partly-cloudy-day": "partly-cloudy-1",
      "partly-cloudy-night": "partly-cloudy-2"
    }
  },
  getSetKeys: function getSetKeys(src, dest, address) {
    var keys = Object.keys(src);
    address = address ? address : [];
    return keys.reduce(function(result, key) {
      if (typeof src[key] === "object") {
        result = result.concat(getSetKeys(src[key], dest[key], address.concat(key)));
      } else {
        dest[key] = src[key];
      }
      return result;
    }, []);
  },
  getWeatherIcon: function(icon, iconImage, windBearing, target) {
    const useIcon = icon ? this.variables.conditionToIcon[icon] : "compass-n";
    let useArray = windBearing ? target : app.data.svgStuff;
    const bearing = windBearing ? windBearing : 0;
    return new Promise((resolve, reject) => {
      fetch(`./pe-icon-set-weather/svg/${useIcon}.svg`)
        .then(res => {
          res.text().then(text => {
            const el = new DOMParser().parseFromString(text, "image/svg+xml");
            var iconSVG = el.documentElement;
            iconSVG.getElementsByTagName(
              "style"
            )[0].innerHTML = `.st0{fill:#00bcd4;transform-origin:50% 50% ;transform: translateY(0px) rotate(${bearing}deg)}`;
            var svgString = new XMLSerializer().serializeToString(iconSVG);
            var encodedSvg = window.btoa(svgString);
            iconImage.src = "data:image/svg+xml;base64," + encodedSvg;
            useArray.push(iconImage);
            resolve(iconImage);
          });
        })
        .catch(e => console.log(e));
    });
  },
  mapProperties: function(dest, src) {
    Object.keys(dest).map(item => {
      if (typeof src[0][item] !== "object") {
        return src.map((e, i) => {
          if (item.toLowerCase().indexOf("time") > -1) {
            e[item] = e[item].toString().substr(11, 5);
          }
          dest[item].push(e[item]);
        });
      }
      Object.keys(src[0][item]).map((e, i) => {
        const data = src.reduce((acc, key, i) => {
          return acc.concat(key[item][e]);
        }, []);
        dest[item][e] = data;
      });
    });
  },
  filterUnits: function filterUnits(obj, parent, key) {
    Object.keys(obj).map((e, i) => {
      if (app.settings.variables.userUnits.indexOf(e) !== -1) {
        parent[key] = obj[e];
      } else if (typeof obj[e] === "object") {
        filterUnits(obj[e], obj, e);
      }
    });
    return obj;
  },
  pageLoader: function(selector) {
    switch (selector) {
      case "dashboard":
        fetch("content/dashboard.html")
          .then(res => {
            res.text().then(res => {
              // map.remove();
              app.ui.variables.content.innerHTML = res;
              // console.dir(L);
              app.loadDashboardData(app.data.filtered.dashboard);
              map = new mapboxgl.Map({
                container: "map", // container id
                style: "mapbox://styles/mapbox/streets-v11", // stylesheet location
                center: app.variables.mapCenter, // starting position [lng, lat]
                zoom: 9, // starting zoom
                interactive: false
              });
            });
          })
          .catch(e => console.log(e));
        break;
      case "charts":
        fetch("content/charts.html")
          .then(res => {
            res.text().then(res => {
              app.ui.variables.content.innerHTML = res;
              app.loadCharts(app.data.filtered.charts);
            });
          })
          .catch(e => console.log(e));
        break;
      case "weekly":
        fetch("content/weekly.html")
          .then(res => {
            res.text().then(res => {
              app.ui.variables.content.innerHTML = res;
              $(app.variables.selectedPanel).collapse("show");
              $('[data-toggle="collapse"]').on("click", function(e) {
                app.variables.selectedPanel = this.dataset.target;
                if (
                  $(this)
                    .parents(".accordion")
                    .find(".collapse.show")
                ) {
                  var idx = $(this).index('[data-toggle="collapse"]');
                  if (idx == $(".collapse.show").index(".collapse")) {
                    e.stopPropagation();
                  }
                }
              });
              app.loadWeeklyData(app.data.filtered.weekly);
            });
          })
          .catch(e => console.log(e));
        break;
      case "windymap":
        fetch("content/windymap.html")
          .then(res => {
            res.text().then(res => {
              app.ui.variables.content.innerHTML = res;
              app.windyMap.init();
            });
          })
          .catch(e => console.log(e));
        break;
      default:
        return;
    }
    // document.querySelector(".page-loader").style.display = "none";
  }
};
app.ui = {
  variables: {
    leftSideBar: document.querySelector(".sidebar-toggle"),
    rightSideBar: document.querySelector(".settings-toggle"),
    overlay: document.querySelector("#overlay"),
    content: document.querySelector(".main-content"),
    navItems: [...document.querySelectorAll(".left-sidebar_menu .navitem")],
    navLinks: [...document.querySelectorAll(".left-sidebar_menu li a")]
  },
  init: function() {
    this.variables.leftSideBar.addEventListener("click", this.lonClick.bind(this));
    this.variables.rightSideBar.addEventListener("click", this.ronClick.bind(this));
    this.variables.overlay.addEventListener("click", this.overlayClick.bind(this));
    this.variables.navLinks.map((e, i) => {
      e.addEventListener("click", this.handleNavigation.bind(this));
    });
  },
  handleNavigation: function(event) {
    event.preventDefault();
    document.querySelector(".page-loader").style.display = "block";
    this.variables.navItems.map((e, i) => e.classList.contains("active") && e.classList.remove("active"));
    event.target.closest(".navitem").classList.add("active");
    const hash = event.target.closest("a").hash.slice(1);
    app.variables.section = hash;
    app.utilities.pageLoader(app.variables.section);
    document.querySelector(".page-loader").style.display = "none";
  },
  lonClick: function(e) {
    e.preventDefault();
    app.domElements.app.classList.toggle("is-collapsed");
  },
  ronClick: function(e) {
    e.preventDefault();
    app.domElements.app.classList.toggle("rightsidebar-open");
    this.variables.overlay.classList.toggle("overlay");
  },
  overlayClick: function(e) {
    e.preventDefault();
    e.target.classList.remove("overlay");
    app.domElements.app.classList.remove("rightsidebar-open");
  }
};
app.windyMap = {
  variables: {
    options: {
      key: app.apiKeys.windyKey,
      verbose: false,
      lat: app.variables.mapCenter[1],
      lon: app.variables.mapCenter[0],
      zoom: 10
    }
  },
  init: function() {
    if (!window.copy_of_W) {
      window.copy_of_W = Object.assign({}, window.W);
    }
    if (window.W.windyBoot) {
      window.W = Object.assign({}, window.copy_of_W);
    }
    this.variables.options.lon = app.variables.mapCenter[0];
    this.variables.options.lat = app.variables.mapCenter[1];
    windyInit(this.variables.options, windyAPI => {
      const { map } = windyAPI;
    });
  }
};

$(function() {
  // if ("geolocation" in navigator) {
  //   navigator.geolocation.getCurrentPosition(showPosition, function(error) {
  //     // console.log("error");
  //     // console.log(error.code, error.message);
  //     fetch("http://ip-api.com/json/").then(res => {
  //       res.json().then(res => {
  //         ({ lat, lon } = res);
  //         console.log(lat);
  //       });
  //     });
  //   });
  // }

  // function showPosition(position) {
  //   ({ latitude: lat, longitude: lon } = position.coords);
  //   // lat = position.coords.latitude;
  //   // lon = position.coords.longitude;
  //   console.log(lat, lon);
  // }

  // document.querySelector("#location input").onfocus = function(e) {
  //   console.log("hi");
  //   document.querySelectorAll("#location .selectpicker option").forEach((e, i) => {
  //     e.remove();
  //   });
  //   displayGeocodedList();
  // };

  getCoordinates()
    .then(coords => {
      app.variables.mapCenter[0] = coords.lon;
      app.variables.mapCenter[1] = coords.lat;
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/%20${app.variables.mapCenter[0]}%2C${
          app.variables.mapCenter[1]
        }.json?access_token=${
          app.apiKeys.mapBoxKey
        }&cachebuster=1574859042163&autocomplete=true&types=country%2Cregion%2Cdistrict%2Clocality%2Cplace`
      )
        .then(res => {
          res.json().then(res => {
            app.geocoder.variables.geocodedList[0] = res.features[0];
            app.variables.myLocation = app.geocoder.variables.geocodedList[0].text;
            // app.geocoder.variables.geocodedList[0].text = "My Location";
            app.init(coords);
            app.settings.init();
            app.charts.init();
            app.ui.init();
            app.geocoder.init();
          });
        })
        .catch(e => console.log(e));
    })
    .catch(e => {
      app.variables.mapCenter[0] = 30;
      app.variables.mapCenter[1] = 27;
      app.init();
      app.settings.init();
      app.charts.init();
      app.ui.init();
      app.geocoder.init();
    });

  function getCoordinates() {
    let lat, lon;
    return new Promise(function(resolve, reject) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          ({ latitude: lat, longitude: lon } = pos.coords);
          // const data = { lat, lon };
          resolve({ lat, lon });
        },
        e => {
          if (e.code == 1 && navigator.onLine) {
            // console.log(e);
            return fetch("http://ip-api.com/json/")
              .then(res => {
                res
                  .json()
                  .then(res => {
                    ({ lat, lon } = res);
                    // const data = { lat, lon };
                    resolve({ lat, lon });
                  })
                  .catch(e => reject(e));
              })
              .catch(e => reject(e));
          }
          reject(e);
        }
      );
    });
  }

  // function getLocation() {
  //   return new Promise(async function(resolve, reject) {
  //     await getCoordinates()
  //       .then(pos => {
  //         ({ latitude: lat, longitude: lon } = pos.coords);
  //         const data = { lat, lon };
  //         resolve(data);
  //       })
  //       .catch(e => {
  //         if (e.code == 1) {
  //           return fetch("http://ip-api.com/json/")
  //             .then(res => {
  //               res
  //                 .json()
  //                 .then(res => {
  //                   ({ lat, lon } = res);
  //                   const data = { lat, lon };
  //                   resolve(data);
  //                 })
  //                 .catch(e => reject(e));
  //             })
  //             .catch(e => reject(e));
  //         }
  //         reject(e);
  //       });
  //   });
  // }

  // async function alternative() {
  //   const res = await getCoordinates();
  //   const options = {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json"
  //     },
  //     body: JSON.stringify(res)
  //   };
  //   fetch("/api", options);
  // }

  // alternative();

  // getCoordinates()
  //   .then(res => {
  //     const options = {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify(res)
  //     };
  //     fetch("/api", options).then(res =>
  //       res.json().then(res => console.log(res))
  //     );
  //   })
  //   .catch(e => console.log(e));

  function clientProcess(obj) {
    // for (let i = 1; i < 12; i++) {
    //   dashboard.dashboardCharts.yaxis["icons"].push(obj.hourly.data[i].icon);
    //   dashboard.dashboardCharts.yaxis["windBearing"].push(
    //     obj.hourly.data[i].windBearing
    //   );
    // }
    // obj.hourly.data.map((e, i) => {
    //   Object.keys(e.temperature).map((en, ind) => {
    //     const yaxistemp = obj.hourly.data
    //       .filter((entry, index) => {
    //         if (index > 0 && index < 13) {
    //           return entry;
    //         }
    //       })
    //       .reduce((acc, key, index) => {
    //         return acc.concat(key.temperature[en]);
    //       }, []);
    //     weatherCheckObj.dashboard.dashboardCharts.yaxis.temperature[
    //       en
    //     ] = yaxistemp;
    //   });
    // });
    // const testobj = {};
    // const testunit = "celsius";
    // ["temperature", "windSpeed"].map((e, i) => {
    //   if (obj.currently[e]) {
    //     console.log(obj.currently[e]);
    //     ({ [testunit]: testobj[testunit] } = obj.currently[e]);
    //   }
    //   console.log(testobj);
    // });
    // function filterUnits(obj) {
    //   Object.keys(obj).map((e, i) => {
    //     userUnits.map((en, ind) => {
    //       if (!obj[e].hasOwnProperty(en) && typeof obj[e] === "object") {
    //         filterUnits(obj[e]);
    //       } else if (obj[e].hasOwnProperty(en) && typeof obj[e] === "object") {
    //         const value = obj[e][en];
    //         obj[e] = {};
    //         obj[e][en] = value;
    //       } else {
    //         return;
    //       }
    //     });
    //   });
    //   return obj;
    // }
    // function filterUnits(obj) {
    //   Object.keys(obj).map((e, i) => {
    //     if (userUnits.indexOf(e) !== -1) {
    //       Object.keys(obj).map((en, ind) => {
    //         if (en !== e) {
    //           delete obj[en];
    //         }
    //       });
    //     } else if (typeof obj[e] === "object") {
    //       filterUnits(obj[e]);
    //     }
    //   });
    //   return obj;
    // }
  }

  // var moon = new Image(20, 20);

  // $.get("./pe-icon-set-weather/svg/compass-n.svg", function(data) {
  //   var iconSVG = data.documentElement;
  //   iconSVG.getElementsByTagName("style")[0].innerHTML =
  //     ".st0{fill:#00bcd4;transform-origin:50% 50% ;transform: translateY(0px) rotate(90deg)}";
  //   var svgString = new XMLSerializer().serializeToString(iconSVG);
  //   var encodedSvg = window.btoa(svgString);
  //   moon.src = "data:image/svg+xml;base64," + encodedSvg;
  // });

  // var globaltooltips = {
  //   enabled: true,
  //   mode: "index",
  //   intersect: "true",
  //   position: "average",
  //   backgroundColor: "#455a64",
  //   titleFontFamily: "Roboto",
  //   titleFontSize: 16,
  //   titleMarginBottom: 10,
  //   bodyFontFamily: "Roboto",
  //   bodyFontSize: 12,
  //   bodySpacing: 8,
  //   xPadding: 10,
  //   yPadding: 10,
  //   caretPadding: 5,
  //   caretSize: 10,
  //   cornerRadius: 5,
  //   displayColors: false
  // };

  // for (key of Object.keys(globaltooltips)) {
  //   Chart.defaults.global.tooltips[key] = globaltooltips[key];
  // }

  // Object.assign(Chart.defaults.global.tooltips, globaltooltips);

  // Chart.defaults.global.defaultFontColor = "#899397";
  // Chart.defaults.global.defaultFontFamily = "Roboto";
  // Chart.defaults.global.title.display = true;
  // Chart.defaults.global.legend.display = false;
  // Chart.defaults.global.layout.padding = {
  //   left: 0,
  //   right: 10,
  //   top: -10,
  //   bottom: 10
  // };

  // window.onpopstate = function() {
  //   if (window.location.hash.slice(1) === "dashboard") {
  //     $(".main-content").html($("#dashboard").html());
  //     loadDashboardCharts();
  //     if (window.W) {
  //       windy();
  //     }
  //   }

  //   if (window.location.hash === "charts") {
  //     $(".main-content").html($("#charts").html());
  //     loadCharts();
  //   }

  //   if (window.location.hash === "weekly") {
  //     $(".main-content").html($("#weekly").html());
  //     $("#collapseOne").collapse("show");
  //     loadWeeklyCharts();
  //   }
  //   if (window.location.hash === "map") {
  //     $(".main-content").html($("#map").html());
  //     if (window.W) {
  //       windy();
  //     }
  //   }
  // };

  // loadDashboardCharts();
});
