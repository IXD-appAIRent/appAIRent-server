package org.codingixd.appairent.data

import com.javadocmd.simplelatlng.LatLng
import com.javadocmd.simplelatlng.LatLngTool
import com.javadocmd.simplelatlng.util.LengthUnit
import org.codingixd.appairent.server.HourlyPollutionLevel
import java.lang.RuntimeException
import java.time.LocalDateTime

open class Data {
    data class Pollutant(
        val pollutantType: PollutantType,
        val unit: Unit,
        val measurementType: MeasurementType,
        val time: Long,
        val value: Double,
        val lqi: Int,
        val station: Station? = null
    )
    data class PollutantList(val pollutantList: List<Pollutant>): Data()

    class Failure(val error: Exception) : Data()
}

enum class Index {
    UNDEFINED, SEHR_GUT, GUT, BEFRIEDIGEND, AUSREICHEND, SCHLECHT, SEHR_SCHLECHT
}

data class Station(val id: String, val name: String, val location: GeoLocation)

data class GeoLocation(val lat: Double, val lng: Double)

enum class MeasurementType {
    all, traffic, background, suburb
}

data class PollutantCSVFormat(
    val pollutantType: PollutantType,
    val unit: Unit,
    val measurementType: MeasurementType,
    val stationList: List<Station>,
    val timePollutantMap: LinkedHashMap<LocalDateTime, List<Double>>
)

enum class Period(val param: String, val csvName: String) {
    hourly("1h", "Stundenwerte"),
    daily("24h", "Tageswerte"),
    monthly("1m", "Monatswerte"),
    yearly("1y", "Jahreswerte"),
//    daily_glide("24hg", "")
}

//fun String.toPeriod() = Period.values().find { it.csvName == this } ?: throw RuntimeException("Could not parse '$this' to Period.")

enum class PollutantType(val csvName: String) {
    PM10("Feinstaub (PM10)"),
    NO2("Stickstoffdioxid"),
    O3("Ozon"),
    CO("Kohlenstoffmonoxid"), // keine background werte vorhanden
    SO2("Schwefeldioxid"),

    NO("Stickstoffmonoxid"),
    NOX("Stickoxide"),
    CHB("Benzol"),
    CHT("Toluol")
}

val usedPollutants = listOf(
    PollutantType.PM10,
    PollutantType.NO2,
    PollutantType.O3,
    PollutantType.CO,
    PollutantType.SO2
)

enum class Unit(val csvName: String) {
    Undefined(""),
    MicrogramPerCubicMeter("µg/m³"),
    MilligramPerCubicMeter("mg/m³")
}

fun String?.toUnit(): Unit {
    if (this == null) {
        return Unit.Undefined
    }

    return Unit.values().find { it.csvName == this } ?: throw RuntimeException("Could not parse '$this' to Unit")
}

fun String.toPollutant(): PollutantType {
    return PollutantType.values().find { it.csvName == this }
        ?: throw RuntimeException("Could not parse '$this' to PollutantType.")
}

fun Data.PollutantList.traffic(): Data.PollutantList {
    return Data.PollutantList(this.pollutantList.filter { it.measurementType == MeasurementType.traffic })
}

fun Data.PollutantList.background(): Data.PollutantList {
    return Data.PollutantList(this.pollutantList.filter { it.measurementType == MeasurementType.background })
}

fun List<Data.Pollutant>.mean(): List<Data.Pollutant> {
    val pollutantMeans = mutableListOf<Data.Pollutant>()

    this.groupBy { it.pollutantType }.forEach { type, pollutantList ->
        val mean = pollutantList.map { it.value }.sum() / pollutantList.size
        pollutantMeans.add(Data.Pollutant(type, pollutantList.first().unit,
            pollutantList.first().measurementType, pollutantList.first().time,
            mean, calculateIndex(pollutantList.first().pollutantType, mean)?.ordinal ?: -1))
    }

    return pollutantMeans
}

fun Data.PollutantList.nearestStationTo(location: LatLng): Data {
    if (this.pollutantList.any { it.station == null }) {
        return Data.Failure(Exception("Finding nearest station data is impossible because data elements without stations are included."))
    }

    val dataPerLoc = this.pollutantList.groupBy { LatLng(it.station!!.location.lat, it.station.location.lng) }

    println(dataPerLoc.keys.sortedBy { LatLngTool.distance(location, it, LengthUnit.METER) }.map { dataPerLoc[it]!!.first().station })

    val nearestLoc = dataPerLoc.keys.sortedBy { LatLngTool.distance(location, it, LengthUnit.METER) }.first()

    return Data.PollutantList(dataPerLoc[nearestLoc]!!)
}

fun calculateIndex(pollutantType: PollutantType, value: Double): Index? {
    return when (pollutantType) {
        PollutantType.NO2 -> {
            when {
                value in 0.0..25.0 -> Index.SEHR_GUT
                value > 25 && value <= 50 -> Index.GUT
                value > 50 && value <= 100 -> Index.BEFRIEDIGEND
                value > 100 && value <= 200 -> Index.AUSREICHEND
                value > 200 && value <= 500 -> Index.SCHLECHT
                value > 500 -> Index.SEHR_SCHLECHT
                value.isNaN() -> null

                else -> throw RuntimeException("Can't calculate lqi for $pollutantType of value $value")
            }
        }
        PollutantType.SO2 -> {
            when {
                value in 0.0..25.0 -> Index.SEHR_GUT
                value > 25 && value <= 50 -> Index.GUT
                value > 50 && value <= 120 -> Index.BEFRIEDIGEND
                value > 120 && value <= 350 -> Index.AUSREICHEND
                value > 350 && value <= 1000 -> Index.SCHLECHT
                value > 1000 -> Index.SEHR_SCHLECHT
                value.isNaN() -> null

                else -> throw RuntimeException("Can't calculate lqi for $pollutantType of value $value")
            }
        }
        PollutantType.O3 -> {
            when {
                value in 0.0..33.0 -> Index.SEHR_GUT
                value > 33 && value <= 65 -> Index.GUT
                value > 65 && value <= 120 -> Index.BEFRIEDIGEND
                value > 120 && value <= 180 -> Index.AUSREICHEND
                value > 180 && value <= 240 -> Index.SCHLECHT
                value > 240 -> Index.SEHR_SCHLECHT
                value.isNaN() -> null

                else -> throw RuntimeException("Can't calculate lqi for $pollutantType of value $value")
            }
        }
        PollutantType.CO -> {
            when {
                value in 0.0..1.0 -> Index.SEHR_GUT
                value > 1 && value <= 2 -> Index.GUT
                value > 2 && value <= 4 -> Index.BEFRIEDIGEND
                value > 4 && value <= 10 -> Index.AUSREICHEND
                value > 10 && value <= 30 -> Index.SCHLECHT
                value > 30 -> Index.SEHR_SCHLECHT
                value.isNaN() -> null

                else -> throw RuntimeException("Can't calculate lqi for $pollutantType of value $value")
            }
        }
        PollutantType.PM10 -> {
            when {
                value in 0.0..10.0 -> Index.SEHR_GUT
                value > 10 && value <= 20 -> Index.GUT
                value > 20 && value <= 35 -> Index.BEFRIEDIGEND
                value > 35 && value <= 50 -> Index.AUSREICHEND
                value > 50 && value <= 100 -> Index.SCHLECHT
                value > 100 -> Index.SEHR_SCHLECHT
                value.isNaN() -> null

                else -> throw RuntimeException("Can't calculate lqi for $pollutantType of value $value")
            }
        }
        else -> throw RuntimeException("Can't calculate lqi for $pollutantType")
    }
}