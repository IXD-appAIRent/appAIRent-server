package org.codingixd.appairent.server

import net.aksingh.owmjapis.model.CurrentWeather
import net.aksingh.owmjapis.model.DailyWeatherForecast
import net.aksingh.owmjapis.model.HourlyWeatherForecast
import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.atomic.AtomicLong


@RestController
class GreetingController {

    val counter = AtomicLong()

    @GetMapping("/weather/current")
    fun currentWeather() = CurrentWeather.toJson(DataSourceBridge.getCurrentWeather())

    @GetMapping("/weather/forecast")
    fun forecastWeather(): String {
        return HourlyWeatherForecast.toJson(DataSourceBridge.getHourlyWeatherForecast())
    }

}

@SpringBootApplication
class Application

fun main(args: Array<String>) {
    SpringApplication.run(Application::class.java, *args)
}