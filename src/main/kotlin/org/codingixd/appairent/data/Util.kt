package org.codingixd.appairent.data

import com.javadocmd.simplelatlng.LatLng
import com.javadocmd.simplelatlng.LatLngTool
import com.javadocmd.simplelatlng.util.LengthUnit
import java.lang.RuntimeException
import java.time.LocalDateTime

open class Data {
    data class Pollutant(
        val pollutantType: PollutantType,
        val unit: Unit,
        val measurementType: MeasurementType,
        val time: Long,
        val value: Double,
        val station: Station? = null
    )
    data class PollutantList(val pollutantList: List<Pollutant>): Data()

    class Failure(val error: Exception) : Data()
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
        pollutantMeans.add(Data.Pollutant(pollutantList.first().pollutantType,pollutantList.first().unit,
            pollutantList.first().measurementType, pollutantList.first().time,
            pollutantList.map { it.value }.sum() / pollutantList.size))
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