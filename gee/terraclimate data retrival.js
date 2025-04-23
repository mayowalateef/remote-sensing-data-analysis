var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
var roi = countries.filter(ee.Filter.eq('country_na', 'Kenya'));
Map.addLayer(roi, {}, 'Nigeria', false);
Map.centerObject(roi,3);

// Actual evapotranspiration, derived using a one-dimensional soil water balance model
var collection =ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE")
var image = collection.filterBounds(roi) 
            .filterDate('1980-01-01', '1980-12-31')
            .select('aet')
            .mean()
            .clip(roi)
            
// Soil moisture, derived using a one-dimensional soil water balance model
var collection =ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE")
var image2 = collection.filterBounds(roi) 
            .filterDate('1980-01-01', '1980-12-31')
            .select('soil')
            .mean()
            .clip(roi)
            
// Reference evapotranspiration
var collection =ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE")
var image4 = collection.filterBounds(roi) 
            .filterDate('1980-01-01', '1980-12-31')
            .select('pet')
            .mean()
            .clip(roi)
            
            

            

// Palmer Drought Severity Index
var collection =ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE")
var image3 = collection.filterBounds(roi) 
            .filterDate('1980-01-01', '1980-12-31')
            .select('pdsi')
            .mean()
            .clip(roi)   
            
var Images = image3.select('pdsi').multiply(100).toInt();            
            
            

var band_viz = {
  min: 0,
  max: 0.0002,
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};

var band_viz2 = {
  min: 0, // Minimum soil moisture value
  max: 1,  // Maximum soil moisture value
  palette: ['3300FF','0074E8', '00AEEF', '5FD78B', 'F2F20C',  'F78B0C', 'FF3300']
};

var band_viz4 = {
  min: 0,  // Minimum ET0 value
  max: 10, // Maximum ET0 value
  palette: ['053061', '2166ac','4393c3','92c5de','d1e5f0','fee08b','d73027' ]
};





var band_viz3 = {
  min: -6, // Minimum PDSI value (extremely dry)
  max: 6,   // Maximum PDSI value (extremely wet)
  palette: ['0000FF','3498DB', '6BB5DB', 'A9DFBF', 'F4D03F',  'E74C3C', 'B03A2E']
};



Map.addLayer(image, band_viz, 'Actual evapotranspiration');
Map.centerObject(roi, 5);  

Map.addLayer(image2, band_viz2, 'Soil moisture');
Map.centerObject(roi, 5);  

Map.addLayer(image4, band_viz4, 'Reference evapotranspiration');
Map.centerObject(roi, 5); 


 


Map.addLayer(image3, band_viz3, 'Palmer Drought');
Map.centerObject(roi, 5); 


var vectors =Images.addBands(image3).reduceToVectors({
  geometry: roi,
  crs: image3.projection(),
  scale: 1000,
  geometryType: 'polygon',
  eightConnected: false,
  labelProperty: 'zone',
  reducer: ee.Reducer.mean()
});



// Export Actual evapotranspiration
Export.image.toDrive({
  image: image,
  description: 'Actual_Evapotranspiration',
  folder: 'Africa', 
  fileNamePrefix: 'AET',
  crs: image.crs,
  scale: 30,
  region: roi,
  maxPixels: 1e5
});

// Export Soil Moisture
Export.image.toDrive({
  image: image2,
  description: 'Soil_Moisture',
  folder: 'Africa', 
  fileNamePrefix: 'Soil_Moisture',
  crs: image2.crs,
  scale: 30,
  region: roi,
  maxPixels: 1e5
});

// Export Reference Evapotranspiration
Export.image.toDrive({
  image: image4,
  description: 'Reference_Evapotranspiration',
  folder: 'Africa',  
  fileNamePrefix: 'ET0',
  crs: image4.crs,
  scale: 30,
  region: roi,
  maxPixels: 1e5
});




// Export Palmer Drought Severity Index
Export.image.toDrive({
  image: image3,
  description: 'Palmer_Drought_Severity_Index',
  folder: 'Africa',  
  fileNamePrefix: 'PDSI',
  crs: image3.crs,
  scale: 30,
  region: roi,
  maxPixels: 1e13
});


// Visualize the vectors
Map.addLayer(vectors, band_viz3 , 'Palmer D');