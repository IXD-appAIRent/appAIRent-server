var ipAddress = "192.168.2.53";

// enable wait for results
$.ajaxSetup({
  async: false
});

// On Start functions
createButtonTime();
makeMap();
updateCurrentWeather();
updateWeatherForecastUpcomingDays(0);
updateWeatherForecastUpcomingDays(1);
updateWeatherForecastUpcomingDays(2);
updateWeatherForecastUpcomingDays(3);
updatesNamesOfDaysInForecast();
showResult();

// Fade in of img.
$(document).ready(function(){
  $("#article1").fadeIn(6000);
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

// updates map with pollution values
function makeMap(){
  var map;
  $.getJSON("http://"+ ipAddress+":8080/stations/all", function(arr) {
    mapboxgl.accessToken = 'pk.eyJ1IjoibGlsbGlwaWxsaSIsImEiOiJjanBjc3J3ZmozMG55M3dwaHFpcmFlZDNoIn0.Eh9Spcc3_PNF72jAYeGTmQ';
    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v9',
      minZoom: 8.5,
      maxZoom: 12,
      center: [13.5, 52.52697],
      zoom: 8.5
    });

    arr.forEach(function(e) {
      var coord = [];

      coord.push(e.station.location.lng);
      coord.push(e.station.location.lat);
      var el = document.createElement('div');
      el.className = 'marker';

      // make a marker for each feature and add to the map
      var marker = new mapboxgl.Marker(el).setLngLat(coord).setPopup(new mapboxgl.Popup() // add popups
        .setHTML("type: "+e.measurementType + " <br/> grade: " + e.lqi + "<br/> location: "+ e.station.name)).addTo(map);
    });
  });

  return map;
}

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

      updateLocationPoll(pollData);

      updateOnePopupValue(pollData);
      document.getElementById("address").style.display = "none";
    } else {
      alert("No such address, try again");

    }
  });
}

//Update PopUp based on location
function updateOnePopupValue(data){
  if (data[0] == "background"){
    document.getElementById("valueBGpopup").innerHTML = data[1];
    document.getElementById("valueTRpopup").innerHTML = "no data, nearest station is for background.";
  } else{
    document.getElementById("valueTRpopup").innerHTML = data[1];
    document.getElementById("valueBGpopup").innerHTML = "no data, nearest station is for traffic.";
  }
}

//make 3-hour steps
function createButtonTime(){
  var i;
  for (i = 0; i < 8; i++){
    var first = new Date().getHours();
    var first = first - (first % 3);
    var t = (first +(3*i)) % 24 +":00";
    if (i == 0){
      t = "now";
    }
    var timeid = "time-"+ (i+1);
    document.getElementById(timeid).innerHTML = t +"  ";
  }
}

// Updates current weather and starts pollution forecast
function updateCurrentWeather(){
  $.getJSON("http://"+ ipAddress+":8080/weather/current", function(now) {
      console.log(now); // this will show the info it in firebug console
      document.getElementById("title1").innerHTML = "Berlin";
      document.getElementById("distance").innerHTML = "<br> average values for Berlin";
      var nowdata = update24hPollutionValues(0);

      document.getElementById("divBackgroundimage").style.backgroundImage = "url('icons/"+nowdata[0]+".png')"; //nowdata[1]
      document.getElementById("article1").style.backgroundImage = "url('icons/"+nowdata[0]+".png')";
      nowdata.push(Math.round(now.main.temp_max-273.15));
      nowdata.push(Math.round(now.main.temp_min-273.15));
      nowdata.push(iconConverter(now.weather[0].icon));
      nowdata.push(now.wind.deg);
      nowdata.push(now.wind.speed);
      change3hour(nowdata);
      updateDetailView();
  });
}

// Updates boxes with single pollutants
function updateDetailView(){
  $.getJSON("http://"+ ipAddress+":8080/stations/all?type=traffic,background&mean=true", function(polls) {
    var i;
    var max;
    var x = 0;
    for (i = 0; i < 5; i++) {
    document.getElementById(polls[i].pollutantType+"grade").innerHTML = polls[i].lqi ; //+ " " + polls[i].pollutantType
    document.getElementById(polls[i].pollutantType+"value").innerHTML = Math.round(polls[i].value) + "  	&mu;/m3";
    if(polls[i].lqi > x){
      max = polls[i].pollutantType;
      x = polls[i].lqi;
      }
    }
    document.getElementById(max+"value").innerHTML += "<br> worst";
    document.getElementById(max).style.backgroundColor = "#bbb";
    document.getElementById(max).style.borderColor = "red";
  });

}

/*
  Get weather values for next 24 hours and pushes them into UI
  pushes pollution values to change3hour function
*/
function updateWeatherForecast24Hours(index){
  $.getJSON("http://"+ ipAddress+":8080/weather/forecast/hourly", function(json) {
    if(index < 9){
      var pollBerlin = update24hPollutionValues(index);
      //alert(json.list[index].dt_txt);
      //[pollBerlin[0],pollBerlin[1]
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
  triggers pollution data updating
*/
function updateWeatherForecastUpcomingDays(index){
  $.getJSON("http://"+ ipAddress+":8080/weather/forecast/hourly", function(json) {
    console.log(json);
      var pollDay = updateNextDaysPollutionValues(index);

      var i = getRightIndex(index);
      updateDailyForecast([pollDay[0],pollDay[1], Math.round(json.list[i].main.temp_max-273.15), Math.round(json.list[i].main.temp_min-273.15), iconConverter(json.list[i].weather[0].icon), json.list[i].wind.deg,json.list[i].wind.speed], index);

  });
}

//Updates pollution data for daily forecast
function updateNextDaysPollutionValues(index){
  var array;
  $.getJSON("http://"+ipAddress+":8080/index/forecast/daily", function(json) {
      array = [json[index].background, json[index].traffic];
  });
  return array;
}

//turns 0,1,2,3 into 12:00 that day
function getRightIndex(i){
  var hour = new Date().getHours();

  return 4 + Math.floor((24-hour)/3) + 8*i;
}

// Converts icon code to icon img path
function iconConverter(iconID){
  var icon;
  if( iconID == "01d" || iconID == "01n") {
    icon = "icons/sunny.png";
  }
  if( iconID == "02d" || iconID == "02n") {
    icon = "icons/sun_cloud.png";
  }
  if( iconID == "03d" || iconID == "03n" || iconID == "04d" || iconID == "04n") {
    icon = "icons/cloud.png";
  }
  if( iconID == "50d" || iconID == "50n") {
    icon = "icons/fog.png";
  }
  if( iconID == "09d" || iconID == "09n") {
    icon = "icons/rain.png";
  }
  if (iconID == "10d" || iconID == "10n"){
    icon = "icons/rain_sun_cloud.png"
  }
  if( iconID == "11d" || iconID == "11n") {
    icon = "icons/storm.png";
  }
  if( iconID == "13d" || iconID == "13n") {
    icon = "icons/snow.png";
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

//toggles Map when clicking icon
function toogleMap() {
  var x = document.getElementById("article3");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

//closes map when clicking anywhere
function closeMap() {
  var x = document.getElementById("article3");
  if (x.style.display === "block") {
    x.style.display = "none";
  }
}

// Adds currently choosen location to map
function setLocPoint(latlong) {
  var map = makeMap();
  var locdiv = document.createElement('div');
  locdiv.className = 'locdiv';
  var locpoint = new mapboxgl.Marker(locdiv).setLngLat(latlong).setPopup(new mapboxgl.Popup().setHTML("Your Location")).addTo(map);


}

// Sets arrow which represents direction
function getWindIcon(deg,strength, id){
  var word = Math.round(strength*3.6)+ "kmh";
  var svg2 = word + "<br> <svg class='windicon' version='1.1' id='Capa_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 268.832 268.832' style='enable-background:new 0 0 268.832 268.832;' xml:space='preserve'><g><path transform='rotate("+deg+", 134.416, 134.416)'  d='M265.171,125.577l-80-80c-4.881-4.881-12.797-4.881-17.678,0c-4.882,4.882-4.882,12.796,0,17.678l58.661,58.661H12.5 c-6.903,0-12.5,5.597-12.5,12.5c0,6.902,5.597,12.5,12.5,12.5h213.654l-58.659,58.661c-4.882,4.882-4.882,12.796,0,17.678 c2.44,2.439,5.64,3.661,8.839,3.661s6.398-1.222,8.839-3.661l79.998-80C270.053,138.373,270.053,130.459,265.171,125.577z'/></g></svg>" ;
  document.getElementById(id).innerHTML = svg2;
}

// pushes day-name to ui
function updatesNamesOfDaysInForecast() {
  var i;
  for (i = 1; i < 5; i++) {
    var day = "day" + i;
    var paragraph = document.getElementById(day);
    paragraph.textContent += getDayName(i);
  }
};

//turns date into day-name
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

// updates recommendation text based on pollution grade
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

// Updates daily weather and polltion forecast UI
function updateDailyForecast(data, timeID){
  if (timeID == 0){
    var bg = "g10";
    var tr = "g11";
    var temp = "temp1";
    var icon = "icon1";
    var wind = "wind1";
    var backg = "divDay1";
  }
  if (timeID == 1){
    var bg = "g20";
    var tr = "g21";
    var temp = "temp2";
    var icon = "icon2";
    var wind = "wind2";
    var backg = "divDay2";
  }
  if (timeID == 2){
    var bg = "g30";
    var tr = "g31";
    var temp = "temp3";
    var icon = "icon3";
    var wind = "wind3";
    var backg = "divDay3";
  }
  if (timeID == 3){
    var bg = "g40";
    var tr = "g41";
    var temp = "temp4";
    var icon = "icon4";
    var wind = "wind4";
    var backg = "divDay4";
  }
  else {

  }

  document.getElementById(bg).innerHTML = "<br>B:"+data[0]+"<br>T:"+data[1];
  document.getElementById(tr).src = "icons/traf_"+data[1]+".png";
  if(data[0] < 3){
    document.getElementById(tr).style.backgroundImage = "url('icons/1_2.png')";
  }else if (data[0]< 5){
    document.getElementById(tr).style.backgroundImage = "url('icons/3_4.png')";
  } else {
    document.getElementById(tr).style.backgroundImage = "url('icons/5_6.png')";
  }
  document.getElementById(icon).src = data[4];
  document.getElementById(temp).innerHTML = data[3] + "°C";
  //+" <br>"+ data[2] + "°"
  getWindIcon(data[5],data[6], wind);
  document.getElementById(backg).style.backgroundImage = "url('icons/"+data[1]+"_small.png')";
}

// Updates 24h pollution Forecast UI
function change3hour(data){
  updatePollutionPicture(data[0],data[1]);
  document.getElementById("weatherIconNow").src = data[4];
  document.getElementById("temp-min").innerHTML = data[3] + "°C";
  document.getElementById("temp-max").innerHTML = data[2] + "°C";
  getWindIcon(data[5],data[6], "windWrap");
  updateRecommendationText(data[1]);
  document.getElementById("valueBGpopup").innerHTML =  data[0];
  document.getElementById("valueTRpopup").innerHTML =  data[1];
  document.getElementById("gradeb").innerHTML =  "background: "+data[0];
  document.getElementById("gradet").innerHTML = "traffic: "+data[1];
}

// finds and pushes to UI image for pollution grade
function updatePollutionPicture(valuebg,valuetr){
  document.getElementById("PollutionPicture").innerHTML = "<img id='pollutionIMG' alt='pollution Icon' src='icons/traf_"+valuetr+".png'/>";

  if(valuebg <3){
    document.getElementById("pollutionIMG").style.backgroundImage = "url('icons/1_2.png')";
  }else if (valuebg< 5){
    document.getElementById("pollutionIMG").style.backgroundImage = "url('icons/3_4.png')";
  } else {
    document.getElementById("pollutionIMG").style.backgroundImage = "url('icons/5_6.png')";
  }
}

// updates pollution image if location is defined
function updateLocationPoll(data){
  updateRecommendationText(data[1]);
  if (data[0] == "background"){
    document.getElementById("gradeb").innerHTML =  "background: "+data[1];
    document.getElementById("gradet").innerHTML = " " ;
    if(data[1] <3){
      document.getElementById("pollutionIMG").src = "icons/1_2.png";
    }else if (data[1]< 5){
      document.getElementById("pollutionIMG").src = "icons/3_4.png";
    } else {
      document.getElementById("pollutionIMG").src = "icons/5_6.png";
    }
  } else {
    document.getElementById("gradeb").innerHTML = "";
    document.getElementById("gradet").innerHTML =  "traffic: "+data[1];
    document.getElementById("PollutionPicture").innerHTML = "<img id='pollutionIMG' alt='pollution Icon' src='icons/traf_"+data[1]+".png'/>";
  }
}

// Updates Interface which makes ML approachable
function showResult(choosen_attribute){
  var pressure, humidity, clouds_all// skyML
  var temp, temp_min, temp_max//tempML
  var wind_speed, wind_deg// windML
  var hour, isWeekend// timeML
  var month // seasonML
  var predictionMode // PredictionModeML

  switch (($('#skyML > div.active').index() + (choosen_attribute == 'skyML' ? 1 : 0 ) ) % 4) {
    case 0: pressure=1018; humidity=30; clouds_all=0; // sunny
      break;
    case 1: pressure=1011; humidity=81; clouds_all=100; // cloudy
      break;
    case 2: pressure=1010; humidity=95; clouds_all=100; // rainy
      break;
    case 3: pressure=1006; humidity=75; clouds_all=100; // snowy
      break;
  }

  switch (($('#tempML > div.active').index()+ (choosen_attribute == 'tempML' ? 1 : 0 ))%4) {
    case 0: temp=22+273.15;
      break;
    case 1: temp=30+273.15;
      break;
    case 2: temp=10+273.15;
      break;
    case 3: temp=-4+273.15;
      break;
  }
  temp_min=temp; temp_max=temp;

  switch (($('#windML > div.active').index() + (choosen_attribute == 'windML' ? 1 : 0 ))%4) {
    case 0: wind_speed=1.4; wind_deg=0;
      break;
    case 1: wind_speed=5.5; wind_deg=90;
      break;
    case 2: wind_speed=4.1; wind_deg=180;
      break;
    case 3: wind_speed=2.8; wind_deg=270;
      break;
  }
  switch (($('#timeML > div.active').index() + (choosen_attribute == 'timeML' ? 1 : 0 ))%4) {
    case 0: hour=8; isWeekend="false";
      break;
    case 1: hour=13; isWeekend="false";
      break;
    case 2: hour=23; isWeekend="false";
      break;
    case 3: hour=13; isWeekend="true";
      break;
  }
  switch (( $('#seasonML > div.active').index() + (choosen_attribute == 'seasonML' ? 1 : 0 ))%4) {
    case 0: month=4;
      break;
    case 1: month=7;
      break;
    case 2: month=10;
      break;
    case 3: month=1;
      break;
  }
  switch (($('#PredictionModeML > div.active').index() + (choosen_attribute == 'PredictionModeML' ? 1 : 0 ))%2) {
    case 0: predictionMode="BACKGROUND";
      break;
    case 1: predictionMode="TRAFFIC";
      break;
  }

  var prediction = getPollutionPrediction(pressure, humidity, clouds_all, temp, temp_min, temp_max, wind_speed, wind_deg, hour, isWeekend, month, predictionMode);
  var mode = predictionMode;

  if(predictionMode == "TRAFFIC"){
    document.getElementById("mlbg").src = "icons/traf_"+prediction+".png";
  } else if (predictionMode == "BACKGROUND"){
    if (prediction < 3){
      document.getElementById("mlbg").src = "icons/1_2.png";
    }else if (prediction < 5){
      document.getElementById("mlbg").src = "icons/3_4.png";
    } else if (prediction >= 5) {
      document.getElementById("mlbg").src = "icons/5_6.png";
    }
  }


  document.getElementById("gradeML").innerHTML = prediction;

}

// pushes parameters to ML
function getPollutionPrediction(pressure, humidity, clouds_all, temp, temp_min, temp_max, wind_speed, wind_deg, hour, isWeekend, month, predictionMode){
  var prediction = 0;
  var url = encodeURI("http://" + ipAddress + ":8080/index/forecast/custom?" +
      "pressure=" + pressure +
      "&humidity=" + humidity +
      "&clouds_all=" + clouds_all +
      "&temp=" + temp +
      "&temp_max="+temp_max+
      "&temp_min="+temp_min+
      "&wind_speed=" + wind_speed +
      "&wind_deg=" + wind_deg +
      "&hour=" + hour +
      "&is_weekend=" + isWeekend +
      "&month=" + month +
      "&prediction_mode=" + predictionMode)
  $.getJSON(url, function(data) {
    prediction = data
  });
  return prediction;
}

// gives detailed info for different pollutants
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
