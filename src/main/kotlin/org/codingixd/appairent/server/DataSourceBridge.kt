package org.codingixd.appairent.server

import de.jupf.staticonf.StatiConf
import net.aksingh.owmjapis.core.OWM
import net.aksingh.owmjapis.model.CurrentWeather
import net.aksingh.owmjapis.model.HourlyWeatherForecast
import org.codingixd.appairent.data.SenateData

object DataSourceBridge {

    val owmApiKey: String by StatiConf("src/main/resources/api.config")

    private val owm = OWM(owmApiKey)

    private const val berlin = 2950159

    fun getCurrentWeather(): CurrentWeather {
        return owm.currentWeatherByCityId(berlin)
    }

    fun getHourlyWeatherForecast(): HourlyWeatherForecast {
        return owm.hourlyWeatherForecastByCityId(berlin)
    }

    fun getCurrentPollution() = SenateData.fetchNewestData()
}

data class Errors(val errors: List<Error>)

data class Error(val status: String, val title: String, val detail: String)