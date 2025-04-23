// This script calculates and visualizes water quality indices from Sentinel-2 data (2017-2025)
// for a user-defined region of interest (ROI), with cloud masking applied
// Indices calculated: NDTI, Chlorophyll-a, and Algal Density (without regression)

// Assuming 'roi' is already defined as a geometry in your GEE environment
// var roi = ee.Geometry.Polygon([...]); // Uncomment and replace with your ROI if needed

// Function to mask clouds for Sentinel-2 imagery
function maskS2clouds(image) {
  // Get the cloud probability band
  var cloudProb = image.select('MSK_CLDPRB');
  
  // Get the cirrus cloud band
  var cirrus = image.select('MSK_CLDPRB');
  
  // Create a cloud mask (both probability and cirrus)
  var cloud_mask = cloudProb.lt(20).and(cirrus.lt(20));
  
  // Apply the mask to the image
  return image.updateMask(cloud_mask)
              .copyProperties(image, ['system:time_start']);
}

// Function to add indices to an image - using direct formulas without regression
function addIndices(image) {
  // NDTI = (Red - Green) / (Red + Green)
  // For Sentinel-2: Red = B4, Green = B3
  var ndti = image.normalizedDifference(['B4', 'B3']).rename('NDTI');
  
  // Chlorophyll-a concentration using Sentinel-2 MSI bands - direct formula
  // B5 - (B4 + B6)/2
  var b5 = image.select('B5');
  var b4 = image.select('B4');
  var b6 = image.select('B6');
  var chla = b5.subtract(b4.add(b6).divide(2)).rename('CHL_A');
  
  // Algal density using the same direct formula as Chlorophyll-a
  var algal_density = b5.subtract(b4.add(b6).divide(2)).rename('ALGAL_DENSITY');
  
  // Turbidity using NDTI directly
  var turbidity = ndti.rename('TURBIDITY');
  
  return image.addBands([ndti, chla, algal_density, turbidity]);
}

// Define the start and end dates for the time series
var startDate = '2017-01-01';
var endDate = '2025-03-08';

// Import the Sentinel-2 Surface Reflectance collection
var sentinel2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate(startDate, endDate)
                  .filterBounds(roi)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30)) // Pre-filter by metadata
                  .map(maskS2clouds)
                  .map(addIndices);

// Create a median composite for each year
var years = ee.List.sequence(2017, 2025);
var yearlyComposites = ee.ImageCollection.fromImages(
  years.map(function(year) {
    var start = ee.Date.fromYMD(year, 1, 1);
    var end = start.advance(1, 'year');
    var composite = sentinel2
                     .filterDate(start, end)
                     .median()
                     .clip(roi);
    return composite.set('year', year)
                    .set('system:time_start', start.millis());
  })
);

// Define visualization parameters for different indices with green to red palettes
var ndtiVis = {
  bands: ['NDTI'],
  min: -0.5,
  max: 0.5,
  palette: ['darkgreen', 'green', 'yellowgreen', 'yellow', 'orange', 'red'] // Green to Red
};

var chlaVis = {
  bands: ['CHL_A'],
  min: -0.05,  // Adjusted for direct formula values (not regression)
  max: 0.05,   // Adjusted for direct formula values (not regression)
  palette: ['darkgreen', 'green', 'yellowgreen', 'yellow', 'orange', 'red'] // Green to Red
};

var algalVis = {
  bands: ['ALGAL_DENSITY'],
  min: -0.05,  // Adjusted for direct formula values (not regression)
  max: 0.05,   // Adjusted for direct formula values (not regression)
  palette: ['darkgreen', 'green', 'yellowgreen', 'yellow', 'orange', 'red'] // Green to Red
};

var turbidityVis = {
  bands: ['TURBIDITY'],
  min: -0.5,
  max: 0.5,
  palette: ['darkgreen', 'green', 'yellowgreen', 'yellow', 'orange', 'red'] // Green to Red
};

// Also add true color visualization
var trueColorVis = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000
};

// Define the years as a client-side list
var yearList = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

// Add the yearly composites to the map
yearList.forEach(function(year) {
  var yearImage = yearlyComposites.filter(ee.Filter.eq('year', year)).first();
  
  // Add the true color and indices layers
  Map.addLayer(yearImage, trueColorVis, 'True Color ' + year, false);
  Map.addLayer(yearImage, ndtiVis, 'NDTI ' + year, false);
  Map.addLayer(yearImage, chlaVis, 'Chlorophyll-a ' + year, false);
  Map.addLayer(yearImage, algalVis, 'Algal Density ' + year, false);
  Map.addLayer(yearImage, turbidityVis, 'Turbidity ' + year, false);
});

// Set the map center to the ROI
Map.centerObject(roi, 10);

// Create UI for selecting years and indices
var yearStrings = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
var visualizations = ['True Color', 'NDTI', 'Chlorophyll-a', 'Algal Density', 'Turbidity'];

// Create panels for UI elements
var yearPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal'),
  style: {width: '100%'}
});

var indexPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal'),
  style: {width: '100%'}
});

// Add a title
var title = ui.Label({
  value: 'Water Quality Indices (2017-2025)',
  style: {fontWeight: 'bold', fontSize: '18px'}
});

// Add description of indices
var description = ui.Label({
  value: 'NDTI: Normalized Difference Turbidity Index = (Red - Green) / (Red + Green)\n' +
         'Chlorophyll-a: B5 - (B4 + B6)/2\n' +
         'Algal Density: B5 - (B4 + B6)/2\n' +
         'Turbidity: Same as NDTI',
  style: {fontSize: '12px', margin: '4px 0'}
});

// Function to update the map when a button is clicked
function updateMap(year, indexType) {
  // First, turn off all layers
  Map.layers().forEach(function(layer) {
    layer.setShown(false);
  });
  
  // Then, turn on the selected layer
  var layerName = indexType + ' ' + year;
  Map.layers().forEach(function(layer) {
    if (layer.getName() === layerName) {
      layer.setShown(true);
    }
  });
}

// Create buttons for each year
yearStrings.forEach(function(year) {
  var button = ui.Button({
    label: year,
    onClick: function() {
      // Get the currently selected index type
      var indexType = '';
      indexPanel.widgets().forEach(function(widget) {
        if (widget.get('style').backgroundColor === '#dddddd') {
          indexType = widget.getLabel();
        }
      });
      if (indexType === '') indexType = 'True Color'; // Default
      
      updateMap(year, indexType);
      
      // Update button styles
      yearPanel.widgets().forEach(function(widget) {
        widget.style().set('backgroundColor', null);
      });
      this.style().set('backgroundColor', '#dddddd');
    }
  });
  yearPanel.add(button);
});

// Create buttons for each index type
visualizations.forEach(function(indexType) {
  var button = ui.Button({
    label: indexType,
    onClick: function() {
      // Get the currently selected year
      var year = '';
      yearPanel.widgets().forEach(function(widget) {
        if (widget.get('style').backgroundColor === '#dddddd') {
          year = widget.getLabel();
        }
      });
      if (year === '') year = '2017'; // Default
      
      updateMap(year, indexType);
      
      // Update button styles
      indexPanel.widgets().forEach(function(widget) {
        widget.style().set('backgroundColor', null);
      });
      this.style().set('backgroundColor', '#dddddd');
    }
  });
  indexPanel.add(button);
});

// Create a panel to hold the UI elements
var controlPanel = ui.Panel({
  widgets: [
    title,
    description,
    ui.Label('Select Year:'),
    yearPanel,
    ui.Label('Select Index:'),
    indexPanel
  ],
  style: {position: 'top-left'}
});

// Add the panel to the map
Map.add(controlPanel);

// Set default selections (2017, True Color)
yearPanel.widgets().get(0).style().set('backgroundColor', '#dddddd');
indexPanel.widgets().get(0).style().set('backgroundColor', '#dddddd');
updateMap('2017', 'True Color');

// Export yearly composites with indices to Google Drive
yearList.forEach(function(year) {
  var yearImage = yearlyComposites.filter(ee.Filter.eq('year', year)).first();
  
  // Export NDTI
  Export.image.toDrive({
    image: yearImage.select(['NDTI']),
    description: 'Sentinel2_NDTI_' + year,
    folder: 'GEE_WaterQuality_Exports',
    region: roi,
    scale: 10,
    maxPixels: 1e9
  });
  
  // Export Chlorophyll-a
  Export.image.toDrive({
    image: yearImage.select(['CHL_A']),
    description: 'Sentinel2_ChlorophyllA_' + year,
    folder: 'GEE_WaterQuality_Exports',
    region: roi,
    scale: 10,
    maxPixels: 1e9
  });
  
  // Export Algal Density
  Export.image.toDrive({
    image: yearImage.select(['ALGAL_DENSITY']),
    description: 'Sentinel2_AlgalDensity_' + year,
    folder: 'GEE_WaterQuality_Exports',
    region: roi,
    scale: 10,
    maxPixels: 1e9
  });
  
  // Export Turbidity
  Export.image.toDrive({
    image: yearImage.select(['TURBIDITY']),
    description: 'Sentinel2_Turbidity_' + year,
    folder: 'GEE_WaterQuality_Exports',
    region: roi,
    scale: 10,
    maxPixels: 1e9
  });
  
  // Export All Bands (including original bands and all calculated indices)
  Export.image.toDrive({
    image: yearImage,
    description: 'Sentinel2_AllBands_' + year,
    folder: 'GEE_WaterQuality_Exports',
    region: roi,
    scale: 10,
    maxPixels: 1e9
  });
});