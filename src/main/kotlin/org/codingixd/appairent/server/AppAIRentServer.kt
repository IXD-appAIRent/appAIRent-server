package org.codingixd.appairent.server

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.javadocmd.simplelatlng.LatLng
import de.jupf.staticlog.Log
import net.aksingh.owmjapis.model.CurrentWeather
import net.aksingh.owmjapis.model.HourlyWeatherForecast
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
import java.time.LocalDateTime
import java.time.ZoneId


@RestController
class GreetingController {

    private val mapper = jacksonObjectMapper()

    @GetMapping("/weather/current")
    fun currentWeather() = CurrentWeather.toJson(Cache.Weather.current)

    @GetMapping("/weather/forecast/hourly")
    fun forecastWeather(): String {
        return HourlyWeatherForecast.toJson(Cache.Weather.forecast)
    }

    @GetMapping("/pollution/current")
    fun currentPollution(@RequestParam(defaultValue = "traffic,background,suburb") type: Array<String>,
                         @RequestParam(defaultValue = "false") mean: Boolean): String {
        val types = type.map { MeasurementType.valueOf(it) }
        val data = Cache.Pollution.current.pollutantList.filter { types.contains(it.measurementType) }

        return if (mean) {
            mapper.writeValueAsString(data.mean())
        } else {
            mapper.writeValueAsString(data)
        }
    }

    @GetMapping("/pollution/nearest")
    fun valuesFromNearestStation(@RequestParam lat: Double, @RequestParam lng: Double): String {
        val nearestStationValues = Cache.Pollution.current.nearestStationTo(LatLng(lat, lng))

        return when (nearestStationValues) {
            is Data.PollutantList -> mapper.writeValueAsString(nearestStationValues.pollutantList)
            is Data.Failure -> mapper.writeValueAsString(Errors(listOf(Error("500", "Data without station included in set.", ""))))
            else -> mapper.writeValueAsString(Errors(listOf(Error("500", "", ""))))
        }
    }

    @GetMapping("/pollution/forecast/hourly")
    fun hourlyPollutionForecast(): String {
        return mapper.writeValueAsString(Cache.Pollution.hourlyForecast)
    }

}

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

        Cache.Pollution.hourlyForecast = getHourlyPollutionForecast()

        Log.info("Data caching complete!")
    }

    private fun getHourlyPollutionForecast(): List<HourlyPollutionLevel> {
        val forecasts = mutableListOf<HourlyPollutionLevel>()

        val forecast = Cache.Weather.forecast
        if (forecast.hasDataCount() && forecast.hasDataList()) { // everything seems optional....makes the code ugly :/
            for (i in 0 until forecast.dataCount!!) {
                val data = forecast.dataList!![i]!!
                val ldt = LocalDateTime.ofInstant(data.dateTime!!.toInstant(), ZoneId.systemDefault())
                forecasts.add(
                    HourlyPollutionLevel(ldt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(),
                        airClassifier.getClassification(AirClassifier.PredictionMode.TRAFFIC, ldt, data.mainData!!.temp!!, data.mainData!!.tempMin!!,
                            data.mainData!!.tempMax!!, data.mainData!!.pressure!!, data.mainData!!.humidity!!, data.windData!!.speed!!,
                            data.windData!!.degree!!, data.cloudData!!.cloud!!)))
            }

        }

        return forecasts
    }
}

object Cache {
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

//        var dailyForecast = listOf<DailyPollutionLevel>()
//            get() {
//                synchronized(field) {
//                    return field
//                }
//            }
//            set(value) {
//                synchronized(field) {
//                    field = value
//                }
//            }
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