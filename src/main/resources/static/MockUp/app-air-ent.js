$.ajaxSetup({
  async: false
});

$(document).on('swipeleft', '.ui-page', function(event) {
  if (event.handled !== true) // This will prevent event triggering more then
  {
    var nextpage = $.mobile.activePage.next('[data-role="page"]');
    // swipe using id of next page if exists
    if (nextpage.length > 0) {
      $.mobile.changePage(nextpage, {
        transition: "slide",
        reverse: false
      }, true, true);
    }
    event.handled = true;
  }
  return false;
});

$(document).on('swiperight', '.ui-page', function(event) {
  if (event.handled !== true) // This will prevent event triggering more then once
  {
    var prevpage = $(this).prev('[data-role="page"]');
    if (prevpage.length > 0) {
      $.mobile.changePage(prevpage, {
        transition: "slide",
        reverse: true
      }, true, true);
    }
    event.handled = true;
  }
  return false;
});










function makeLocUrl() {

  var input = encodeURIComponent((document.getElementById("addressInput").value));

  var url = "https://nominatim.openstreetmap.org/search/de/berlin/" + input + "?format=json&addressdetails=1&limit=1&polygon_svg=1";

  return url;

};

function getJSON(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'json';
  xhr.onload = function() {
    var status = xhr.status;
    if (xhr.readyState === 4 && (status === 200 || status === 0)) {
      callback(null, xhr.response);
    } else {
      callback(status, xhr.response);
    }
  };
  xhr.send();
}


function distance(lat1, lon1, lat2, lon2) {
  var R = 6371e3; // metres
  var pi = Math.PI;
  var phi1 = lat1 * (pi / 180);
  var phi2 = lat2 * (pi / 180);
  var deltaphi = (lat2 - lat1) * (pi / 180);
  var deltalambda = (lon2 - lon1) * (pi / 180);

  var a = Math.sin(deltaphi / 2) * Math.sin(deltaphi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltalambda / 2) * Math.sin(deltalambda / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  var d = Math.round(R * c);
  return d / 1000;
}

function getDistNearestStation(lat, lon) {
  var dist;
  StationUrl = encodeURI("http://172.16.253.16:8080/pollution/nearest?lat=" + lat.trim() + "&lng=" + lon.trim());
  //alert(StationUrl);
  $.getJSON(StationUrl, function getDistance(data) {
    if (data[0].station.location.lng !== null) {
      var lonStation = data[0].station.location.lng;
      var latStation = data[0].station.location.lat;
      dist = distance(lat, lon, latStation, lonStation);
    }
  });
  return dist;
}

function getValueNow(lat, lon) {
  var values = [];
  StationUrl = encodeURI("http://172.16.253.16:8080/pollution/nearest?lat=" + lat.trim() + "&lng=" + lon.trim());
  //alert(StationUrl);
  $.getJSON(StationUrl, function(data) {
    if (data[0].station.location.lng !== null) {
      var pollutant = data[0].measurementType;
      var name = data[0].station.name;
      var value = data[0].value;
      values = [pollutant,name,value];
    }
  });
  return values;
}





//'https://nominatim.openstreetmap.org/?format=json&addressdetails=1&q=Sodener+Str+20&format=json&limit=1'

function submitFunction() {
  var urlMine = makeLocUrl();

  $.getJSON(urlMine, function(data) {
    if (Array.isArray(data) && data.length !== 0) {

      var street = data[0].address.road + ", " + data[0].address.city;

      var loc = document.getElementById("title1");
      loc.innerHTML = street;
      var latlong = [];
      var lat = data[0].lat;
      var lon = data[0].lon;
      latlong.push(lon);
      latlong.push(lat);
      var dist = getDistNearestStation(lat, lon);
      document.getElementById("distance").innerHTML = "<br/> distance to next station: " + dist + " km";
      setLocPoint(latlong);
      alert(getValueNow(lat, lon));

      document.getElementById("address").style.display = "none";
    } else {
      alert("No such address, try again");

    }
  });
}
function makeButtons() {
  var first = new Date().getHours();
  var first = first - (first % 3);
  //alert(first);
  //document.getElementById("choice-1").innerHTML = first;
  document.getElementById("choice-2").innerHTML += (first+6) % 24;
  document.getElementById("choice-3").innerHTML += (first+9) % 24;
  document.getElementById("choice-4").innerHTML += (first+12) %24;
  document.getElementById("choice-5").innerHTML += (first+15) %24;
  document.getElementById("choice-6").innerHTML += (first+18) %24;
  document.getElementById("choice-7").innerHTML += (first+21) %24;
  document.getElementById("choice-8").innerHTML += (first+24) %24;
  document.getElementById("choice-9").innerHTML += (first+27) %24;
}
makeButtons();

function getWeatherForecast(time){
  if (time == 0){
  $.getJSON("http://172.16.253.16:8080/weather/current", function(now) {
      console.log(now); // this will show the info it in firebug console
      var nowdata = [];
      nowdata[0] = 2;
      nowdata[1] = 3;
      nowdata.push(Math.round(now.main.temp_max-273.15));
      nowdata.push(Math.round(now.main.temp_min-273.15));
      nowdata.push(iconConverter(now.weather[0].icon));
      nowdata.push(now.wind.deg);
      change3hour(nowdata);
  });
  } else {
    $.getJSON("http://172.16.253.16:8080/weather/forecast/hourly", function(json) {
      console.log(json);
      if(time > 0 && time < 9){
        //alert(json.list[time].dt_txt);
        change3hour([fakePollution(),fakePollution(), Math.round(json.list[time].main.temp_max-273.15), Math.round(json.list[time].main.temp_min-273.15), iconConverter(json.list[time].weather[0].icon), json.list[time].wind.deg ]);
      }
      else {
        var i = getRightIndex(time);
        changeDays([fakePollution(),fakePollution(), Math.round(json.list[i].main.temp_max-273.15), Math.round(json.list[i].main.temp_min-273.15), iconConverter(json.list[i].weather[0].icon), json.list[i].wind.deg], time);
        //alert(json.list[i].dt_txt);
        //alert(json.list[i].wind.deg);
      }
    });
  }
}

function getRightIndex(i){
  var hour = new Date().getHours();
  if (13 <= hour && hour <= 15) {
    return i;
  }
  else if (16 <= hour && hour <= 18) {
    return i-1;
  }
  else if (19 <= hour && hour <= 21) {
    return i-2;
  }
  else if (22 <= hour) {
    return i-3;
  }
  else{
    return i-1;
  }
}


function fakePollution(){
  return Math.floor(Math.random() * 6)+1;
}

getWeatherForecast(0);
getWeatherForecast(9);
getWeatherForecast(15);
getWeatherForecast(23);
getWeatherForecast(31);
getWeatherForecast(39);


function iconConverter(iconID){
  var icon;
  if( iconID == "01d" || iconID == "01n") {
    icon = "icons/sunny.svg";
  }
  if( iconID == "02d" || iconID == "02n") {
    icon = "icons/sun_cloud.svg";
  }
  if( iconID == "03d" || iconID == "03n" || iconID == "04d" || iconID == "04n") {
    icon = "icons/cloud.svg";
  }
  if( iconID == "09d" || iconID == "09n" || iconID == "10d" || iconID == "10n") {
    icon = "icons/rain.svg";
  }
  if( iconID == "11d" || iconID == "11n") {
    icon = "icons/storm.svg";
  }
  if( iconID == "13d" || iconID == "13n") {
    icon = "icons/snow_cloud.svg";
  }
  return icon;
}




function changeAddress() {
  var x = document.getElementById("address");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}


mapboxgl.accessToken = 'pk.eyJ1IjoibGlsbGlwaWxsaSIsImEiOiJjanBjc3J3ZmozMG55M3dwaHFpcmFlZDNoIn0.Eh9Spcc3_PNF72jAYeGTmQ';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v9',
  minZoom: 8.3,
  maxZoom: 12,
  center: [13.5, 52.52697],
  zoom: 8.3,
  interactive: false
});

var measurepoints = {
  "array": [{
    "measurementType": "traffic",
    "station": {
      "id": "088",
      "name": "Messwagen Leipziger Str.",
      "location": {
        "lat": 52.5102,
        "lng": 13.388529
      }
    }
  }, {
    "measurementType": "traffic",
    "station": {
      "id": "117",
      "name": "Schildhornstraße",
      "location": {
        "lat": 52.463611,
        "lng": 13.31825
      }
    }
  }, {
    "measurementType": "traffic",
    "station": {
      "id": "124",
      "name": "Mariendorfer Damm",
      "location": {
        "lat": 52.438056,
        "lng": 13.3875
      }
    }
  }, {
    "measurementType": "traffic",
    "station": {
      "id": "143",
      "name": "Silbersteinstraße",
      "location": {
        "lat": 52.467511,
        "lng": 13.44165
      }
    }
  }, {
    "measurementType": "traffic",
    "station": {
      "id": "174",
      "name": "Frankfurter Allee",
      "location": {
        "lat": 52.514072,
        "lng": 13.469931
      }
    }
  }, {
    "measurementType": "traffic",
    "station": {
      "id": "115",
      "name": "Hardenbergplatz",
      "location": {
        "lat": 52.5066,
        "lng": 13.332972
      }
    }
  }, {
    "measurementType": "background",
    "station": {
      "id": "010",
      "name": "Wedding",
      "location": {
        "lat": 52.543041,
        "lng": 13.349326
      }
    }
  }, {
    "measurementType": "background",
    "station": {
      "id": "042",
      "name": "Neukölln",
      "location": {
        "lat": 52.489439,
        "lng": 13.430856
      }
    }
  }, {
    "measurementType": "background",
    "station": {
      "id": "171",
      "name": "Mitte",
      "location": {
        "lat": 52.513606,
        "lng": 13.418833
      }
    }
  }, {
    "measurementType": "suburb",
    "station": {
      "id": "032",
      "name": "Grunewald",
      "location": {
        "lat": 52.473192,
        "lng": 13.225144
      }
    }
  }, {
    "measurementType": "suburb",
    "station": {
      "id": "077",
      "name": "Buch",
      "location": {
        "lat": 52.644167,
        "lng": 13.483056
      }
    }
  }, {
    "measurementType": "suburb",
    "station": {
      "id": "085",
      "name": "Friedrichshagen",
      "location": {
        "lat": 52.447697,
        "lng": 13.64705
      }
    }
  }, {
    "measurementType": "background",
    "station": {
      "id": "018",
      "name": "Schöneberg",
      "location": {
        "lat": 52.485814,
        "lng": 13.348775
      }
    }
  }, {
    "measurementType": "suburb",
    "station": {
      "id": "145",
      "name": "Frohnau",
      "location": {
        "lat": 52.653269,
        "lng": 13.296081
      }
    }
  }]
}

measurepoints.array.forEach(function(e) {
  var coord = [];

  coord.push(e.station.location.lng);
  coord.push(e.station.location.lat);
  var el = document.createElement('div');
  el.className = 'marker';

  // make a marker for each feature and add to the map
  var marker = new mapboxgl.Marker(el).setLngLat(coord).setPopup(new mapboxgl.Popup() // add popups
    .setHTML(e.measurementType + " <br/> ID: " + e.station.id + "<br/> <button id='" + e.station.id + "'>see values here</button>")).addTo(map);
});

function setLocPoint(latlong) {
  var locdiv = document.createElement('div');
  locdiv.className = 'locdiv';
  var locpoint = new mapboxgl.Marker(locdiv).setLngLat(latlong).addTo(map);;

}

function degToWord(deg) {
  var val = Math.round(((deg / 22.5) + 0.5))% 16;
  var arr = ["W","WNW","NW","NNW","N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW"]
  var res = arr[val];
  return res;
}



function getWindIcon(deg, id){
  var word = degToWord(deg);
  var svg = word+"<svg class='windicon' viewBox='265 75 152 155' xmlns='http://www.w3.org/2000/svg'><g> <path transform='rotate("+ deg + ", 343, 152)' d='m324.267395,194.902954c-4.415039,-2.386047 -3.835938,-3.830994 6.898499,-17.206268c5.418457,-6.753876 9.854462,-12.476654 9.854462,-12.71701c0,-0.239044 -14.967651,-0.434601 -33.259186,-0.434601l-33.261169,0l0,-12.64856l0,-12.64888l33.522522,0c25.850525,0 33.236084,-0.380249 32.264038,-1.663589c-0.691956,-0.915314 -5.420502,-6.989792 -10.506592,-13.498825c-9.586853,-12.26857 -9.584778,-15.56044 0.014587,-16.580322c4.776733,-0.506546 79.146729,38.489502 81.705444,42.842102c-24.773956,15.539841 -54.385254,31.809464 -81.661499,46.153c-1.438232,0 -3.944672,-0.718384 -5.571106,-1.597046z' stroke-width='8.5' stroke='#000' fill='#000000'/> </g></svg>";
  document.getElementById(id).innerHTML = svg;
}






function timeNow(i) {
  var d = new Date(),
    h = (d.getHours() < 10 ? '0' : '') + d.getHours(),
    m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  i.value = h + ':' + m;
}

// var g1;
// document.addEventListener("DOMContentLoaded", function(event) {
//   var g1 = new JustGage({
//     id: "g1",
//     value: 3,
//     min: 0,
//     max: 6,
//     title: "",
//     hideMinMax: true,
//     gaugeWidthScale: 1.2,
//     titlePosition: "below",
//     titleFontColor: "#000000",
//     titleMinFontSize: 20,
//     relativeGaugeSize: true,
//     levelColors: ["#FFFFFF", "#555555", "#000000"],
//     textRenderer: customValue
//   });
// });

/*function customValue(val) {
  if (val < 2) {
    return 'ok';
  } else if (val < 5) {
    return 'over yearly limit';
  } else if (val >= 5) {
    return 'over daily limit';
  }
};*/


var dataset = [1, 4, 2, 7, 5, 3];
var labels = ["1", "2", "3", "4", "5", "6"];


var ctxJSON = barchart1.getContext('2d');
var configJSON = {
  type: 'bar',
  data: {
    labels: labels,
    datasets: [{
      label: 'blub',
      data: dataset,
      backgroundColor: '#000000'
    }]
  }
};

var chartJSON = new Chart(ctxJSON, configJSON);



function getWeekdays() {
  var i;
  for (i = 1; i < 6; i++) {
    var day = "day" + i;
    var paragraph = document.getElementById(day);
    paragraph.textContent += getDayName(i);
  }
};

function getDayName(i) {
  switch ((new Date().getDay() + i) % 7) {
    case 0:
      day = "Sun";
      break;
    case 1:
      day = "Mon";
      break;
    case 2:
      day = "Tue";
      break;
    case 3:
      day = "Wed";
      break;
    case 4:
      day = "Thu";
      break;
    case 5:
      day = "Fri";
      break;
    case 6:
      day = "Sat";
  }
  return day;
};

getWeekdays();




function makeGauge(id, value, color, width) {
  if (color == "#888"){
    var gauge = new RadialGauge({
      renderTo: id,
      width: width,
      height: width,
      value: value,
      minValue: 0,
      startAngle: 90,
      ticksAngle: 180,
      valueBox: false,
      maxValue: 180,
      majorTicks: [
        "",
        "",
        "",
        "",
        "",
        "",
        ""

      ],
      minorTicks: 1,
      strokeTicks: true,
      highlights: [{
          "from": 60,
          "to": 120,
          "color": '#BBB'
        },
        {
          "from": 120,
          "to": 180,
          "color": '#555'
        }
      ],
      colorPlate: 'Transparent',
      colorNumbers: '#888',
      borderShadowWidth: 0,
      borders: false,
      colorNeedle: color,
      colorNeedleEnd: color,
      needleShadow: false,
      needleType: "line",
      needleWidth: 7,
      needleCircleSize: 5,
      needleCircleOuter: false,
      needleCircleInner: false,
      needleStart: 0,
      needleEnd: 100,
      animationDuration: 1500,
      animationRule: "linear"
    }).draw();
  } else {
    var gauge = new RadialGauge({
      renderTo: id,
      width: width,
      height: width,
      value: value,
      minValue: 0,
      startAngle: 90,
      ticksAngle: 180,
      valueBox: false,
      maxValue: 180,
      majorTicks: [
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      ],
      highlights: [{
          "from": 60,
          "to": 120,
          "color": 'Transparent'
        },
        {
          "from": 120,
          "to": 180,
          "color": 'Transparent'
        }
      ],
      minorTicks: 1,
      strokeTicks: true,
      colorPlate: 'Transparent',
      colorNumbers: 'Transparent',
      colorStrokeTicks: 'Transparent',
      colorMinorTicks: 'Transparent',
      borderShadowWidth: 0,
      borders: false,
      colorNeedle: color,
      colorNeedleEnd: color,
      needleShadow: false,
      needleType: "line",
      needleWidth: 7,
      needleCircleSize: 5,
      needleCircleOuter: false,
      needleCircleInner: false,
      needleStart: 0,
      needleEnd: 100,
      animationDuration: 1500,
      animationRule: "linear"
    }).draw();
  }

}


makeGauge("background", (2 * 30) - 17, "#888", 300);
makeGauge("traffic", (2 * 30) - 12, "#000", 300);



function fillGauge(idbg, idtr, valuebg, valuetr, size) {
    makeGauge(idbg, (valuebg * 30) - 17, "#888", size);
    makeGauge(idtr, (valuetr * 30) - 12, "#000", size);
}


// fillGauge(g20,g21, 3,4,100);
// fillGauge(g30,g31, 4,4,100);
// fillGauge(g40,g41, 1,2,100);
// fillGauge(g50,g51, 2,2,100);

function changeDays(data, timeID){
  if (timeID == 9){
    var bg = "g10";
    var tr = "g11";
    var temp = "temp1";
    var icon = "icon1";
    var wind = "wind1";
  }
  if (timeID == 15){
    var bg = "g20";
    var tr = "g21";
    var temp = "temp2";
    var icon = "icon2";
    var wind = "wind2";
  }
  if (timeID == 23){
    var bg = "g30";
    var tr = "g31";
    var temp = "temp3";
    var icon = "icon3";
    var wind = "wind3";
  }
  if (timeID == 31){
    var bg = "g40";
    var tr = "g41";
    var temp = "temp4";
    var icon = "icon4";
    var wind = "wind4";
  }
  if (timeID == 39){
    var bg = "g50";
    var tr = "g51";
    var temp = "temp5";
    var icon = "icon5";
    var wind = "wind5";
  } else {

  }

  fillGauge(bg,tr, data[0],data[1],110);
  document.getElementById(icon).src = data[4];
  document.getElementById(temp).innerHTML = data[3] + "°";
  //+" <br>"+ data[2] + "°"
  getWindIcon(data[5], wind);
}


function change3hour(data){
  fillGauge("background", "traffic", data[0], data[1], 300);
  document.getElementById("weatherIconNow").src = data[4];
  document.getElementById("temp-min").innerHTML = data[3] + "°";
  document.getElementById("temp-max").innerHTML = data[2] + "°";
  getWindIcon(data[5], "windWrap");
}

function showResult(){
  fillGauge("mlbg", "mltr", 2,3,300);
}
