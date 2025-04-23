
// Define the region of interest (Nigeria)
var nigeria = ee.FeatureCollection("FAO/GAUL/2015/level0")
                .filter(ee.Filter.eq('ADM0_NAME', 'Kenya'));

// Set fixed scales
var modisScale = 5000;  // 5 km resolution for MODIS
var era5Scale = 25000;  // 25 km resolution for ERA5

// Define the time range
var startDate = '2000-01-01';
var endDate = '2023-12-31';

// MODIS Terra LST dataset
var modisLST = ee.ImageCollection("MODIS/006/MOD11A1")
                .filterBounds(nigeria)
                .filterDate(startDate, endDate)
                .select('LST_Day_1km');

// Convert LST from Kelvin to Celsius
var modisLST = modisLST.map(function(image) {
  return image.multiply(0.02).subtract(273.15)
              .copyProperties(image, ["system:time_start"]);
});

// ERA5-Land Monthly Averaged dataset - 2m Air Temperature
var era5_2m_temp = ee.ImageCollection("ECMWF/ERA5_LAND/MONTHLY")
              .filterBounds(nigeria)
              .filterDate(startDate, endDate)
              .select('temperature_2m');

// Convert 2m air temperature from Kelvin to Celsius
era5_2m_temp = era5_2m_temp.map(function(image) {
  return image.subtract(273.15).copyProperties(image, ["system:time_start"]);
});

// Function to calculate annual mean temperature for a given year
var calculateAnnualMean = function(year, collection) {
  var start = ee.Date.fromYMD(year, 1, 1);
  var end = start.advance(1, 'year');
  var yearlyCollection = collection.filterDate(start, end);
  var meanImage = yearlyCollection.mean()
    .set('year', year)
    .set('system:time_start', start.millis());
  return meanImage.clip(nigeria);
};

// List of years to process
var years = ee.List.sequence(2000, 2023);

// Compute annual mean temperatures for each year for both datasets
var modisAnnualMeans = ee.ImageCollection(years.map(function(year) {
  return calculateAnnualMean(year, modisLST);
}));

var era5AnnualMeans = ee.ImageCollection(years.map(function(year) {
  return calculateAnnualMean(year, era5_2m_temp);
}));

// Function to create and print histogram
function createAndPrintHistogram(image, region, scale, title, color) {
  var histogram = ui.Chart.image.histogram({
    image: image,
    region: region,
    scale: scale,
    maxPixels: 1e6
  }).setOptions({
    title: title,
    hAxis: {title: 'Temperature (°C)'},
    vAxis: {title: 'Frequency'},
    colors: [color]
  });
  
  print(title + ' (Scale: ' + scale + ' meters)');
  print(histogram);
}

// Create and print histograms with error handling
try {
  createAndPrintHistogram(modisAnnualMeans.mean(), nigeria, modisScale, 'Histogram of MODIS Land Surface Temperature (2000-2023)', 'blue');
  createAndPrintHistogram(era5AnnualMeans.mean(), nigeria, era5Scale, 'Histogram of Annual ERA5 2m Air Temperature (2000-2023)', 'orange');
} catch (e) {
  print('Error creating histograms:', e);
}

// Function to create a time series chart
function createTimeSeriesChart(imageCollection, title, yAxisLabel, color) {
  var chart = ui.Chart.image.series({
    imageCollection: imageCollection,
    region: nigeria,
    reducer: ee.Reducer.mean(),
    scale: era5Scale,
    xProperty: 'system:time_start'
  }).setOptions({
    title: title,
    vAxis: {title: yAxisLabel},
    hAxis: {title: 'Year', format: 'yyyy'},
    lineWidth: 1,
    pointSize: 4,
    series: {0: {color: color}}
  });
  
  print(chart);
}

// Create time series charts for both datasets
createTimeSeriesChart(modisAnnualMeans, 'MODIS Land Surface Temperature (2000-2023)', 'Temperature (°C)', 'blue');
createTimeSeriesChart(era5AnnualMeans, 'ERA5 2m Air Temperature (2000-2023)', 'Temperature (°C)', 'orange');

// Add the mean temperature layers to the map (using the most recent year for visualization)
Map.centerObject(nigeria, 6);
var latestYear = ee.Date.fromYMD(2023, 1, 1);
var latestModisImage = modisAnnualMeans.filter(ee.Filter.date(latestYear, latestYear.advance(1, 'year'))).first();
var latestEra5Image = era5AnnualMeans.filter(ee.Filter.date(latestYear, latestYear.advance(1, 'year'))).first();

Map.addLayer(latestModisImage, 
             {min: 20, max: 35, palette: ['blue', 'green', 'red']}, 
             'MODIS LST Mean Temperature (2023)');
Map.addLayer(latestEra5Image, 
             {min: 20, max: 35, palette: ['blue', 'green', 'red']}, 
             'ERA5 Mean Temperature (2023)');

// Print some information about the data
print('Number of years processed:', years.length());
print('Total number of images in MODIS annual means:', modisAnnualMeans.size());
print('Total number of images in ERA5 annual means:', era5AnnualMeans.size());

