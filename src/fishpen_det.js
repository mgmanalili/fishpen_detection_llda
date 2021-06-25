/// Function to delineate fish cages using S1 radar back scatter.
/// Requies 1 parameter (year) and returns the binary image
function del_fp(year){
  
// Composite Sentinel1
var imgVH = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .select('VV')

var s1 = imgVH.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));

var annual = s1.filterDate(year + '-01-01', year + '-12-30')
// max, mode, and mediab backscatter could be used but median returns the 'cleanest' delineation.
var max_bs = annual.reduce(ee.Reducer.max()).clip(aoi)
var mod_bs = annual.reduce(ee.Reducer.mode()).clip(aoi)
var med_bs = annual.reduce(ee.Reducer.median()).clip(aoi)
// Treshold was fixed to 2.5 with sigma 1.5. Find a dynamic solution but this one looks fine for now
var canny_med = ee.Algorithms.CannyEdgeDetector({image: med_bs, threshold: 2.5, sigma: 1.5});
return canny_med
}

var fp_2015 = del_fp('2015')
var fp_2016 = del_fp('2016')
var fp_2017 = del_fp('2017')
var fp_2018 = del_fp('2018')
var fp_2019 = del_fp('2019')
var fp_2020 = del_fp('2020')

var tseries = fp_2015.addBands(fp_2016).addBands(fp_2017).addBands(fp_2018).addBands(fp_2019).addBands(fp_2020)

Map.addLayer(fp_2020, {}, 'single_year');
Map.addLayer(tseries, {}, 'composite');