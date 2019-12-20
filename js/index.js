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
    mapBoxKey: ""
  },
  getDarkSkyData: function(coords) {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(coords)
    };
    fetch("/api", options)
      .then(res => {
        if (res.status == 500) {
          swal({
            title: "Connection Error!",
            text: "Make sure you're connected to the internet and try again.",
            icon: "error",
            button: "Retry",
            allowOutsideClick: false,
            closeOnClickOutside: false
          }).then(e => {
            app.init({
              lon: app.variables.mapCenter[0],
              lat: app.variables.mapCenter[1]
            });
          });
          return;
        }
        res
          .json()
          .then(res => {
            this.clientProcess(res);
            [...document.getElementsByTagName("a")].map((e, i) => {
              e.style.pointerEvents = "auto";
              e.style.cursor = "pointer";
            });
          })
          .catch(e => {
            console.log(e);
            return;
          });
      })
      .catch(e => {
        swal({
          title: "Connection Error!",
          text: "Make sure you're connected to the internet and try again.",
          icon: "error",
          button: "Retry",
          allowOutsideClick: false,
          closeOnClickOutside: false
        }).then(e => {
          app.init({
            lon: app.variables.mapCenter[0],
            lat: app.variables.mapCenter[1]
          });
        });
        return;
      });
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
        res.json().then(res => {
          this.clientProcess(res);
        });
      })
      .catch(e => console.log(e));
  },
  init: function(coords) {
    document.querySelector(".page-loader").style.display = "block";
    document.querySelector(".location-header h5").textContent = this.variables.myLocation;
    mapboxgl.accessToken = this.apiKeys.mapBoxKey;
    $("select").selectpicker();
    $("#location .dropdown-menu").css("display", "block");
    this.getDarkSkyData(coords);
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
      return new Date(entry.time).toTimeString().substr(0, 5);
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
    });

    this.utilities.mapProperties(weekly.weeklyCharts.yaxis, obj.daily.data);
  },
  fetchChartData: function(obj) {
    const { charts } = this.data.weatherCheckObj;
    this.utilities.mapProperties(charts.yaxis, obj.hourly.data);
    charts.xaxis = obj.hourly.data.map((entry, index) => {
      return new Date(entry.time).toTimeString().substr(0, 5);
    });
  },
  loadDashboardData: function(dashboard) {
    const current = document.querySelectorAll(".summary .card-details .value");
    const uvIndex = document.querySelector(".uv-index .card-details .description");
    const wind = document.querySelectorAll(".wind .card-details .value");
    const params = document.querySelectorAll(".other-params .value");
    document.querySelector(".summary .card-header-block .title").textContent = dashboard.summary;
    document.querySelector(".summary .card-header-block .icon i").classList = "pe-is-w-".concat(
      app.utilities.variables.conditionToIcon[dashboard.icon]
    );
    document.querySelector(".summary .card-header-block .value").childNodes[0].textContent = dashboard.temperature;
    current[0].childNodes[0].textContent = dashboard.feelslike;
    current[1].childNodes[0].textContent = dashboard.sunriseTime;
    current[2].childNodes[0].textContent = dashboard.temperatureMax;
    current[3].childNodes[0].textContent = dashboard.temperatureMin;
    current[4].childNodes[0].textContent = (dashboard.moonPhase * 100).toFixed() + "%";
    current[5].childNodes[0].textContent = dashboard.sunsetTime;
    current[6].childNodes[0].textContent = dashboard.temperatureMaxTime;
    current[7].childNodes[0].textContent = dashboard.temperatureMinTime;
    document.querySelector(".uv-index .value").textContent = dashboard.uvIndex;
    if (dashboard.uvIndex <= 2) {
      uvIndex.textContent = "LOW";
      uvIndex.style.color = "#4caf50";
      uvIndex.nextElementSibling.textContent =
        "Wear sunglasses on bright days. If you burn easily, cover up and use broad spectrum SPF 30+ sunscreen.";
    } else if (dashboard.uvIndex > 2 && dashboard.uvIndex <= 5) {
      uvIndex.textContent = "MODERATE";
      uvIndex.style.color = "#fdd835";
      uvIndex.nextElementSibling.textContent =
        "Stay in shade near midday when the Sun is strongest. If outdoors, seek shade and wear UV-blocking sunglasses.";
    } else if (dashboard.uvIndex > 5 && dashboard.uvIndex <= 7) {
      uvIndex.textContent = "HIGH";
      uvIndex.style.color = "#ffa726";
      uvIndex.nextElementSibling.textContent =
        "Reduce time in the Sun between 10 a.m. and 4 p.m. If outdoors, seek shade wear UV-blocking sunglasses.";
    } else if (dashboard.uvIndex > 7 && dashboard.uvIndex <= 10) {
      uvIndex.textContent = "VERY HIGH";
      uvIndex.style.color = "#ef5350";
      uvIndex.nextElementSibling.textContent =
        "Minimize Sun exposure between 10 a.m. and 4 p.m. If outdoors, seek shade and wear UV-blocking sunglasses.";
    } else if (dashboard.uvIndex > 11) {
      uvIndex.textContent = "EXTREME";
      uvIndex.style.color = "#b39ddb";
      uvIndex.nextElementSibling.textContent =
        "Try to avoid Sun exposure between 10 a.m. and 4 p.m. If outdoors, seek shade and wearUV-blocking sunglasses.";
    }
    wind[0].textContent = dashboard.windSpeed;
    wind[1].textContent = dashboard.windGust;
    wind[2].childNodes[0].textContent = dashboard.windBearing;
    wind[3].textContent = dashboard.windGustTime;
    wind[4].childNodes[0].textContent = dashboard.dewPoint;
    wind[5].textContent = (dashboard.humidity * 100).toFixed() + "%";
    wind[6].textContent = (dashboard.precipProbability * 100).toFixed() + "%";
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
    weeklyCard.forEach((e, i) => {
      e.querySelector(".daily-card-header .title").textContent = weeklyEntry[i].day;
      e.querySelector(".daily-card-header .date").textContent = weeklyEntry[i].date;
      e.querySelector(".daily-card-details .degree").firstChild.textContent = (
        (parseInt(weeklyEntry[i].temperatureMax) + parseInt(weeklyEntry[i].temperatureMin)) /
        2
      ).toFixed();
      e.querySelector(".daily-card-details .icon i").classList = "pe-is-w-".concat(
        app.utilities.variables.conditionToIcon[weeklyEntry[i].icon]
      );
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
      e.querySelectorAll(".card-body-values .value")[5].childNodes[0].textContent = weeklyEntry[i].dewPoint;
    });
    this.loadWeeklyCharts(weekly.weeklyCharts, this.data.weeklyBearing);
  },
  loadDashboardCharts: function(charts, svgIcons, bearingIcons) {
    var ctx = document.getElementById("Chart1").getContext("2d");
    var ctx2 = document.getElementById("Chart2").getContext("2d");
    const maxTemp = Math.max(...charts.yaxis.temperature);
    const minTemp = Math.min(...charts.yaxis.temperature);
    const maxWind = Math.max(...charts.yaxis.windSpeed);
    var myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "Temperature",
            data: charts.yaxis.temperature.map(e => parseInt(e)),
            backgroundColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
            borderColor: "",
            borderWidth: 0
          },
          {
            label: "Icons",
            data: charts.yaxis.temperature.map(e => {
              return parseInt(e) > 0 ? parseInt(e) + maxTemp * 0.1 : parseInt(e) + minTemp * 0.1;
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
            backgroundColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
            borderWidth: 0,
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
    const maxWind = Math.max(...charts.yaxis.windGust);
    const myChart9 = new Chart(ctx9, {
      type: "bar",
      data: {
        labels: charts.xaxis,
        datasets: [
          {
            label: "Maximum Temperature",
            data: charts.yaxis.temperatureMax.map(e => parseInt(e)),
            backgroundColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
            borderWidth: 0,
            fill: "false"
          },
          {
            label: "Minimum Temperature",
            data: charts.yaxis.temperatureMin.map(e => parseInt(e)),
            backgroundColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.2)
              .rgbString(),
            borderWidth: 0,
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
                  "Max: " +
                  data.datasets[0].data[tooltipItem.index] +
                  " @ " +
                  charts.yaxis.temperatureMaxTime[tooltipItem.index]
                );
              } else if (tooltipItem.datasetIndex === 1) {
                return (
                  "Min: " +
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
            backgroundColor: "#21cbff",
            borderColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
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
            backgroundColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
            fill: false
          },
          {
            label: "Icons",
            data: charts.yaxis.windGust.map(e => {
              return parseInt(e) + maxWind * 0.1;
            }),
            pointStyle: weeklyBearing,
            type: "line",
            backgroundColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
            fill: false,
            showLine: false
          },

          {
            label: "Gust",
            data: charts.yaxis.windGust.map((e, i) => {
              return parseInt(e) - charts.yaxis.windSpeed[i];
            }),
            pointStyle: weeklyBearing,
            type: "bar",
            backgroundColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.1)
              .rgbString()
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
                return "Wind Speed: " + data.datasets[0].data[tooltipItem.index];
              } else if (tooltipItem.datasetIndex === 1) {
                return "Bearing: " + charts.yaxis.windBearing[tooltipItem.index];
              } else if (tooltipItem.datasetIndex === 2) {
                return (
                  "Gust: " +
                  charts.yaxis.windGust[tooltipItem.index] +
                  " @ " +
                  charts.yaxis.windGustTime[tooltipItem.index]
                );
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
              },
              stacked: true
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
              },
              stacked: true
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
            backgroundColor: "#21cbff",
            borderColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
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
                  ? "Intensity: Light Rain"
                  : "Intensity: " + data.datasets[1].data[tooltipItem.index];
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
            backgroundColor: "#21cbff",
            borderColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
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
            backgroundColor: "#21cbff",
            borderColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
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
            backgroundColor: "#21cbff",
            borderColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
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
            backgroundColor: "#21cbff",
            borderColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
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
            backgroundColor: "#21cbff",
            borderColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
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
            backgroundColor: "#21cbff",
            borderColor: Chart.helpers
              .color("#21cbff")
              .alpha(0.7)
              .rgbString(),
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
    geocodedList: [],
    geocoded: {}
  },
  init: function() {
    // $("#location select").niceScroll();
    $("#location .inner.show:lt(1)").niceScroll({
      cursorcolor: "#455a64",
      cursorborder: "none",
      autohidemode: "scroll"
    });
    $(".tab-pane:lt(1)").niceScroll({
      cursorcolor: "#455a64",
      cursorborder: "none",
      autohidemode: "scroll"
    });
    Waves.attach(".update-button button", ["waves-button", "waves-float"]);
    Waves.init();
    this.variables.selectedLocation = this.variables.geocodedList[0].place_name;
    this.displayGeocodedList();
    $("#location select").on("loaded.bs.select", this.onLoad.bind(this));
    document
      .querySelector(".bs-searchbox input")
      .addEventListener("keyup", app.utilities.delay(this.onKeyUp.bind(this)));
    // $("#location select").on("changed.bs.select", this.onChange.bind(this));
    $("#location select").on("change", this.onChange.bind(this));
  },
  onChange: function(e) {
    const clickedIndex = document.querySelector("#location select").selectedIndex;
    const _this = this;
    if (document.querySelector(".bs-searchbox input").value.trim() !== "") {
      _this.variables.geocodedList = _this.variables.geocodedList.filter(function(e, i) {
        console.log(e);
        return (
          e.id !== _this.variables.geocoded.features[clickedIndex].id &&
          e.place_name !== _this.variables.geocoded.features[clickedIndex].place_name
        );
      });
    } else if (document.querySelector(".bs-searchbox input").value.trim() === "") {
      this.variables.selectedLocation = this.variables.geocodedList[clickedIndex].place_name;
      $("#location select").selectpicker("val", document.querySelectorAll("#location option")[clickedIndex].innerHTML);
      $("#location select").selectpicker("refresh");
      app.variables.myLocation = this.variables.geocodedList[clickedIndex].text;
      app.variables.mapCenter = this.variables.geocodedList[clickedIndex].center;
      [...document.getElementsByTagName("a")].map((e, i) => {
        e.style.pointerEvents = "none";
        e.style.cursor = "default";
      });
      app.init({
        lon: app.variables.mapCenter[0],
        lat: app.variables.mapCenter[1]
      });
      //   app.utilities.pageLoader(app.variables.section);
      document.querySelector(".app").classList.remove("rightsidebar-open");
      document.querySelector("#overlay").classList.remove("overlay");
      return;
    }

    this.variables.geocodedList = [
      ...this.variables.geocodedList.slice(0, 1),
      this.variables.geocoded.features[clickedIndex],
      ...this.variables.geocodedList.slice(1)
    ];
    document.querySelectorAll("#location select option").forEach((e, i) => {
      e.remove();
    });
    document.querySelector("#location input").value = "";
    this.displayGeocodedList();
    this.variables.selectedLocation = this.variables.geocodedList[1].place_name.replace(/\s+/g, " ");
    document.querySelector(".page-loader").style.display = "block";
    $("#location select").selectpicker("val", this.variables.selectedLocation);
    $("#location select").selectpicker("refresh");
    app.variables.myLocation = this.variables.geocodedList[1].text;
    app.variables.mapCenter = this.variables.geocodedList[1].center;
    [...document.getElementsByTagName("a")].map((e, i) => {
      e.style.pointerEvents = "none";
      e.style.cursor = "default";
    });
    app.init({
      lon: app.variables.mapCenter[0],
      lat: app.variables.mapCenter[1]
    });
    // app.utilities.pageLoader(app.variables.section);
    document.querySelector(".app").classList.remove("rightsidebar-open");
    document.querySelector("#overlay").classList.remove("overlay");
  },
  onKeyUp: function(e) {
    const clickedIndex = document.querySelector("#location select");
    console.dir(clickedIndex);
    if ([37, 38, 39, 40, 91, 13, 16, 17].indexOf(e.keyCode) !== -1) return;
    document.querySelectorAll("#location select option").forEach((e, i) => {
      e.remove();
    });
    $("#location select").selectpicker("refresh");

    if (e.target.value.trim() === "") {
      this.displayGeocodedList();
      $("#location select").selectpicker("val", this.variables.selectedLocation);
      $("#location select").selectpicker("refresh");
      return;
    }

    fetch("/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ searchTerm: e.target.value.trim() })
    }).then(res =>
      res.json().then(res => {
        this.variables.geocoded = Object.assign({}, res);
        console.log(this.variables.geocoded);
        this.variables.geocoded.features.map((e, i) => {
          const option = document.createElement("OPTION");
          option.text = e.place_name;
          document.querySelector("#location select").appendChild(option);
        });
        $("#location select").selectpicker("val", "");
        $("#location select").selectpicker("refresh");
      })
    );
  },
  displayGeocodedList: function() {
    this.variables.geocodedList.map((e, i) => {
      const option = document.createElement("OPTION");
      option.textContent = e.place_name.replace(/\s+/g, " ");
      if (i === 0) {
        option.setAttribute("data-icon", "fa fa-map-marker");
      }
      document.querySelector("#location select").appendChild(option);
    });
    $("#location select").selectpicker("refresh");
  },
  onLoad: function(e) {
    document.querySelectorAll("#location select option").forEach((e, i) => {
      e.remove();
    });
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
          document.querySelector(".app").classList.remove("rightsidebar-open");
          document.querySelector("#overlay").classList.remove("overlay");
          this.variables.userUnits = inputUnitsArray;
          document.getElementById("updateButton").disabled = true;
          app.data.filtered = app.utilities.filterUnits(JSON.parse(JSON.stringify(app.data.weatherCheckObj)));
          app.utilities.pageLoader(app.variables.section);
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
          display: true,
          padding: 20
        },
        legend: {
          display: false
        },
        layout: {
          padding: {
            left: -5,
            right: 0,
            top: -15,
            bottom: 0
          }
        },
        tooltips: {
          enabled: true,
          mode: "index",
          intersect: "true",
          position: "nearest",
          backgroundColor: "#455a64",
          titleFontFamily: "Roboto",
          titleFontSize: 14,
          titleMarginBottom: 10,
          bodyFontFamily: "Roboto",
          bodyFontSize: 12,
          bodySpacing: 8,
          xPadding: 10,
          yPadding: 10,
          caretPadding: 5,
          caretSize: 10,
          cornerRadius: 5,
          displayColors: false,
          callbacks: {
            title: function(tooltipItem, data) {
              if (["Chart9", "Chart10", "Chart12", "Chart13"].indexOf(this._chart.canvas.id) === -1) {
                return app.data.filtered.charts.xaxis[tooltipItem[0].index];
              } else {
                return app.data.filtered.weekly.weeklyCharts.xaxis[tooltipItem[0].index];
              }
            }
          }
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
        if (["Chart9", "Chart10", "Chart12", "Chart13"].indexOf(Chart.chart.canvas.id) === -1) {
          if (Chart.chart.width < 400) {
            Chart.chart.config.data.labels = Chart.chart.config.data.labels.map((e, i) => {
              return e.substr(0, 2);
            });
          }
        }
        if (Chart.chart.canvas.id === "Chart1") {
          app.data.filtered.dashboard.dashboardCharts.yaxis.icon.map((e, i) => {
            app.utilities.getWeatherIcon(e, new Image(20, 20)).then(res => {
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
        if (["Chart3", "Chart4", "Chart5", "Chart6", "Chart7", "Chart8"].indexOf(Chart.chart.canvas.id) !== -1) {
          Chart.chart.options.animation.onComplete = function(e) {
            Chart.chart.options.animation.onComplete = null;
            document.querySelector(".page-loader").style.display = "none";
          };
        }
      },
      resize: function(Chart) {
        if (["Chart9", "Chart10", "Chart12", "Chart13"].indexOf(Chart.chart.canvas.id) === -1) {
          if (Chart.chart.width < 400) {
            Chart.chart.config.data.labels = Chart.chart.config.data.labels.map((e, i) => {
              return e.substr(0, 2);
            });
          } else {
            Chart.chart.config.data.labels = app.data.filtered.charts.xaxis;
          }
        }
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
            e[item] = new Date(e[item]).toString().substr(16, 5);
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
                interactive: false,
                trackResize: false
              });
              map.on("load", () => {
                document.querySelector(".page-loader").style.display = "none";
                new mapboxgl.Marker().setLngLat(app.variables.mapCenter).addTo(map);
                map.resize();
              });
              map.on("error", () => {
                console.log("error loading map");
                document.querySelector(".page-loader").style.display = "none";
                //display a modal with error message
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
              $(app.variables.selectedPanel).on("shown.bs.collapse", function() {
                document.querySelector(".page-loader").style.display = "none";
              });
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
  },
  delay: function(callback) {
    let timer = 0;
    return function() {
      let context = this;
      let args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() {
        callback.apply(context, args);
      }, 500);
    };
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
    if (event.target.closest(".navitem").classList.contains("active")) {
      return;
    }
    document.querySelector(".page-loader").style.display = "block";
    const hash = event.target.closest("a").hash.slice(1);
    this.variables.navItems.map((e, i) => e.classList.contains("active") && e.classList.remove("active"));
    event.target.closest(".navitem").classList.add("active");
    app.domElements.app.classList.remove("is-collapsed");
    app.variables.section = hash;
    app.utilities.pageLoader(app.variables.section);
  },
  displayDialog: function(icon, title, text, callback) {
    swal({
      title,
      text,
      icon,
      button: "Retry",
      allowOutsideClick: false,
      closeOnClickOutside: false
    }).then(e => {
      callback;
    });
    Waves.attach("button.swal-button", ["waves-button", "waves-float"]);
    Waves.init();
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
      key: "",
      verbose: false,
      lat: app.variables.mapCenter[1],
      lon: app.variables.mapCenter[0],
      zoom: 10
    }
  },
  init: function() {
    if (window.W) {
      if (!window.copy_of_W) {
        window.copy_of_W = Object.assign({}, window.W);
      }
      if (window.W.windyBoot) {
        window.W = Object.assign({}, window.copy_of_W);
      }
    }
    this.variables.options.lon = app.variables.mapCenter[0];
    this.variables.options.lat = app.variables.mapCenter[1];
    const { userUnits } = app.settings.variables;

    windyInit(this.variables.options, windyAPI => {
      const { map, overlays } = windyAPI;
      // console.log(overlays.wind.listMetrics());
      userUnits[0] === "celsius" ? overlays.temp.setMetric("°C") : overlays.temp.setMetric("°F");
      userUnits[1] === "knots"
        ? overlays.wind.setMetric("kt")
        : userUnits[1] === "meterspersecond"
        ? overlays.wind.setMetric("m/s")
        : overlays.wind.setMetric("mph");
      L.marker([this.variables.options.lat, this.variables.options.lon], {
        icon: map.myMarkers.myLocationIcon
      }).addTo(map);
      document.querySelector(".page-loader").style.display = "none";
    });
  }
};

$(function() {
  $(".main-content").niceScroll({
    cursorcolor: "#455a64",
    cursorborder: "none",
    autohidemode: "scroll"
  });
  [...document.getElementsByTagName("a")].map((e, i) => {
    e.style.pointerEvents = "none";
    e.style.cursor = "default";
  });

  Run();

  function Run() {
    fetch("/keys").then(res =>
      res.json().then(res => {
        app.apiKeys.mapBoxKey = res.mapboxKey;
        app.windyMap.variables.options.key = res.windyKey;
      })
    );
    document.querySelector(".page-loader").style.display = "block";
    getCoordinates()
      .then(coords => {
        app.variables.mapCenter[0] = coords.lon;
        app.variables.mapCenter[1] = coords.lat;

        fetch("/geolocation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            lon: coords.lon,
            lat: coords.lat
          })
        }).then(res => {
          res.json().then(res => {
            app.geocoder.variables.geocodedList[0] = res.features[0];
            app.variables.myLocation = app.geocoder.variables.geocodedList[0].text;
            app.init(coords);
            app.settings.init();
            app.charts.init();
            app.geocoder.init();
            app.ui.init();
          });
        });
      })
      .catch(e => {
        swal({
          title: "Location Error!",
          text: "Please enable location services on your device and try again.",
          icon: "warning",
          button: "Retry",
          allowOutsideClick: false,
          closeOnClickOutside: false
        }).then(e => {
          Run();
          // return;
        });
        Waves.attach("button.swal-button", ["waves-button", "waves-float"]);
        Waves.init();
      });
  }

  function getCoordinates() {
    let lat, lon;
    return new Promise(function(resolve, reject) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          ({ latitude: lat, longitude: lon } = pos.coords);
          resolve({ lat, lon });
        },
        e => {
          if (e.code == 1 && navigator.onLine) {
            return fetch("http://ip-api.com/json/")
              .then(res => {
                res
                  .json()
                  .then(res => {
                    ({ lat, lon } = res);
                    resolve({ lat, lon });
                  })
                  .catch(e => reject(e));
              })
              .catch(e => reject(e));
          }
          reject(e);
        }
      ),
        function(err) {
          console.log(err);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 };
    });
  }
});
