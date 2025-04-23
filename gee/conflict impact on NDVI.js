// Load country boundaries and filter for Sudan
var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
var sudan = countries.filter(ee.Filter.eq('country_na', 'Sudan'));
Map.addLayer(sudan, {}, 'sudan', false);
Map.centerObject(sudan, 3);

// Define date ranges for before and after the conflict
var beforeConflict = ee.DateRange('2018-01-01', '2018-12-31');
var afterConflict = ee.DateRange('2022-01-01', '2022-12-31');

// Load Sentinel-2 ImageCollection and filter by ROI, date range, and cloud cover
var sentinel2 = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterBounds(sudan)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) // Filter images with less than 20% cloud cover
  .map(function(image) {
    // Calculate NDVI
    var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
    return image.addBands(ndvi);
  });

// Function to calculate the median NDVI for a date range
function calculateMedianNDVI(dateRange) {
  return sentinel2
    .filterDate(dateRange)
    .select('NDVI')
    .median()
    .clip(sudan);
}

// Calculate median NDVI before and after the conflict
var ndviBefore = calculateMedianNDVI(beforeConflict);
var ndviAfter = calculateMedianNDVI(afterConflict);

// Calculate the change in NDVI (After - Before)
var ndviChange = ndviAfter.subtract(ndviBefore);

// Visualization parameters for NDVI
var ndviParams = {
  min: -1,
  max: 1,
  palette: ['brown', 'white', 'green']
};

// Add layers to the map
Map.addLayer(ndviBefore, ndviParams, 'NDVI Before Conflict');
Map.addLayer(ndviAfter, ndviParams, 'NDVI After Conflict');
Map.addLayer(ndviChange, {min: -0.5, max: 0.5, palette: ['red', 'white', 'blue']}, 'NDVI Change');

// Export the NDVI change image to Google Drive
Export.image.toDrive({
  image: ndviChange,
  description: 'Sudan_NDVI_Change',
  scale: 2000, // Increase scale to reduce memory usage
  region: sudan,
  maxPixels: 1e8 // Reduce maxPixels for histogram computation
});

// Plotting NDVI time series
var ndviTimeSeries = ui.Chart.image.series({
  imageCollection: sentinel2.select('NDVI'),
  region: sudan,
  reducer: ee.Reducer.mean(),
  scale: 2000, // Increase scale to reduce data points in the chart
  xProperty: 'system:time_start'
}).setOptions({
  title: 'NDVI Time Series for Sudan',
  vAxis: {title: 'NDVI'},
  hAxis: {title: 'Date'},
  lineWidth: 1,
  pointSize: 2
});
print(ndviTimeSeries);

// Plotting NDVI before and after histogram
try {
  var ndviHistBefore = ui.Chart.image.histogram({
    image: ndviBefore,
    region: sudan,
    scale: 2000, // Increase scale to reduce memory usage
    maxPixels: 1e7, // Set maxPixels for histogram computation
    minBucketWidth: 0.05
  }).setOptions({
    title: 'NDVI Histogram Before Conflict',
    hAxis: {title: 'NDVI'},
    vAxis: {title: 'Frequency'}
  });
  print(ndviHistBefore);
} catch (error) {
  print('Error generating NDVI histogram before conflict:', error);
}

try {
  var ndviHistAfter = ui.Chart.image.histogram({
    image: ndviAfter,
    region: sudan,
    scale: 2000, // Increase scale to reduce memory usage
    maxPixels: 1e7, // Set maxPixels for histogram computation
    minBucketWidth: 0.05
  }).setOptions({
    title: 'NDVI Histogram After Conflict',
    hAxis: {title: 'NDVI'},
    vAxis: {title: 'Frequency'}
  });
  print(ndviHistAfter);
} catch (error) {
  print('Error generating NDVI histogram after conflict:', error);
}

try {
  var ndviChangeHist = ui.Chart.image.histogram({
    image: ndviChange,
    region: sudan,
    scale: 2000, // Increase scale to reduce memory usage
    maxPixels: 1e7, // Set maxPixels for histogram computation
    minBucketWidth: 0.05
  }).setOptions({
    title: 'NDVI Change Histogram',
    hAxis: {title: 'NDVI Change'},
    vAxis: {title: 'Frequency'}
  });
  print(ndviChangeHist);
} catch (error) {
  print('Error generating NDVI change histogram:', error);
}

Export.image.toDrive({
  image: ndviBefore,
  description: 'Sudan_NDVI_Before_Conflict',
  scale: 2000,
  region: sudan,
  maxPixels: 1e8
});

Export.image.toDrive({
  image: ndviAfter,
  description: 'Sudan_NDVI_After_Conflict',
  scale: 2000,
  region: sudan,
  maxPixels: 1e8
});

