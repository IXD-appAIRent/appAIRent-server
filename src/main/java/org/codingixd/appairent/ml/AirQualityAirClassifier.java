package org.codingixd.appairent.ml;

import weka.classifiers.Classifier;
import weka.core.Debug;
import weka.core.Instances;
import weka.filters.Filter;
import weka.filters.unsupervised.attribute.Normalize;

import java.io.File;
import java.time.DayOfWeek;
import java.time.LocalDateTime;

public class AirQualityAirClassifier implements AirClassifier {

    public static void main(String[] args) throws Exception{
        AirClassifier cl = new AirQualityAirClassifier();
        int i = cl.getClassification(PredictionMode.TRAFFIC, LocalDateTime.of(2017, 1, 24, 14, 0 ),279.15,279.15,279.15,998,87,4,230,90);
        System.out.println("Classification: " + i);

    }

    private static final String DATASET_TRAFFIC = "./data/ml_traffic.arff";
    private static final String DATASET_BACKGROUND = "./data/ml_background.arff";

    private static final String MODEL_TRAFFIC = "./data/ml_traffic.bin";
    private static final String MODEL_BACKGROUND = "./data/ml_background.bin";

    @Override
    public int getClassification(PredictionMode mode, LocalDateTime dateTime, double temp, double temp_min, double temp_max, double pressure, double humidity, double wind_speed, double wind_deg, double clouds_all) throws MLException {
        String modelPath = "";
        String datasetPath = "";

        switch (mode){
            case TRAFFIC:
                modelPath = MODEL_TRAFFIC;
                datasetPath = DATASET_TRAFFIC;
                break;
            case BACKGROUND:
                modelPath = MODEL_BACKGROUND;
                datasetPath = DATASET_BACKGROUND;
                break;
        }


        // create model if it does not exist
        if(!modelExists(modelPath)){
            // GENERATE MODEL
            try {
                generateModel(modelPath, datasetPath);
            }catch (Exception ex){
                throw new MLException();
            }

        }

        int classification = -1;
        try {
            classification = classify(modelPath, datasetPath, dateTime, temp, temp_min, temp_max, pressure, humidity, wind_speed, wind_deg, clouds_all);
            System.out.println( this.getClass().getSimpleName() + ": " + classification);
        } catch (Exception e) {
            throw new MLException();
        }

        if(classification == -1 ) throw new MLException();

        return classification;

    }

    private boolean modelExists(String modelPath){
        File tmpDir = new File(modelPath);
        return tmpDir.exists();
    }

    private void generateModel(String modelPath, String datasetPath) throws Exception{


        Instances dataset = ModelGenerator.loadDataset(datasetPath);
        Filter filter = new Normalize();



        dataset.randomize(new Debug.Random(1));

        //Normalize dataset
        filter.setInputFormat(dataset);

        int trainSize = (int) Math.round(dataset.numInstances() * 0.8);
        int testSize = dataset.numInstances() - trainSize;


        Instances datasetnor = Filter.useFilter(dataset, filter);
        Instances traindataset = new Instances(datasetnor, 0, trainSize);
        Instances testdataset = new Instances(datasetnor, trainSize, testSize);

        // build classifier with train dataset
        Classifier cl =  ModelGenerator.buildClassifier(traindataset);
        ModelGenerator.saveModel(cl, modelPath);

        ModelGenerator.evaluateModel(cl, traindataset, testdataset);

    }

    private int classify(String modelPath,String datasetPath, LocalDateTime dateTime, double temp, double temp_min, double temp_max, double pressure, double humidity, double wind_speed, double wind_deg, double clouds_all) throws Exception{
        AirQualityModelClassifier cls = new AirQualityModelClassifier();
        Filter filter = new Normalize();
        Instances dataset = ModelGenerator.loadDataset(datasetPath);
        filter.setInputFormat(dataset);

        int ret = -1;

        try {
            ret = Integer.parseInt(cls.classifiy(Filter.useFilter(
                    cls.createInstance(
                            dateTime.getHour(),
                            ((dateTime.getDayOfWeek() == DayOfWeek.SATURDAY) ||
                                    (dateTime.getDayOfWeek() == DayOfWeek.SUNDAY))? 1: 0,
                            dateTime.getMonthValue(),
                            temp,
                            temp_min,
                            temp_max,
                            pressure,
                            humidity,
                            wind_speed,
                            wind_deg,
                            clouds_all
                    ), filter), modelPath)
            );
        } catch (Exception e) {
            e.printStackTrace();
        }
        return ret;
    }


}
