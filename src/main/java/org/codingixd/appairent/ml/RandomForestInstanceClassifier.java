package org.codingixd.appairent.ml;

import java.util.ArrayList;
import weka.classifiers.Classifier;
import weka.classifiers.trees.RandomForest;
import weka.core.Attribute;
import weka.core.DenseInstance;
import weka.core.Instances;
import weka.core.SerializationHelper;

class RandomForestInstanceClassifier {

    private ArrayList<String> classVal;
    private Instances dataRaw;


    RandomForestInstanceClassifier() {
        ArrayList<Attribute> attributes = new ArrayList<>();
        attributes.add(new Attribute("hour"));
        attributes.add(new Attribute("weekend"));
        attributes.add(new Attribute("month"));
        attributes.add(new Attribute("temp"));
        attributes.add(new Attribute("temp_min"));
        attributes.add(new Attribute("temp_max"));
        attributes.add(new Attribute("pressure"));
        attributes.add(new Attribute("humidity"));
        attributes.add(new Attribute("wind_speed"));
        attributes.add(new Attribute("wind_deg"));
        attributes.add(new Attribute("clouds_all"));

        classVal = new ArrayList<>();
        classVal.add("1");
        classVal.add("2");
        classVal.add("3");
        classVal.add("4");
        classVal.add("5");
        classVal.add("6");


        attributes.add(new Attribute("class", classVal));
        dataRaw = new Instances("TestInstances", attributes, 0);
        dataRaw.setClassIndex(dataRaw.numAttributes() - 1);
    }


    Instances createInstance(
            double hour,
            double isWeekend,
            double month,
            double temp,
            double temp_min,
            double temp_max,
            double pressure,
            double humidity,
            double wind_speed,
            double wind_deg,
            double clouds_all
    ) {
        dataRaw.clear();
        double[] instanceValue1 = new double[]{hour, isWeekend, month, temp, temp_min, temp_max, pressure, humidity, wind_speed, wind_deg, clouds_all, 0};
        dataRaw.add(new DenseInstance(1.0, instanceValue1));
        return dataRaw;
    }


    String classifiy(Instances insts, String path) {
        String result = "Not classified!!";
        Classifier cls;
        try {
            cls = (RandomForest) SerializationHelper.read(path);
            result = classVal.get((int) cls.classifyInstance(insts.firstInstance()));
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return result;
    }
}
