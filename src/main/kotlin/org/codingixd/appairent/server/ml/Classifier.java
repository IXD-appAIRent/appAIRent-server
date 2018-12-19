package org.codingixd.appairent.server.ml;

import java.time.LocalDateTime;

public interface Classifier {
    /**
     * Returns classification of given features according to used ml model
     *
     * @param dateTime local time the given features refer to
     * @param temp avg. temperature in Kelvin
     * @param temp_min min. temperature in Kelvin
     * @param temp_max max. temperature in Kelvin
     * @param pressure pressure in hPa
     * @param humidity humidity in percent
     * @param wind_speed speed of wind in meter/sec
     * @param wind_deg wind direction in degrees (meteorological)
     * @param clouds_all cloudiness in percent
     * @return classification of given features according to used ml model
     * @throws MLException thrown if given features could not be classified
     */
    int getClassification(
        LocalDateTime dateTime,
        double temp,
        double temp_min,
        double temp_max,
        double pressure,
        double humidity,
        double wind_speed,
        double wind_deg,
        double clouds_all
    ) throws MLException;
}
