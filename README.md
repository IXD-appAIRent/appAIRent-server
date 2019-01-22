# appAIRent-server
This is our appAIRent backend application built with Spring Boot

You need to put an api.config file into the src/main/resources folder. 
It needs an `owmApiKey = <key>` entry with a functioning OpenWeatherMap API key.

##  HTTP Endpoints

### Current Weather

```localhost:8080/weather/current```

Result: OpenWeatherMap current weather Json
 
### Weather Forecast

Note: momentarily only 3-hourly forecasts because of OpenWeatherMap restrictions

`localhost:8080/weather/forecast/hourly`

Result: OpenWeatherMap 3-hourly weather forecast Json

### Current Pollution Data from all Station

Returns the current pollution data. 
It can be filtered and there is the possibility to directly get a mean value for
 each pollutant.

`localhost:8080/stations/all`

optional parameters:

- `type`: list of values. possible is `traffic, background and suburb`
  - filters by station type
  - default is no filter
  - example: `localhost:8080/stations/all?type=traffic,background`  
  returns values from traffic and background stations 
- `mean`: boolean
  - when set to `true` returns one mean value for every pollutant. Calculated from all data.
  - can and should be used with the `type` filter
  - default value `false`
  - example: `localhost:8080/stations/all?type=traffic,background&mean=true`

### Pollution Values from nearest Station 

Returns only values from the nearest station.

`localhost:8080/stations/nearest`

 mandatory paramters:
 
 - `lat`: double which represents latitude of position which nearest is measured against
 - `lng`: double which represents longitude of position which nearest is measured against

### LQI 3-Hourly Forecast

Provides a 3-hourly lqi forecast for 24 hours

`localhost:8080/index/forecast/hourly`

Results in a json, for example:
```json
[
  { "time": 1545598800000, "level":2 },
  { "time":1545609600000,"level":1 },
  ...
]
```

`time` is the milliseconds till epoch  
`level` is the pollution level from 1 to 6

### LQI Daily Forecast

Provides a daily lqi forecast. The fifth day is calculated out of the available values

`localhost:8080/index/forecast/daily`

Results in a json, for example:
```json
[
  {
    "dayOfWeek": "TUESDAY",
    "traffic": 2,
    "background": 2
  },
  {
    "dayOfWeek": "WEDNESDAY",
    "traffic": 3,
    "background": 2
  },
  {
    "dayOfWeek": "THURSDAY",
    "traffic": 2,
    "background": 2
  },
  {
    "dayOfWeek": "FRIDAY",
    "traffic": 3,
    "background": 3
  },
  {
    "dayOfWeek": "SATURDAY",
    "traffic": 4,
    "background": 4
  }
]
```

### LQI custom forecast

To make a custom ML forecast the following URL can be used:

`localhost:8080/index/forecast/custom`

mandatory parameters:

- pressure: Int
- humidity: Int
- clouds_all: Int
- temp: Double
- temp_min: Double
- temp_max: Double
- wind_speed: Double
- wind_deg: Int
- is_weekend: `true` or `false`
- hour: Int, 0 to 23
- month: Int, 1 (January) to 12 (December)
- prediction_mode: `BACKGROUND` or `TRAFFIC`

Example request:

`http://localhost:8080/index/forecast/custom?pressure=1030&humidity=85&clouds_all=75&temp=280.64&temp_max=281.15&temp_min=280.15&wind_speed=10.1&wind_deg=210&hour=4&is_weekend=true&month=1&prediction_mode=BACKGROUND`
