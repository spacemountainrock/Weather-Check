const chartGlobals = {
  global: {
    defaultFontColor: "#899397",
    defaultFontFamily: "#Roboto",
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
    toolTips: {
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
  }
};

const mini = {
  ironman: {
    suits: {
      primary: "Mark2",
      secondary: "Hulkbuster"
    },
    name: "Stark",
    age: "40"
  },
  cap: {
    name: "Steve",
    age: "95"
  }
};

var isobject = function(x) {
  return Object.prototype.toString.call(x) === "[object Object]";
};

var isobject = function(x) {
  return Object.prototype.toString.call(x) === "[object Object]";
};

// var getkeys = function(obj, prefix) {
//   var keys = Object.keys(obj);
//   prefix = prefix ? prefix : [];
//   return keys.reduce(function(result, key) {
//     if (isobject(obj[key])) {
//       result = result.concat(getkeys(obj[key], prefix.concat(key)));
//     } else {
//       result.push(prefix.concat(key).concat(obj[key]));
//     }
//     return result;
//   }, []);
// };

var getSetKeys = function(src, dest, prefix) {
  var keys = Object.keys(src);
  prefix = prefix ? prefix : [];
  return keys.reduce(function(result, key) {
    if (isobject(src[key])) {
      result = result.concat(getSetKeys(src[key], dest[key], prefix.concat(key)));
    } else {
      dest[key] = src[key];
    }
    return result;
  }, []);
};

const Chartsrc = {
  defaults: {
    global: {
      defaultFontColor: "lulu"
    }
  }
};

const Chartdest = {
  defaults: {
    global: {
      defaultFontColor: "yellow"
    }
  }
};

var keys = getSetKeys(Chartsrc, Chartdest, []);

// function setDepth(obj, path, value) {
//   var len = path.length - 1;
//   for (var i = 0; i < len; i++) {
//     obj = obj[path[i]];
//   }
//   obj[path[len]] = value;
// }

// setDepth(Charts, ["defaults", "global", "defaultFontColor"], "green");

// console.log(keys);
// console.log(Chartdest);

// const temp = {
//   c: 50,
//   f: ctof(50)
// };

// function ctof(c) {
//   return 500;
// }
// console.log(temp.f);

const source = [
  {
    time: 20,
    temperature: {
      celsius: 30,
      fahrenheit: 80
    }
  },
  {
    time: 20,
    temperature: {
      celsius: 50,
      fahrenheit: 90
    }
  }
];

const dest = {};

Object.keys(source[0]["temperature"]).map((e, i) => {
  const data = source.reduce((acc, key, index) => {
    return acc.concat(key.temperature[e]);
  }, []);
  dest[e] = data;
});

Object.prototype.clone = function() {
  var i,
    newObj = this instanceof Array ? [] : {};
  for (i in this) {
    if (i === "clone") {
      continue;
    }
    if (this[i] && typeof this[i] === "object") {
      newObj[i] = this[i].clone();
    } else {
      newObj[i] = this[i];
    }
  }
  return newObj;
};

// const mini2 = mini.clone();

// console.log(mini2);

const units = {
  one: {
    onedash: {
      celsius: [1, 2, 3, 4],
      fahrenheit: [10, 20, 30, 40]
    }
  },
  two: {
    twodash: {
      celsius: [1, 2, 3, 4],
      fahrenheit: [5, 6, 7, 8]
    },
    another: [1, 2, 3, 4]
  }
};

const userUnits = ["celsius"];

function testunits(obj) {
  Object.keys(obj).map((e, i) => {
    userUnits.map((en, ind) => {
      if (!obj[e].hasOwnProperty(en)) {
        testunits(obj[e]);
      } else {
        const value = obj[e][en];
        obj[e] = {};
        obj[e][en] = value;
      }
    });
  });
  return obj;
}

console.log(testunits(units));
// console.log(units);
// console.log(userUnits[userUnits.indexOf("celsius")]);
