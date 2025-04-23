var dataset = ee.ImageCollection('MODIS/006/MCD12Q1')
              .filterDate('2001-01-01', '2001-12-31')
              .first();

var visualization = {
  bands: ['LC_Type1'],
  min: 0,
  max: 17,
  palette: [
    '05450a', '086a10', '54a708', '78d203', '009900', 'c6b044',
    'dcd159', 'dade48', 'fbff13', 'b6ff05', '27ff87', 'c24f44',
    'a5a5a5', 'ff6d4c', '69fff8', 'f9ffa4', '1c0dff'
  ],
};

// Load the world countries dataset
var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');

// Filter Nigeria from the countries dataset
var nigeria = countries.filter(ee.Filter.eq('country_na', 'Nigeria'));

// Clip the dataset to Nigeria
var datasetNigeria = dataset.clip(nigeria);

// Set the center of the map to Nigeria
Map.centerObject(nigeria, 5);

// Add the clipped dataset to the map
Map.addLayer(datasetNigeria, visualization, 'Landcover - Nigeria');
