package org.codingixd.appairent.data

import com.github.kittinunf.fuel.httpGet
import com.github.kittinunf.result.Result
import com.javadocmd.simplelatlng.LatLng
import de.jupf.staticlog.Log
import java.io.File
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.*

//fun main(args: Array<String>) {
//    when (val data = SenateData.fetchNewestData()) {
//        is Data.Failure -> data.error.printStackTrace()
//        is Data.PollutantList -> {
//            println(data)
//            println("traffic: "+data.traffic().mean())
//            println("background: "+data.background().mean())
//            println("nearest station data: "+data.nearestStationTo(LatLng(52.467411, 13.339536)))
//        }
//    }
//}

object SenateData {

    fun fetchNewestData(): Data {
        Log.info("Fetching newest data...")

        val now = LocalDateTime.now()
        val date = now.toLocalDate()

        val period = Period.hourly

        val startHour = now.hour - 1
        val endHour = now.hour

        val pollutionList = mutableListOf<PollutantCSVFormat>()

        listOf(PollutantType.PM10, PollutantType.NO2, PollutantType.SO2, PollutantType.CO, PollutantType.O3).forEach { pollutant ->
            listOf(MeasurementType.traffic, MeasurementType.background, MeasurementType.suburb).forEach { type ->

                try {
                    val pollutionData = parsedPollutionCSV(
                        pollutant,
                        type,
                        period,
                        date,
                        startHour,
                        date,
                        endHour
                    )

                    if (pollutionData.timePollutantMap.isEmpty()) {
                        Log.debug("Result for $pollutant in $type for $period on $date from $startHour to $endHour is empty")
                    } else {
                        pollutionList.add(pollutionData)
                    }

                } catch (e: Exception) {
                    return Data.Failure(Exception("Error while retriving data for $pollutant in $type ($period) on $date from $startHour to $endHour", e))
                }


            }
        }

        val pollutantList = mutableListOf<Data.Pollutant>()

        pollutionList.filter { it.pollutantType in usedPollutants }.forEach {
            val newestKey =
                it.timePollutantMap.keys.reduce { acc, localDateTime ->
                    if (acc > localDateTime) acc else localDateTime
                }

            it.timePollutantMap[newestKey]!!.forEachIndexed { index, value ->
                pollutantList.add(
                    Data.Pollutant(
                        it.pollutantType, it.unit, it.measurementType,
                        newestKey.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(), value,
                        calculateIndex(it.pollutantType, value)?.ordinal ?: -1,it.stationList[index]
                    )
                )
            }
        }

        return Data.PollutantList(pollutantList.filter { !it.value.isNaN() })
    }

    private fun parsedPollutionCSV(
        pollutantType: PollutantType,
        measurementType: MeasurementType,
        period: Period,
        startDate: LocalDate,
        startHour: Int,
        endDate: LocalDate,
        endHour: Int
    ): PollutantCSVFormat {

        val csv = getPollutionCSV(
            pollutantType,
            measurementType,
            period,
            startDate,
            startHour,
            endDate,
            endHour,
            false
        )

        val lines = csv.lineSequence()

        val stations = lines.elementAt(0).split(";").drop(1).map {
            it.split(" ").let { stationStr ->
                Station(
                    stationStr[0],
                    stationStr.drop(1).joinToString(separator = " "),
                    idToLocation(stationStr[0])
                )
            }
        }

        val unit = lines.elementAt(2).split(";").getOrNull(1).toUnit()

        val timedValues = linkedMapOf<LocalDateTime, List<Double>>()
        lines.drop(5).forEach { line ->
            line.split(";").let {
                val time = LocalDateTime.parse(it[0], DateTimeFormatter.ofPattern("dd.MM.uuuu mm:kk"))
                val valueList = it.drop(1).map { value ->
                    if (value != "") {
                        value.toDouble()
                    } else {
                        Double.NaN
                    }
                }

                timedValues[time] = valueList
            }
        }

        return PollutantCSVFormat(pollutantType, unit, measurementType, stations, timedValues)
    }

    private fun idToLocation(id: String): GeoLocation {
        return when (id) {
            "010" -> GeoLocation(52.543041, 13.349326)
            "018" -> GeoLocation(52.485814, 13.348775)
            "027" -> GeoLocation(52.398406, 13.368103)
            "032" -> GeoLocation(52.473192, 13.225144)
            "042" -> GeoLocation(52.489439, 13.430856)
            "077" -> GeoLocation(52.644167, 13.483056)
            "085" -> GeoLocation(52.447697, 13.647050)
            "088" -> GeoLocation(52.510200, 13.388529)
            "115" -> GeoLocation(52.506600, 13.332972)
            "117" -> GeoLocation(52.463611, 13.318250)
            "124" -> GeoLocation(52.438056, 13.387500)
            "143" -> GeoLocation(52.467511, 13.441650)
            "145" -> GeoLocation(52.653269, 13.296081)
            "171" -> GeoLocation(52.513606, 13.418833)
            "174" -> GeoLocation(52.514072, 13.469931)
            "220" -> GeoLocation(52.481669, 13.433967)
            "282" -> GeoLocation(52.485296, 13.529504)
            else -> throw RuntimeException("Error while finding location of station. Station with id $id not found.")
        }
    }

    private fun getPollutionCSV(
        pollutantType: PollutantType,
        measurementType: MeasurementType,
        period: Period,
        startDate: LocalDate,
        startHour: Int,
        endDate: LocalDate,
        endHour: Int,
        saveToFile: Boolean
    ): String {

        val formatter = DateTimeFormatter.ofPattern("dd.MM.uuuu")

        val query =
            "https://luftdaten.berlin.de/core/${pollutantType.name.toLowerCase(Locale.ROOT)}.csv?stationgroup=${measurementType.name}&period=${period.param}" +
                    "&timespan=custom&start%5Bdate%5D=${startDate.format(formatter)}&start%5Bhour%5D=$startHour" +
                    "&end%5Bdate%5D=${endDate.format(formatter)}&end%5Bhour%5D=$endHour"
//        println("QUERY: $query")

        val (_, response, result) = query.httpGet().responseString()

        when (result) {
            is Result.Failure -> error(response)
            is Result.Success -> {
                if (saveToFile) {

                    val path =
                        Paths.get("./data/${startDate.year}/${pollutantType}_${measurementType}_${period}_$startDate-${startHour}_$endDate-$endHour.csv")
                    if (!Files.exists(path)) {
                        println("Creating File: ./data/${startDate.year}/${pollutantType}_${measurementType}_${period}_$startDate-${startHour}_$endDate-$endHour.csv")
                        File(path.toUri()).parentFile.mkdirs()
                        Files.createFile(path)
                        val file = path.toFile()
                        file.writeText(result.value)
                    }
                }

                return result.value
            }
        }
    }
}