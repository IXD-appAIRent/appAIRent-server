package org.codingixd.appairent.ml;

import java.time.LocalDateTime;

public class FakeAirClassifier implements AirClassifier {

    @Override
    public int getClassification(
            PredictionMode mode,
            LocalDateTime dateTime,
            double temp,
            double temp_min,
            double temp_max,
            double pressure,
            double humidity,
            double wind_speed,
            double wind_deg,
            double clouds_all
        ) throws MLException {
        return (int) (Math.random() * 6);
    }

}
