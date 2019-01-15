var ipAddress = "192.168.2.53";

// enable wait for results
$.ajaxSetup({
  async: false
});

createForecastButtons();

updateCurrentWeather();

updateWeatherForecastUpcomingDays(0);
updateWeatherForecastUpcomingDays(1);
updateWeatherForecastUpcomingDays(2);
updateWeatherForecastUpcomingDays(3);

updatesNamesOfDaysInForecast();



// Fade in of img.
$(document).ready(function(){
  $("#article1").fadeIn(5000);
});

// Navigation between main pages.

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

// Loads json
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

// Calculates distance between two location points
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

// Calculates distance to nearest Air Quality Station
function getDistNearestStation(lat, lon) {
  var dist;
  StationUrl = encodeURI("http://"+ ipAddress+":8080/stations/nearest?lat=" + lat.trim() + "&lng=" + lon.trim());
  //alert(StationUrl);
  $.getJSON(StationUrl, function getDistance(data) {
    if (data.location.lng !== null) {
      var lonStation = data.location.lng;
      var latStation = data.location.lat;
      dist = distance(lat, lon, latStation, lonStation);
    }
  });
  return dist;
}

// Returns array of current pollution values
function getCurrentPollutionValue(lat, lon) {
  var values = [];
  StationUrl = encodeURI("http://"+ ipAddress+":8080/stations/nearest?lat=" + lat.trim() + "&lng=" + lon.trim());
  $.getJSON(StationUrl, function(data) {
      values = [data.measurementType,data.lqi];
  });
  return values;
}

// Update location and refresh depending values
function updateLocationDependentValues() {

  var input = encodeURIComponent((document.getElementById("addressInput").value));
  var urlMine = "https://nominatim.openstreetmap.org/search/de/berlin/" + input + "?format=json&addressdetails=1&limit=1&polygon_svg=1";

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
      var pollData = getCurrentPollutionValue(lat, lon);
      updateLocationGauge(pollData);
      updateOnePopupValue(pollData);
      document.getElementById("address").style.display = "none";
    } else {
      alert("No such address, try again");

    }
  });
}

function updateOnePopupValue(data){
  if (data[0] == "background"){
    document.getElementById("valueBGpopup").innerHTML = data[1];
    document.getElementById("TRpopup").innerHTML = "";
  } else{
    document.getElementById("valueTRpopup").innerHTML = data[1];
    document.getElementById("BGpopup").innerHTML = "";
  }
}



// Creates buttons for forecast
function createForecastButtons() {
  var first = new Date().getHours();
  var first = first - (first % 3);

  document.getElementById("choice-2").innerHTML += (first+3) % 24;
  document.getElementById("choice-3").innerHTML += (first+6) % 24;
  document.getElementById("choice-4").innerHTML += (first+9) %24;
  document.getElementById("choice-5").innerHTML += (first+12) %24;
  document.getElementById("choice-6").innerHTML += (first+15) %24;
  document.getElementById("choice-7").innerHTML += (first+18) %24;
  document.getElementById("choice-8").innerHTML += (first+21) %24;
  document.getElementById("choice-9").innerHTML += (first+24) %24;
}

// Updates current weather forecast
function updateCurrentWeather(){
  $.getJSON("http://"+ ipAddress+":8080/weather/current", function(now) {
      console.log(now); // this will show the info it in firebug console
      document.getElementById("title1").innerHTML = "Berlin";
      document.getElementById("distance").innerHTML = "<br> average values for Berlin";
      var nowdata = update24hPollutionValues(0);
      document.getElementById("article1").style.backgroundImage = "url('icons/middlepollution.png')";
      nowdata.push(Math.round(now.main.temp_max-273.15));
      nowdata.push(Math.round(now.main.temp_min-273.15));
      nowdata.push(iconConverter(now.weather[0].icon));
      nowdata.push(now.wind.deg);
      nowdata.push(now.wind.speed);
      change3hour(nowdata);
      updateDetailView();
  });
}

function updateDetailView(){
  $.getJSON("http://"+ ipAddress+":8080/stations/all?type=traffic,background&mean=true", function(polls) {
    var i;
    var max;
    var x = 0;
    for (i = 0; i < 5; i++) {
    document.getElementById(polls[i].pollutantType+"grade").innerHTML = polls[i].lqi;
    document.getElementById(polls[i].pollutantType+"value").innerHTML = Math.round(polls[i].value) + "  	&mu;/m3";
    if(polls[i].value > x){
      max = polls[i].pollutantType;
      x = polls[i].value;
    }
  }
  document.getElementById(max).style.backgroundColor = "#bbb";
  document.getElementById(max).style.borderColor = "red";
  });

}

/*
  Get weather values for next 24 hours and pushes them into UI

*/
function updateWeatherForecast24Hours(index){
  $.getJSON("http://"+ ipAddress+":8080/weather/forecast/hourly", function(json) {
    console.log(json);
    if(index < 9){
      //alert(json.list[time].dt_txt);

      var pollBerlin = update24hPollutionValues(index);
      //alert(pollBerlin[0]);
      change3hour([pollBerlin[0],pollBerlin[1], Math.round(json.list[index].main.temp_max-273.15), Math.round(json.list[index].main.temp_min-273.15), iconConverter(json.list[index].weather[0].icon), json.list[index].wind.deg,json.list[index].wind.speed ]);
    }
  });
}

// fetches pollution grades for now and upcoming 24 hours
function update24hPollutionValues(index){
  var array;
  $.getJSON("http://"+ipAddress+":8080/index/forecast/hourly", function(json) {
      array = [json[index].background, json[index].traffic];
  });
  return array;
}

/*
  Get weather values for upcomming days and pushes them into UI

*/
function updateWeatherForecastUpcomingDays(index){
  $.getJSON("http://"+ ipAddress+":8080/weather/forecast/hourly", function(json) {
    console.log(json);
      var pollDay = updateNextDaysPollutionValues(index);
      //alert(pollDay[0]);
      var i = getRightIndex(index);
      updateDailyForecast([pollDay[0],pollDay[1], Math.round(json.list[i].main.temp_max-273.15), Math.round(json.list[i].main.temp_min-273.15), iconConverter(json.list[i].weather[0].icon), json.list[i].wind.deg,json.list[i].wind.speed], index);

  });
}

function updateNextDaysPollutionValues(index){
  var array;
  $.getJSON("http://"+ipAddress+":8080/index/forecast/daily", function(json) {
      array = [json[index].background, json[index].traffic];
  });
  return array;
}

function getRightIndex(i){
  var hour = new Date().getHours();

  return 4 + Math.floor((24-hour)/3) + 8*i;
}


function fakePollution(){
  return Math.floor(Math.random() * 6)+1;
}

// Converts icon code to icon img path
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



// Toggles interface to set current location
function toogleAddressInterface() {
  var x = document.getElementById("address");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

// START INITIALISATION OF MAPBOX
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
// END INITIALISATION OF MAPBOX

// Adds currently choosen location to map
function setLocPoint(latlong) {
  var locdiv = document.createElement('div');
  locdiv.className = 'locdiv';
  var locpoint = new mapboxgl.Marker(locdiv).setLngLat(latlong).addTo(map);;

}

// Maps degree of wind direction to Compass direction.
function degToWord(deg) {
  var val = Math.round(((deg / 22.5) + 0.5))% 16;
  var arr = ["W","WNW","NW","NNW","N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW"]
  var res = arr[val];
  return res;
}

// Sets arrow which represents direction
function getWindIcon(deg,strength, id){
  var word = Math.round(strength*3.6)+ "kmh";
  var svg = word+"<svg class='windicon' viewBox='265 75 152 155' xmlns='http://www.w3.org/2000/svg'><g> <path transform='rotate("+ deg + ", 343, 152)' d='m324.267395,194.902954c-4.415039,-2.386047 -3.835938,-3.830994 6.898499,-17.206268c5.418457,-6.753876 9.854462,-12.476654 9.854462,-12.71701c0,-0.239044 -14.967651,-0.434601 -33.259186,-0.434601l-33.261169,0l0,-12.64856l0,-12.64888l33.522522,0c25.850525,0 33.236084,-0.380249 32.264038,-1.663589c-0.691956,-0.915314 -5.420502,-6.989792 -10.506592,-13.498825c-9.586853,-12.26857 -9.584778,-15.56044 0.014587,-16.580322c4.776733,-0.506546 79.146729,38.489502 81.705444,42.842102c-24.773956,15.539841 -54.385254,31.809464 -81.661499,46.153c-1.438232,0 -3.944672,-0.718384 -5.571106,-1.597046z' stroke-width='8.5' stroke='#000' fill='#000000'/> </g></svg>";
  document.getElementById(id).innerHTML = svg;
}





function updatesNamesOfDaysInForecast() {
  var i;
  for (i = 1; i < 5; i++) {
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


function makeGauge(id, value, color, width, pointer) {
  // #888 = BACKGROUND
  if (color == "#888" && pointer !== false){
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
      majorTicks: ["", "", "", "", "", "", ""],
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
    return gauge;
  }
  // TRAFFIC
  else if (pointer !== false) {
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
  else {
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
      majorTicks: ["", "", "", "", "", "", ""],
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
      needle: false,
      animationDuration: 1500,
      animationRule: "linear"
    }).draw();
  }

}

function updateRecommendationText(grade){
  var text;
  if (grade == 1){
    text = "1 - good <br> enjoy cycling and outdoor activities in the city!";
  }
  else if (grade == 2){
    text = "2 - moderate <br> enjoy cycling and outdoor activities in the city!";
  }
  else if (grade == 3){
    text = "3 - unhealthy for sensitive groups <br> if possible, avoid cycling during rush hour and on high-traffic roads. if you do need to cycle on main roads: try to ensure you're cycling at a steady pace, not too fast or slow (fast, uphill or hard cycling increases pollution intake further).";
  }
  else if (grade == 4){
    text = "4 - unhealthy <br> if possible, avoid cycling during rush hour and on high-traffic roads. if you do need to cycle on main roads: try to ensure you're cycling at a steady pace, not too fast or slow (fast, uphill or hard cycling increases pollution intake further).";
  }
  else if (grade == 5){
    text = "5 - very unhealthy <br> if possible, avoid cycling during rush hour and on high-traffic roads. if you start to feel respiratory discomfort (eg. coughing or breathing difficulties), reduce cycling intensity eg. try to find an alternative route using our pollution map. if you do need to cycle on main roads: try to cycle at a steady pace, not too fast or slow (fast, uphill or hard cycling increases pollution intake further).";
  }
  else {
    text = "6 - hazardous <br> if possible, avoid cycling during rush hour and on high-traffic roads. if you start to feel respiratory discomfort (eg. coughing or breathing difficulties), reduce cycling intensity eg. try to find an alternative route using our pollution map. if you do need to cycle on main roads: try to cycle at a steady pace, not too fast or slow (fast, uphill or hard cycling increases pollution intake further).";
  }
  document.getElementById("recommendationText").innerHTML = text;
  if(grade <= 2){
    document.getElementById("rec1").style.display = "block";
    document.getElementById("rec2").style.display = "none";
    document.getElementById("rec3").style.display = "none";
  }
  else if(grade <= 4){
    document.getElementById("rec1").style.display = "none";
    document.getElementById("rec2").style.display = "block";
    document.getElementById("rec3").style.display = "none";
  } else {
    document.getElementById("rec1").style.display = "none";
    document.getElementById("rec2").style.display = "none";
    document.getElementById("rec3").style.display = "block";
  }
}

function fillGauge(idbg, idtr, valuebg, valuetr, size) {
  if (idbg !== undefined){
    makeGauge(idbg, (valuebg * 30) - 17, "#888", size);
  }
  if (idtr !== undefined){
    makeGauge(idtr, (valuetr * 30) - 12, "#000", size);
  }
}

// Updates daily weather and polltion forecast
function updateDailyForecast(data, timeID){
  if (timeID == 0){
    var bg = "g10";
    var tr = "g11";
    var temp = "temp1";
    var icon = "icon1";
    var wind = "wind1";
  }
  if (timeID == 1){
    var bg = "g20";
    var tr = "g21";
    var temp = "temp2";
    var icon = "icon2";
    var wind = "wind2";
  }
  if (timeID == 2){
    var bg = "g30";
    var tr = "g31";
    var temp = "temp3";
    var icon = "icon3";
    var wind = "wind3";
  }
  if (timeID == 3){
    var bg = "g40";
    var tr = "g41";
    var temp = "temp4";
    var icon = "icon4";
    var wind = "wind4";
  }
  if (timeID == 4){
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
  getWindIcon(data[5],data[6], wind);
}

// Updates 24h Forecast
function change3hour(data){
  fillGauge("background", "traffic", data[0], data[1], 300);
  document.getElementById("weatherIconNow").src = data[4];
  document.getElementById("temp-min").innerHTML = data[3] + "°";
  document.getElementById("temp-max").innerHTML = data[2] + "°";
  getWindIcon(data[5],data[6], "windWrap");
  updateRecommendationText(data[1]);
  document.getElementById("valueBGpopup").innerHTML = data[0];
  document.getElementById("valueTRpopup").innerHTML = data[1];

}

function updateLocationGauge(data){
  updateRecommendationText(data[1]);
  if (data[0] == "background"){
    makeGauge("traffic", (data[1] * 30) - 12, "#000", 300,false);
    makeGauge("background", (data[1] * 30) - 17, "#888", 300);
  } else {
    makeGauge("background", (data[1] * 30) - 17, "#888", 300, false);
    makeGauge("traffic", (data[1] * 30) - 12, "#000", 300);
  }
}

// Updates Interface which makes ML approachable
function showResult(){
  var gauge;
	gauge = makeGauge("mlbg", (fakePollution() * 30) - 17 ,"#888",300);

}

function detailedInfo(index){
  if (index == 0){
    document.getElementById("detailed").innerHTML = "PM10 <br> inhalable particulate matter <10µm) <br> main sources are combustion processes (eg. indoor heating, wildfires), mechanical processes (eg. construction, mineral dust, agriculture) and biological particles (eg. pollen, bacteria, mold). <br> inhalable particles can penetrate into the lungs. short term exposure can cause irritation of the airways, coughing, and aggravation of heart and lung diseases, expressed as difficulty reaching, heart attacks and even premature death. ";
  }
  else if (index == 1){
    document.getElementById("detailed").innerHTML = "NO2 <br> nitrogen dioxide <br> main sources are fuel burning processes, such as those used in industry and transportation. exposure may cause increased bronchial reactivity in patients with COPD, and increased risk of respiratory infections, especially in young children";
  }
  else if (index == 2){
    document.getElementById("detailed").innerHTML = "SO2 <br> sulfur dioxide <br> main sources are burning processes of sulfur-containing fuel in industry, transportation and power plants. exposure causes irritation of the respiratory tract, coughing and generates local inflammatory reactions. there in turn, may cause aggravation of lung diseases, even with short term exposure. ";
  }
  else if (index == 3){
    document.getElementById("detailed").innerHTML = "CO <br> carbon monoxide <br> typically originates from the incomplete combustion of carbon fuels, such as that which occurs in car engines and power plants when inhaled carbon monoxide can prevent the blood from carrying oxygen. exposure may cause dizziness, nausea and headaches. exposure to extreme concentrations lead to loss of consciousness.";
  }
  else if (index == 4){
    document.getElementById("detailed").innerHTML = "O3 <br> ozone <br> is created in a chemical reaction between atmospheric oxygen, nitrogen oxides, carbon monoxide and organise compounds (VOC), in the precedes of sunlight. ozone can irritate the airways and cause coughing, a burning sensation, wheezing and shortness of breath. additionally ozone is one of the major components of photochemical smog.";
  } else {}
}
