package org.codingixd.appairent.server

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.javadocmd.simplelatlng.LatLng
import de.jupf.staticlog.Log
import net.aksingh.owmjapis.model.CurrentWeather
import net.aksingh.owmjapis.model.HourlyWeatherForecast
import net.aksingh.owmjapis.model.param.WeatherData
import org.codingixd.appairent.data.*
import org.codingixd.appairent.ml.AirClassifier
import org.codingixd.appairent.ml.RandomForestAirClassifier
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.math.round


@RestController
class GreetingController {

    private val mapper = jacksonObjectMapper()

    @GetMapping("/weather/current", produces = ["application/json"])
    fun currentWeather() = CurrentWeather.toJson(Cache.Weather.current)

    @GetMapping("/weather/forecast/hourly", produces = ["application/json"])
    fun forecastWeatherHourly(): String {
        return HourlyWeatherForecast.toJson(Cache.Weather.forecast)
    }

//    @GetMapping("/weather/forecast/daily", produces = ["application/json"])
//    fun forecastWeatherDaily(): String {
//        val forecasts = mutableListOf<WeatherData>()
//
//        val forecast = Cache.Weather.forecast
//        if (forecast.hasDataCount() && forecast.hasDataList()) { // everything seems optional....makes the code ugly :/
//            for (i in 0 until forecast.dataCount!!) {
//                forecasts.add(forecast.dataList!![i]!!)
//            }
//        }
//
//        val dailyHourForecasts = forecasts.groupBy { LocalDateTime.ofInstant(it.dateTime!!.toInstant(), ZoneId.systemDefault()).dayOfMonth }.toSortedMap()
//
//        LocalDateTime.now().dayOfMonth
//
//        dailyHourForecasts.forEach { dayOfMonth, hourlyForecast ->
//
//        }
//
//        return HourlyWeatherForecast.toJson(Cache.Weather.forecast)
//    }

    data class Index(val traffic: Int, val background: Int)

    @GetMapping("/stations/all", produces = ["application/json"])
    fun allStations(
        @RequestParam(defaultValue = "traffic,background,suburb") type: Array<String>,
        @RequestParam(defaultValue = "false") mean: Boolean
    ): String {
        val types = type.map { MeasurementType.valueOf(it) }
        val data = Cache.Pollution.current.pollutantList.filter { types.contains(it.measurementType) }

        return if (mean) {
            mapper.writeValueAsString(data.mean())
        } else {
            mapper.writeValueAsString(data)
        }
    }

    @GetMapping("/stations/nearest", produces = ["application/json"])
    fun valuesFromNearestStation(@RequestParam lat: Double, @RequestParam lng: Double): String {
        val nearestStationValues = Cache.Pollution.current.nearestStationTo(LatLng(lat, lng))

        return when (nearestStationValues) {
            is Data.PollutantList -> {
                val data = nearestStationValues.pollutantList

                val stationData = StationData(
                    data[0].station!!.id, data[0].station!!.name, data[0].station!!.location,
                    data[0].measurementType, data.map { it.lqi }.max()!!, data
                )

                mapper.writeValueAsString(stationData)
            }
            is Data.Failure -> mapper.writeValueAsString(
                Errors(
                    listOf(
                        Error(
                            "500",
                            "Data without station included in set.",
                            ""
                        )
                    )
                )
            )
            else -> mapper.writeValueAsString(Errors(listOf(Error("500", "", ""))))
        }
    }

    @GetMapping("/index/current", produces = ["application/json"])
    fun currentIndex(): String {
        val data = Cache.Pollution.current.pollutantList

        val trafficIndices =
            data.filter { it.measurementType == MeasurementType.traffic }.mean().map { it.lqi }
        val backgroundIndices =
            data.filter { it.measurementType == MeasurementType.background }.mean().map { it.lqi }

        return mapper.writeValueAsString(Index(trafficIndices.max()!!, backgroundIndices.max()!!))
    }

    @GetMapping("/index/forecast/hourly", produces = ["application/json"])
    fun hourlyIndexForecast(): String {
        val hourlyForecast = mutableListOf<IndexHourlyForecast>()
        for (i in 0..7) {
            hourlyForecast.add(
                IndexHourlyForecast(
                    Cache.LQI.Traffic.hourlyForecast[i].time,
                    Cache.LQI.Traffic.hourlyForecast[i].level,
                    Cache.LQI.Background.hourlyForecast[i].level
                )
            )
        }

        return mapper.writeValueAsString(hourlyForecast)
    }

    @GetMapping("/index/forecast/daily", produces = ["application/json"])
    fun dailyIndexForecast(): String {
        val dailyIndexForecasts = mutableListOf<IndexDailyForecast>()

        val currentDayOfMonth = LocalDateTime.now().dayOfMonth

        val forecastsPerDayTraffic = Cache.LQI.Traffic.hourlyForecast.groupBy {
            LocalDateTime.ofInstant(
                Instant.ofEpochMilli(it.time),
                ZoneId.systemDefault()
            ).dayOfMonth
        }.toSortedMap()
        val forecastsPerDayBackground = Cache.LQI.Background.hourlyForecast.groupBy {
            LocalDateTime.ofInstant(
                Instant.ofEpochMilli(it.time),
                ZoneId.systemDefault()
            ).dayOfMonth
        }.toSortedMap()

        forecastsPerDayTraffic.remove(currentDayOfMonth)
        forecastsPerDayBackground.remove(currentDayOfMonth)

        val traffic = forecastsPerDayTraffic.values
        val background = forecastsPerDayBackground.values

        val trafficDailyVals = mutableListOf<Pair<DayOfWeek, Int>>()
        for (hourlyVal in traffic) {
            trafficDailyVals.add(
                Pair(
                    LocalDateTime.ofInstant(
                        Instant.ofEpochMilli(hourlyVal.first().time),
                        ZoneId.systemDefault()
                    ).dayOfWeek,
                    (hourlyVal.map { it.level }.max()!!)
                )
            )
        }

        val backgroundDailyVals = mutableListOf<Pair<DayOfWeek, Int>>()
        for (hourlyVal in background) {
            backgroundDailyVals.add(
                Pair(
                    LocalDateTime.ofInstant(
                        Instant.ofEpochMilli(hourlyVal.first().time),
                        ZoneId.systemDefault()
                    ).dayOfWeek,
                    (hourlyVal.map { it.level }.max()!!)
                )
            )
        }

        for (i in trafficDailyVals.indices) {
            dailyIndexForecasts.add(
                IndexDailyForecast(
                    trafficDailyVals[i].first,
                    trafficDailyVals[i].second,
                    backgroundDailyVals[i].second
                )
            )
        }

        return mapper.writeValueAsString(dailyIndexForecasts)
    }
}

data class StationData(
    val id: String, val name: String, val location: GeoLocation,
    val measurementType: MeasurementType, val lqi: Int, val pollutants: List<Data.Pollutant>
)

data class IndexHourlyForecast(val time: Long, val traffic: Int, val background: Int)
data class IndexDailyForecast(val dayOfWeek: DayOfWeek, val traffic: Int, val background: Int)

@SpringBootApplication
@EnableScheduling
class Application

fun main(args: Array<String>) {
    SpringApplication.run(Application::class.java, *args)
}

@Component
class ScheduledTasks {

    val airClassifier: AirClassifier = RandomForestAirClassifier()

    @Scheduled(fixedRate = 60000)
    fun fetchCurrentData() {
        when (val data = DataSourceBridge.getCurrentPollution()) {
            is Data.PollutantList -> {
                Cache.Pollution.current = data
            }
            is Data.Failure -> throw data.error
            else -> throw Exception("logic error")
        }

        Cache.Weather.current = DataSourceBridge.getCurrentWeather()
        Cache.Weather.forecast = DataSourceBridge.getHourlyWeatherForecast()

        Cache.LQI.Background.hourlyForecast = getHourlyPollutionForecast(AirClassifier.PredictionMode.BACKGROUND)
        Cache.LQI.Traffic.hourlyForecast = getHourlyPollutionForecast(AirClassifier.PredictionMode.TRAFFIC)

        Log.info("Data caching complete!")
    }

    private fun getHourlyPollutionForecast(predictionMode: AirClassifier.PredictionMode): List<HourlyPollutionLevel> {
        val forecasts = mutableListOf<HourlyPollutionLevel>()

        val forecast = Cache.Weather.forecast
        if (forecast.hasDataCount() && forecast.hasDataList()) { // everything seems optional....makes the code ugly :/
            for (i in 0 until forecast.dataCount!!) {
                val data = forecast.dataList!![i]!!
                val ldt = LocalDateTime.ofInstant(data.dateTime!!.toInstant(), ZoneId.systemDefault())
                forecasts.add(
                    HourlyPollutionLevel(
                        ldt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(),
                        airClassifier.getClassification(
                            predictionMode,
                            ldt,
                            data.mainData!!.temp!!,
                            data.mainData!!.tempMin!!,
                            data.mainData!!.tempMax!!,
                            data.mainData!!.pressure!!,
                            data.mainData!!.humidity!!,
                            data.windData!!.speed!!,
                            data.windData!!.degree!!,
                            data.cloudData!!.cloud!!
                        )
                    )
                )
            }

        }

        return forecasts
    }
}

object Cache {
    object LQI {
        object Traffic {
            var hourlyForecast = listOf<HourlyPollutionLevel>()
                get() {
                    synchronized(field) {
                        return field
                    }
                }
                set(value) {
                    synchronized(field) {
                        field = value
                    }
                }
        }

        object Background {
            var hourlyForecast = listOf<HourlyPollutionLevel>()
                get() {
                    synchronized(field) {
                        return field
                    }
                }
                set(value) {
                    synchronized(field) {
                        field = value
                    }
                }
        }
    }

    object Pollution {
        var current = Data.PollutantList(listOf())
            get() {
                synchronized(field) {
                    return field
                }
            }
            set(value) {
                synchronized(field) {
                    field = value
                }
            }
    }

    object Weather {

        var current = CurrentWeather()
            get() {
                synchronized(field) {
                    return field
                }
            }
            set(value) {
                synchronized(field) {
                    field = value
                }
            }

        var forecast = HourlyWeatherForecast()
            get() {
                synchronized(field) {
                    return field
                }
            }
            set(value) {
                synchronized(field) {
                    field = value
                }
            }
    }
}

data class HourlyPollutionLevel(val time: Long, val level: Int)
//data class DailyPollutionLevel(val date: LocalDate, val level: Int)