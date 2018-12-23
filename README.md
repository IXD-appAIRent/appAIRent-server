# appAIRent-server
This is our appAIRent backend application built with Spring Boot

You need to put an api.config file into the src/main/resources folder. 
It needs an `owmApiKey = <key>` entry with a functioning OpenWeatherMap API key.

##  HTTP Endpoints

### Current Weather

```localhost:8080/weather/current```

Result: OpenWeatherMap current weather Json
 
### Weather Forecast

Note: momentarily only hourly forecasts because of OpenWeatherMap restrictions

`localhost:8080/weather/forecast/hourly`

Result: OpenWeatherMap hourly weather forecast Json

### Current Pollution

Returns the current pollution data. 
It can be filtered and there is the possibility to directly get a mean value for
 each pollutant.

`localhost:8080/pollution/current`

optional parameters:

- `type`: list of values. possible is `traffic, background and suburb`
  - filters by station type
  - default is no filter
  - example: `localhost:8080/pollution/current?type=traffic,background`  
  returns values from traffic and background stations 
- `mean`: boolean
  - when set to `true` returns one mean value for every pollutant. Calculated from all data.
  - can and should be used with the `type` filter
  - default value `false`
  - example: `localhost:8080/pollution/current?type=traffic,background&mean=true`

### Pollution Forecast

Provides a pollution forecast

`localhost:8080/pollution/forecast/hourly`

Results in a json, for example:
```json
[
  { "time": 1545598800000, "level":2 },
  { "time":1545609600000,"level":1 },
  ...
]
```

`time` is the milliseconds till epoch  
`level` is the pollution level from 0 to 2


### Pollution Values from nearest Station 

Returns only values from the nearest station.

`localhost:8080/pollution/nearest`

 mandatory paramters:
 
 - `lat`: double which represents latitude of position which nearest is measured against
 - `lng`: double which represents longitude of position which nearest is measured against