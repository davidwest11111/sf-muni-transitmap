var mapSvg = d3.select('#sf_map');

var mapWidth = mapSvg.attr("width");
var mapHeight = $(window).height();
console.log(mapHeight);

mapSvg.style("height", mapHeight);

var defaultScale = 310000;  // trial and error for current viewport

// Map setup with SF coordinates
var projection = d3.geoMercator()
    .center([-122.56, 37.773]) // [longitude, latitude]
    .scale(defaultScale)
    .translate([mapWidth/2, mapHeight/2]);

var path = d3.geoPath()
    .projection(projection)

// allow dragging & zooming behavior
// code reference from https://bl.ocks.org/mbostock/2206340
// and https://bl.ocks.org/mbostock/3127661b6f13f9316be745e77fdfb084
function zoomed() {
  g.attr("transform", d3.event.transform);
}

function dragged(d){
  d3.select(this)
    .attr("cx", d.x = d3.event.x)
    .attr("cy", d.y = d3.event.y);
}

var transform = d3.zoomIdentity;
var zoom = d3.zoom()
    .scaleExtent([1, 15]) // relative to current scale
    .on("zoom", zoomed);

var drag = d3.drag()
    .on("drag", dragged);

var g = mapSvg.append("g")
    .call(zoom)
    .call(drag);

g.append("g").attr("id", "neighborhoods");
g.append("g").attr("id", "streets");
g.append("g").attr("id", "routes");
g.append("g").attr("class", "buses");


// URL for SF Muni feed
var routesAPI = "https://webservices.nextbus.com/service/publicJSONFeed?";
var selectedRoute = "J";

// plot neighborhoods
d3.json("./data/neighborhoods.json", function(error, sf_hoods){
  if (error) return console.error(error);

  d3.select("#neighborhoods")
    .selectAll("path")
      .data(sf_hoods.features)
      .enter().append("path")
      .attr("d", path)
      .attr("z-index", -1)
      .attr("fill", "#ddd");
});

// plot streets on top of neighborhoods
d3.json("./data/streets.json", function(error, sf_st){
  if (error) return console.error(error);
  
  console.log(sf_st.features);

  d3.select("#streets")
    .selectAll("path")
      .data(sf_st.features)
      .enter().append("path")
      .attr("fill", "rgba(1,1,1,0)")
      .attr("stroke-width", "1px")
      .attr("stroke", "#fff")
      .attr("z-index", 0)
      .attr("d", path);

  // draw the selected route
  $.getJSON(routesAPI, 
            {format: "json",
             command: "routeConfig",
             a : "sf-muni",
             r : selectedRoute})
    .done(function(data) {
      var routeColor = "#"+ data.route.color;
      var routePaths = data.route.path;
      var routePathLineCollection = lineStringsFromPoints(routePaths);

      d3.select("#routes")
        .selectAll("path")
          .data(routePathLineCollection)
          .enter().append("path")
          .attr("fill", "rgba(1,1,1,0)")
          .attr("stroke-width", "1px")
          .attr("stroke", routeColor)
          .attr("z-index", 10)
          .attr("d", path);
  });

  // get buses on route
  var currentTime = (new Date).getTime();
  console.log(currentTime);
  (function worker() {

    $.getJSON(routesAPI, 
              {format: "json",
               command: "vehicleLocations",
               a : "sf-muni",
               r : selectedRoute,
               t : currentTime})
      .done(function(data) {
        var vehicleLocations = data;
        console.log(vehicleLocations.vehicle);

        var t = d3.transition()
            .duration(14500);
        
        // Data join, i.e. join new buses with old.
        buses = g.select(".buses").selectAll("circle")
            .data(vehicleLocations.vehicle, 
                  function(d) { 
                    return d.id + "-" + d.dirTag;
                  });

        // update existing elements
        buses
          .transition(t)
            .attr("cx", function(d) {
                return projection([d.lon, d.lat])[0];
              })
            .attr("cy", function(d) {
                return projection([d.lon, d.lat])[1];
              });

        // enter(), i.e. create new elements as needed
        buses.enter().append("circle")
            .attr("stroke", "#003399")
            .attr("fill", "#fff")
            .attr("stroke-width", "2px")
            .attr("id", function(d){
              return d.id + "-" + d.dirTag;
            })
            .attr("class", "route-" + selectedRoute)
            .attr("r", "3px")
            .attr("cx", function(d) {
                return projection([d.lon, d.lat])[0];
              })
            .attr("cy", function(d) {
                return projection([d.lon, d.lat])[1];
              });

        // remove old elements
        buses.exit().remove();

        console.log($(".route-"+selectedRoute));

      setTimeout(worker, 15000);
    });
  
  })();

});

// to get routes info
$.getJSON(routesAPI, 
          {format: "json",
           command: "routeList",
           a : "sf-muni"})
  .done(function(data) {
    var route = data.route;
    console.log(route);
});

function lineStringsFromPoints(pointObjList){

  var routePathLineCollection = [];

  for (var i=0;i<pointObjList.length;i++){

    var pointArray = pointObjList[i].point;
    // Each "pointArray" is of the form:
    //   { point : [ { lat: "lat", lon: "lon"}, ... ] }
    // And this array needs to be converted to: 
    //   { type: "Feature",
    //     geometry: { type: "LineString", 
    //                 coordinates: [ [lon, lat, z], ...] } 
    //   }
    var coordList = [];
    for (var ind=0; ind<pointArray.length; ind++){
      var lon = +pointArray[ind].lon; // convert str to float
      var lat = +pointArray[ind].lat;
      var z = 0;
      coordList.push([lon, lat, z]);
    }
    var outputLineString = { type : "Feature",
                             geometry : {type : "LineString",
                                         coordinates : coordList} };

    routePathLineCollection.push(outputLineString);
  } 
  return(routePathLineCollection);
}

/* COMMANDS FOR SF MUNICIPALITY
https://webservices.nextbus.com/service/publicJSONFeed?command=agencyList&a=sf-muni
*/

/* ROUTE LIST
 * https://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=sf-muni
 */

/* LIST OF STOPS ON A ROUTE
 * https://webservices.nextbus.com/service/publicJSONFeed?command=routeConfig&a=sf-muni&r=N
 */

