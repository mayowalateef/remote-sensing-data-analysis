//define your region as roi
// Define visualization parameters
var vis = {
  min: 0,
  max: 1,
  palette: ['red', 'yellow', 'green']
};


// Load and process Landsat 5 Image Collection for 1984
var l5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
            .filterBounds(roi)
            .filterDate('1984-01-01', '1984-12-31')
            .filterMetadata('CLOUD_COVER', 'less_than', 5)
            .median()
            .clip(roi);

var ndvi84 = l5.normalizedDifference(['SR_B4', 'SR_B3']).rename('NDVI');
Map.addLayer(ndvi84, vis, 'NDVI 1984');

// Export NDVI 1984 to Google Drive
Export.image.toDrive({
  image: ndvi84,
  description: 'NDVI_1984',
  folder: 'EarthEngineExports',
  fileNamePrefix: 'NDVI_1984',
  region: roi,
  scale: 30,
  maxPixels: 1e9
});

// Load and process Landsat 7 Image Collection for 2002
var l51 = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2')
            .filterBounds(roi)
            .filterDate('2002-01-01', '2002-12-31')
            .filterMetadata('CLOUD_COVER', 'less_than', 5)
            .median()
            .clip(roi);

var ndvi02 = l51.normalizedDifference(['SR_B4', 'SR_B3']).rename('NDVI');
Map.addLayer(ndvi02, vis, 'NDVI 2002');

// Export NDVI 2002 to Google Drive
Export.image.toDrive({
  image: ndvi02,
  description: 'NDVI_2002',
  folder: 'EarthEngineExports',
  fileNamePrefix: 'NDVI_2002',
  region: roi,
  scale: 30,
  maxPixels: 1e9
});

// Load and process Landsat 8 Image Collection for 2014
var l52 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
            .filterBounds(roi)
            .filterDate('2014-01-01', '2014-12-31')
            .filterMetadata('CLOUD_COVER', 'less_than', 5)
            .median()
            .clip(roi);

var ndvi14 = l52.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
Map.addLayer(ndvi14, vis, 'NDVI 2014');

// Export NDVI 2014 to Google Drive
Export.image.toDrive({
  image: ndvi14,
  description: 'NDVI_2014',
  folder: 'EarthEngineExports',
  fileNamePrefix: 'NDVI_2014',
  region: roi,
  scale: 30,
  maxPixels: 1e9
});

// Load and process Landsat 9 Image Collection for 2023
var l53 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
            .filterBounds(roi)
            .filterDate('2023-01-01', '2023-12-31')
            .filterMetadata('CLOUD_COVER', 'less_than', 5)
            .median()
            .clip(roi);

var ndvi23 = l53.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
Map.addLayer(ndvi23, vis, 'NDVI 2023');

// Export NDVI 2023 to Google Drive
Export.image.toDrive({
  image: ndvi23,
  description: 'NDVI_2023',
  folder: 'EarthEngineExports',
  fileNamePrefix: 'NDVI_2023',
  region: roi,
  scale: 30,
  maxPixels: 1e9
});

// Center the map
Map.centerObject(roi, 12);
