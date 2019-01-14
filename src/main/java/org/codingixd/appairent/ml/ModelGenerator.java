package org.codingixd.appairent.ml;

import weka.classifiers.Classifier;
import weka.classifiers.evaluation.Evaluation;
import weka.core.Instances;
import weka.core.SerializationHelper;
import weka.core.converters.ConverterUtils.DataSource;

/**
 * Inspired by: https://github.com/emara-geek/weka-example
 *
 */

class ModelGenerator {
    public static Instances loadDataset(String path) {
        Instances dataset = null;
        try {
            dataset = DataSource.read(path);
            if (dataset.classIndex() == -1) {
                dataset.setClassIndex(dataset.numAttributes() - 1);
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return dataset;
    }

    public static Classifier buildClassifier(Classifier cl, Instances traindataset) {

        try {
            cl.buildClassifier(traindataset);

        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return cl;
    }

    public static void evaluateModel(Classifier model, Instances traindataset, Instances testdataset) {
        Evaluation eval = null;
        try {
            // Evaluate airClassifier with test dataset
            eval = new Evaluation(traindataset);
            eval.evaluateModel(model, testdataset);
            System.out.println(eval.toSummaryString());

            for (double[] dd : eval.confusionMatrix()){
                for(double d : dd){
                    System.out.print(d + ", ");
                }
                System.out.println();
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    public static void saveModel(Classifier model, String modelpath) {
        try {
            SerializationHelper.write(modelpath, model);
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }
}
