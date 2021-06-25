var point_col = point.buffer(100)
exports.temporalCollection = function(collection, start, count, interval, units) {
  // Create a sequence of numbers, one for each time interval.
  var sequence = ee.List.sequence(0, ee.Number(count).subtract(1));

  var originalStartDate = ee.Date(start);

  return ee.ImageCollection(sequence.map(function(i) {
    // Get the start date of the current sequence.
    var startDate = originalStartDate.advance(ee.Number(interval).multiply(i), units);

    // Get the end date of the current sequence.
    var endDate = originalStartDate.advance(
      ee.Number(interval).multiply(ee.Number(i).add(1)), units);

    return collection
        .filterDate(startDate, endDate)
        .mosaic()
        .set('system:time_start', startDate.millis());
  }));
}
/// Function to delineate fish cages using S1 radar back scatter.
/// Requies 1 parameter (year) and returns the binary image
function del_fp(year){
                      // Composite Sentinel1
                      var imgVH = ee.ImageCollection('COPERNICUS/S1_GRD')
                              .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
                              .filter(ee.Filter.eq('instrumentMode', 'IW'))
                              .select('VV')
                      var s1 = imgVH.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
                      // Filter Annual data
                      var annual = s1.filterDate(year + '-01-01', year + '-12-30')
                      // max, mode, and mediab backscatter could be used but median returns the 'cleanest' delineation.
                      var max_bs = annual.reduce(ee.Reducer.max()).clip(aoi)
                      var mod_bs = annual.reduce(ee.Reducer.mode()).clip(aoi)
                      var med_bs = annual.reduce(ee.Reducer.median()).clip(aoi)
                      // Treshold was fixed to 2.5 with sigma 1.5. Find a dynamic solution but this one looks fine for now
                      var canny_med = ee.Algorithms.CannyEdgeDetector({image: med_bs, threshold: 2.5, sigma: 1.5});
                      return canny_med
}

var fp_2015 = del_fp('2015').rename('2015')
var fp_2016 = del_fp('2016').rename('2016')
var fp_2017 = del_fp('2017').rename('2017')
var fp_2018 = del_fp('2018').rename('2018')
var fp_2019 = del_fp('2019').rename('2019')
var fp_2020 = del_fp('2020').rename('2020')

var tseries = fp_2015.addBands(fp_2016).addBands(fp_2017).addBands(fp_2018).addBands(fp_2019).addBands(fp_2020)

Map.addLayer(fp_2019, {}, 'single_year');
Map.addLayer(tseries, {}, 'composite');
Map.addLayer(point_col, {}, 'point_buffer');
var chart =
    ui.Chart.image
        .byRegion({
          image: tseries,
          regions: point_col,
          reducer: ee.Reducer.mean(),
          scale: 30
        })
        .setSeriesNames([
          '2015', '2016', '2017', '2018', '2019', '2020'
        ])
        .setChartType('ColumnChart')
        .setOptions({
          title: 'Fish cages occurence by year',
          hAxis:
              {title: 'Year', titleTextStyle: {italic: false, bold: true}},
          vAxis: {
            title: 'Num of years (presence)',
            titleTextStyle: {italic: false, bold: true}
          },
          colors: [
            '604791', '1d6b99', '39a8a7', '0f8755', '76b349', 'f0af07'
          ]
        });
print(chart);
Map.centerObject(point)

// // UI Chart and Vis for testing
// var panel = ui.Panel();
// panel.style().set('width', '400px');
// var intro = ui.Panel([
// ui.Label({value: 'Time Series Inspector',
// style: {fontSize: '20px', fontWeight: 'bold'}  }),
// ui.Label('Click a point on the map to inspect.')]);
// panel.add(intro);
// var lon = ui.Label();
// var lat = ui.Label();
// panel.add(ui.Panel([lon, lat], ui.Panel.Layout.flow('horizontal')));
// Map.onClick(function(coords) {
// lon.setValue('lon: ' + coords.lon.toFixed(7)),
// lat.setValue('lat: ' + coords.lat.toFixed(7));
// var point = ee.Geometry.Point(coords.lon, coords.lat);
// var dot = ui.Map.Layer(point, {color: 'FF0000'});
// Map.layers().set(1, dot);
// var chart = ui.Chart.image.series(tseries, point, ee.Reducer.max(), 30);
// chart.setOptions({
// title: 'Time Series Inspector',vAxis: {title: 'Year'},
// hAxis: {title: 'date', format: 'MM-yy', gridlines: {count: 7}},
// });  panel.widgets().set(2, chart);});
// Map.style().set('cursor', 'crosshair');

// ui.root.insert(0, panel);
// Map.setOptions('SATELLITE')

