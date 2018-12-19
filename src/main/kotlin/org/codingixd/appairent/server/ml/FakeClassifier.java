package org.codingixd.appairent.server.ml;

import java.time.LocalDateTime;

public class FakeClassifier implements Classifier {

    @Override
    public int getClassification(
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
        return (int) (Math.random() * 3);
    }

}
