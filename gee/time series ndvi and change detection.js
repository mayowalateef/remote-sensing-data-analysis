
//THIS CODE WAS ADOPTED FROM THE EO TRAINING BY ESA
//TIME SERIES ANALYSIS of VEGETATION INDEX & CHANGE DETECTION
//with Optical
//in Google Earth Engine

//-------------------------------------------------------------------
// Define the region of interest
//-------------------------------------------------------------------
// - Enter Mato Grosso, Brazil in the search bar and zoom into the area
// - Click on the draw a line icon on the top left of the map view and 
//draw a rectangle that including the area of State of Mato Grosso close to State of Rondania.

//-----------------------------------------------------------------
//Part 1: load and prepare the image 
//-----------------------------------------------------------------

// Import landsat imagery. Create function to cloud mask from 
// the pixel_qa band of Landsat 8 SR data. 
// Bits 3 and 5 are cloud shadow and cloud, respectively.

 var imageCollection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
   .filterBounds(roi);

//-----------------------------
//Define function for cloud and cloud shadow masking
// Function that scales and masks Landsat 8 (C2) surface reflectance images.
function maskL8sr(image) {
  // Develop masks for unwanted pixels (fill, cloud, cloud shadow).
  var qaMask = image.select('QA_PIXEL').bitwiseAnd(parseInt('11111', 2)).eq(0);
  var saturationMask = image.select('QA_RADSAT').eq(0); 
  
  // Apply the scaling factors to the appropriate bands.
  var getFactorImg = function(factorNames) {
    var factorList = image.toDictionary().select(factorNames).values();
    return ee.Image.constant(factorList);
  };
  var scaleImg = getFactorImg([
    'REFLECTANCE_MULT_BAND_.|TEMPERATURE_MULT_BAND_ST_B10']);
  var offsetImg = getFactorImg([
    'REFLECTANCE_ADD_BAND_.|TEMPERATURE_ADD_BAND_ST_B10']);
  var scaled = image.select('SR_B.|ST_B10').multiply(scaleImg).add(offsetImg);

  // Replace original bands with scaled bands and apply masks.
  return image.addBands(scaled, null, true)
    .updateMask(qaMask).updateMask(saturationMask);
}

//-----------------------------

// Make a list of years, then for each year filter the collection by time frame, 
// mask clouds, and reduce by median. Important to add system:time_start 
// after reducing as this allows you to filter by date later.
var stepList = ee.List.sequence(2014,2022);

var filterCollection = stepList.map(function(year){
  var startDate = ee.Date.fromYMD(year,5,1);
  var endDate = ee.Date.fromYMD(year,9,15);
  var composite_i = imageCollection.filterDate(startDate, endDate)
                        .map(maskL8sr)
                        .median()
                        .set('system:time_start',startDate)
                        //.clip(roi);
  return composite_i;
});

var yearlyComposites = ee.ImageCollection(filterCollection);
print(yearlyComposites, 'Masked and Filtered Composites');

var firstImage = imageCollection.first();
print('Band names:', firstImage.bandNames());
Map.addLayer(yearlyComposites, {bands: ['SR_B4', 'SR_B3', 'SR_B2']}, 'L8 2014-Median');
Map.centerObject(roi, 7);

//-----------------------------------------------------------------
//Part 2: Calculate and visualize the Enhanced Vegetation Index (EVI)
//-----------------------------------------------------------------
// Add Enhanced Vegetation Index to a function and apply it.
//EVI = 2.5 * ((NIR - Red) / (NIR + 6 * Red - 7.5 * Blue + 1))
function evi(img){
  var eviImg = img.select(['SR_B5','SR_B4','SR_B2'],['nir','red','blue']);
  eviImg = eviImg.expression(
    '(2.5 * ((NIR - RED)) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
      'NIR': eviImg.select('nir'),
      'RED': eviImg.select('red'),
      'BLUE': eviImg.select('blue')
    }).rename('EVI');
  return img.addBands(eviImg);
}

yearlyComposites = yearlyComposites.map(function(image){
  return evi(image);
});

print(yearlyComposites, 'With EVI as Band');

// Create image collection of yearly composites, selecting the EVI band.
var eviCollection = yearlyComposites.select('EVI');

// Create variables for each yearly composite.
// Add the 7 EVI maps for each year 2014-2022.
var y2014 = eviCollection.filterDate('2014-01-01','2014-12-31')
  .first()
  .clip(roi);
var y2015 = eviCollection.filterDate('2015-01-01','2015-12-31')
  .first()
  .clip(roi);
var y2016 = eviCollection.filterDate('2016-01-01','2016-12-31')
  .first()
  .clip(roi);
var y2017 = eviCollection.filterDate('2017-01-01','2017-12-31')
  .first()
  .clip(roi);
var y2018 = eviCollection.filterDate('2018-01-01','2018-12-31')
  .first()
  .clip(roi);
var y2019 = eviCollection.filterDate('2019-01-01','2019-12-31')
  .first()
  .clip(roi);
var y2020 = eviCollection.filterDate('2020-01-01','2020-12-31')
  .first()
  .clip(roi);
var y2021 = eviCollection.filterDate('2021-01-01','2021-12-31')
  .first()
  .clip(roi);
var y2022 = eviCollection.filterDate('2022-01-01','2022-12-31')
  .first()
  .clip(roi);
  
print(y2022, '2022 Composite Image');

//Display the maps - define display parameters and add to layer
var eviParams = {min: 0, max: 1, palette: ['white', 'green']};

Map.addLayer(y2014, eviParams, '2014 EVI');
Map.addLayer(y2015, eviParams, '2015 EVI');
Map.addLayer(y2016, eviParams, '2016 EVI');
Map.addLayer(y2017, eviParams, '2017 EVI');
Map.addLayer(y2018, eviParams, '2018 EVI');
Map.addLayer(y2019, eviParams, '2019 EVI');
Map.addLayer(y2020, eviParams, '2020 EVI');
Map.addLayer (y2021, eviParams, '2021 EVI');
Map.addLayer (y2022, eviParams, '2022 EVI');


//-----------------------------------------------------------------
//Part 3: Temporal and Spatial Time Series Plots
//-----------------------------------------------------------------
// Temporal Plot: time series of EVI values for a selected coordinate
//------
//Create a line chart to display EVI time series for a selected point.
//-------------------------------------------------
// Create a line chart for a defined point and Display chart in the console.
// Define a Point object.
var pt_coor = ee.Geometry.Point(-58.91,-13.75);

var chart = ui.Chart.image.series({
  imageCollection: eviCollection.select('EVI'),
  region: pt_coor,
  scale: 30
}).setOptions({title: 'Point 1: EVI Over Time'});

print(chart);

// As alternative select the point interactively on the map
//+++++++++++++++++++++++++++++++++++++++++++++
// Create function for the Interactive chart
function interactive_chart(imgcollection, chart_title, plot_title, x_label, y_label, xProperty) {
  // Create User Interface portion -
  // Create a panel to hold our widgets.
  var panel = ui.Panel();
  panel.style().set('width', '300px');

  // Create an intro panel with labels.
  var intro = ui.Panel([
    ui.Label({
      value:chart_title ,
      style: {fontSize: '16px', fontWeight: 'bold'}
    }),
    ui.Label('Click a point on the map to inspect.')
  ]);
  panel.add(intro);

  // panels to hold lon/lat values
  var lon = ui.Label();
  var lat = ui.Label();
  panel.add(ui.Panel([lon, lat], ui.Panel.Layout.flow('horizontal')));

  // Register a callback on the default map to be invoked when the map is clicked
  Map.onClick(function(coords) {
  // Update the lon/lat panel with values from the click event.
  lon.setValue('lon: ' + coords.lon.toFixed(2)),
  lat.setValue('lat: ' + coords.lat.toFixed(2));
  var point = ee.Geometry.Point(coords.lon, coords.lat);

  // Create an interactive chart.
  var interactiveChart = ui.Chart.image.series({
          imageCollection: imgcollection,
          region: point,
          reducer: ee.Reducer.mean(),
          scale: 500,
          xProperty: xProperty
          });
  interactiveChart.setOptions({
    title: plot_title,
    vAxis: {title: y_label, maxValue: 2, minValue: 1},
    hAxis: {title: x_label, gridlines: {count: 9}},
    lineWidth: 3, pointSize: 7
  });
  panel.widgets().set(2, interactiveChart);
  });

  Map.style().set('cursor', 'crosshair');

  // Add the panel to the ui.root.
  ui.root.insert(0, panel);
}
//------------
// call the function interactive chart
interactive_chart(eviCollection, 'EVI Time Series Chart', 'EVI over time', 'Date', 'Band Mean', 'system:time_start')

// Spatial Plot: Create a time series animation of EVI Maps
//------
// Creating a Timeseries GIF of EVI maps.
var anno_list=[ '2014', '2015', '2016','2017','2018','2019','2020', '2021', '2022']

//+++++++++++++++++++++++++++++++++++++++++++++
// Create gif timeseries
function gif_timeseries(collection, list, roi, imgParams){
  // Load package from Gena for adding text annotations. 
  var text = require('users/gena/packages:text');
  // Create year list
  var anno = ee.List(list);
  // Assign the labels to respective layers
  var ColWithAnno = collection.map(function(feat){
    return feat.set('year', anno.getString(
                        ee.Number.parse(feat.getString('system:index'))));
  });
  
  // Print the labels
  print(ColWithAnno, 'year');
  
  // Define GIF visualization arguments.
  var gifParams = {
    'region': roi,
    'dimensions': 800,
    'framesPerSecond': 1,
    'format': 'gif'
  };
  
  // Labeling your images.
  var annotations = [{
    position: 'bottom',
    offset: '10%',
    margin: '20%',
    property: 'year',
    scale: 6000
    }];
    
  // Mapping over the collection to annotate each image.
  // Note that the "annotateImage" is a function written by Gena
  var timeSeriesgif = ColWithAnno.map(function(image) {
    return text.annotateImage(image, imgParams, roi, annotations);
  });
  
  // Print the GIF URL to the console
  print(timeSeriesgif.getVideoThumbURL(gifParams));
  
  // Render the GIF animation in the console.
  print(ui.Thumbnail(timeSeriesgif, gifParams));
}

gif_timeseries(eviCollection, anno_list, roi, eviParams)

// //-----------------------------------------------------------------
// //Part 4: Change Detection
// //-----------------------------------------------------------------

// Simple image differencing between 2014 and 2022.
var SimpleImageDiff = (y2014.subtract(y2022)).rename('SimpleImageDiff');
  
// 2020 difference from mean EVI values.
var yMean = (eviCollection.mean()).rename('yMean');
var AvgImageDiff = (yMean.subtract(y2022)).rename('AvgImageDiff');

// add to map layers
//  Palette with the colors
var diffParams = {min: -1, max: 1, palette:['FF0000', 'FFFF00', '008000']};

Map.addLayer(SimpleImageDiff, diffParams, '2014/2022 Image Difference');
Map.addLayer(AvgImageDiff, diffParams, '2022 Difference from Average');
  
// Standard Anomalies (Z-Score). Calculate Standard Deviation across the EVI collection.
//Z-Score = (Year-Mean)/Standard Deviation
var stdImg = (eviCollection.reduce(ee.Reducer.stdDev())).rename('stdImg');
var Anomaly2022 = (y2022.subtract(yMean).divide(stdImg)).rename('2022 Anomaly');
var Anomaly2020 = (y2020.subtract(yMean).divide(stdImg)).rename('2020 Anomaly');
var Anomaly2018 = (y2018.subtract(yMean).divide(stdImg)).rename('2018 Anomaly');
var Anomaly2016 = (y2016.subtract(yMean).divide(stdImg)).rename('2016 Anomaly');
var Anomaly2014 = (y2014.subtract(yMean).divide(stdImg)).rename('2014 Anomaly');
  
var anomParams = {min: -3, max:3, palette: diffParams.palette};
Map.addLayer(Anomaly2022, anomParams, '2022 Anomaly');
Map.addLayer(Anomaly2020, anomParams, '2020 Anomaly');
Map.addLayer(Anomaly2018, anomParams, '2018 Anomaly');
Map.addLayer(Anomaly2016, anomParams, '2016 Anomaly');
Map.addLayer(Anomaly2014, anomParams, '2014 Anomaly');
  
// Convert the list of images into an image collection.
var AnoCollection = ee.ImageCollection.fromImages([Anomaly2014, Anomaly2016, Anomaly2018, Anomaly2020, Anomaly2022]);
print('Collection from list of images', AnoCollection);


interactive_chart(AnoCollection, 'Anomaly Chart', 'Anomaly over time', 'Images', 'Anomaly (mean-std)', 'system:index') 

 //+++++++++++++++++++++++++++++++++++++++++++++
// Add gradient legend (vertical)
function legendV_grad(min, max, palette, title, position){

  // set position of panel
  var legend = ui.Panel({
  style: {
  position: position,
  padding: '8px 15px'
  }
  });
 
  // Create legend title
  var legendTitle = ui.Label({
  value: title,
  style: {
  fontWeight: 'bold',
  fontSize: '14px',
  margin: '0 0 4px 0',
  padding: '0'
  }
  });
 
  // Add the title to the panel
  legend.add(legendTitle);
   
  // create the legend image
  var lon = ee.Image.pixelLonLat().select('latitude');
  var gradient = lon.multiply((max-min)/100.0).add(min);
  var legendImage = gradient.visualize({min:min, max:max, palette:palette});
   
  // create text on top of legend
  var panel = ui.Panel({
  widgets: [
  ui.Label(max)
  ],
  });
  legend.add(panel);
   
  // create thumbnail from the image
  var thumbnail = ui.Thumbnail({
  image: legendImage,
  params: {bbox:'0,0,10,100', dimensions:'10x50'},
  style: {padding: '1px', position: 'bottom-center'}
  });
   
  // add the thumbnail to the legend
  legend.add(thumbnail);
   
  // create text on top of legend
  var panel = ui.Panel({
  widgets: [
  ui.Label(min)
  ],
  });
 
  legend.add(panel);
   
  Map.add(legend);
}

legendV_grad(anomParams.min, anomParams.max, anomParams.palette, 'Anomaly', 'bottom-left')
legendV_grad(eviParams.min, eviParams.max, eviParams.palette, 'EVI', 'bottom-left')

//-----------------------------------------------------------------
// Export map to Drive.
//-----------------------------------------------------------------
//Draw a smaller roi with the name section to export only a small portion
var y2014section = eviCollection.filterDate('2014-01-01','2014-12-31')
  .first()
  .clip(roi);

Export.image.toDrive({
  image: y2014section,
  description: '2014_EVI_Export',
  scale: 30,
 maxPixels: 1000000000,
});


