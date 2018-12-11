package org.codingixd.appairent.server

import net.aksingh.owmjapis.core.OWM
import net.aksingh.owmjapis.model.CurrentWeather
import net.aksingh.owmjapis.model.DailyWeatherForecast
import net.aksingh.owmjapis.model.HourlyWeatherForecast

object DataSourceBridge {

    private val owm = OWM("d62d3d0590770fe7af7314ea122f1a03")

    private const val berlin = 2950159

    fun getCurrentWeather(): CurrentWeather {
        return owm.currentWeatherByCityId(berlin)
    }

    fun getHourlyWeatherForecast(): HourlyWeatherForecast {
        return owm.hourlyWeatherForecastByCityId(berlin)
    }

    fun getDailyWeatherForecast(): DailyWeatherForecast {
        return owm.dailyWeatherForecastByCityId(berlin)
    }


}