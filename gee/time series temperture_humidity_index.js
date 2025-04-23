// Define region of interest (Akure, Ondo State)
var akure = ee.Geometry.Point([5.216, 7.252]); // Center of Akure
var region = akure.buffer(50000); // 50 km buffer around the center

// Function to calculate THI for a given year
function calculateTHI(year) {
  // Load ERA5 data (Temperature and Dewpoint Temperature)
  var era5 = ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY")
    .filterDate(year + '-01-01', year + '-12-31')
    .select(['temperature_2m', 'dewpoint_temperature_2m'])
    .mean()
    .clip(region);

  // Convert temperatures from Kelvin to Celsius
  var temperature = era5.select('temperature_2m').subtract(273.15);
  var dewpoint = era5.select('dewpoint_temperature_2m').subtract(273.15);

  // Calculate Relative Humidity
  var rh = temperature.expression(
    '100 - 5 * (T - D)',
    {'T': temperature, 'D': dewpoint}
  );

  // Load Landsat data based on the year
  var landsat;
  var bands;

  if (year < 2012) {
    landsat = ee.ImageCollection("LANDSAT/LT05/C02/T1_L2"); // Landsat 5
    bands = ['SR_B3', 'SR_B4', 'SR_B5']; // Correct bands for Landsat 5
  } else {
    landsat = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2"); // Landsat 8
    bands = ['SR_B4', 'SR_B5', 'SR_B6']; // Correct bands for Landsat 8
  }
  
  landsat = landsat
    .filterDate(year + '-01-01', year + '-12-31')
    .filterBounds(region)
    .filter(ee.Filter.lt('CLOUD_COVER', 20))
    .mean()
    .select(bands); // Use the correct bands based on the satellite

  // Downscaling ERA5 data using Landsat data
  var downscaledTemp = temperature.resample('bicubic').reproject({
    crs: landsat.projection(),
    scale: 30
  });
  var downscaledRh = rh.resample('bicubic').reproject({
    crs: landsat.projection(),
    scale: 30
  });

  // Calculate THI using downscaled data
  var THI = downscaledTemp.expression(
    'T - (0.55 - 0.0055 * RH) * (T - 14.5)',
    {'T': downscaledTemp, 'RH': downscaledRh}
  );

  // Export the THI map to Google Drive
  Export.image.toDrive({
    image: THI,
    description: 'THI_' + year,
    folder: 'THI',
    fileNamePrefix: 'THI_' + year,
    region: region,
    scale: 30,
    maxPixels: 1e9
  });
  
  // Display the THI map
  Map.addLayer(THI, {min: 20, max: 40, palette: ['blue', 'yellow', 'red']}, 'THI ' + year);
}

// Years to calculate THI for
var years = [1984, 2014, 2023]; // Removed 2002

// Calculate and export THI for each year
years.forEach(function(year) {
  calculateTHI(year);
});

// Center the map on the region of interest
Map.centerObject(region, 10);
