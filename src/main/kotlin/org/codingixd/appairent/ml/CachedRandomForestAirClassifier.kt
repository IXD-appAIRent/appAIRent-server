package org.codingixd.appairent.ml

import java.time.LocalDateTime

class CachedRandomForestAirClassifier : AirClassifier {

    private val airClassifier: AirClassifier = RandomForestAirClassifier()
    private val cache = linkedMapOf<Key, Int>()

    override fun getClassification(
        mode: AirClassifier.PredictionMode,
        dateTime: LocalDateTime,
        temp: Double,
        temp_min: Double,
        temp_max: Double,
        pressure: Double,
        humidity: Double,
        wind_speed: Double,
        wind_deg: Double,
        clouds_all: Double
    ): Int {
        // trim cache
        while (cache.size > 10000) {
            cache.values.remove(0)
        }

        val key = Key(mode, dateTime, temp, temp_min, temp_max, pressure, humidity, wind_speed, wind_deg, clouds_all)

        if (!cache.containsKey(key)) {
            cache[key] = airClassifier.getClassification(mode,dateTime, temp, temp_min, temp_max, pressure,
                humidity, wind_speed, wind_deg, clouds_all)
        }

        return cache[key]!!
    }

    private data class Key(val mode: AirClassifier.PredictionMode,
                   val dateTime: LocalDateTime,
                   val temp: Double,
                   val temp_min: Double,
                   val temp_max: Double,
                   val pressure: Double,
                   val humidity: Double,
                   val wind_speed: Double,
                   val wind_deg: Double,
                   val clouds_all: Double)

}