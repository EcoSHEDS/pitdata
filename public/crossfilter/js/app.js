(function () {

var app = {
  data: {},
  config: {
    labels: {
      species: {
        ats: 'Atlantic Salmon',
        bkt: 'Brook Trout',
        bnt: 'Brown Trout'
      },
      rivers: {
        IL: 'Isolated Trib',
        OL: 'Large Trib',
        OS: 'Small Trib',
        WB: 'Mainstem',
        east: 'East Branch',
        west: 'West Branch',
        tidal: 'Tidal',
        mainstem: 'Mainstem'
      }
    },
    domains: {
      west: {
        river: ["WB", "IL", "OL", "OS"]
      },
      stanley:{
        river: ["west", "east", "mainstem", "tidal"]
      }
    }
  }
};

$(document).ready(function () {
  $('#selectWatershed').on('change', function (evt) {
    var watershed = $(this).val();

    selectWatershed(watershed);
  });

  queue()
    .defer(d3.csv, 'data/coreDataOut.csv')
    .defer(d3.csv, 'data/segment-coordinates.csv')
    .await(loadData);
});

function loadData(error, rawData, rawLocations) {
  if (error) throw error;

  var parseDate = d3.time.format('%Y-%m-%d %H:%M:%S').parse;

  app.data.fish = rawData.map(function (d) {
      var datetime = parseDate(d.date),
          date = d3.time.day.floor(datetime);
      return {
        date: date,
        year: +d.year,
        section: +d.section,
        len: +d.len,
        season: d.seasonStr,
        species: d.species,
        river: d.river,
        watershed: d.watershed
      };
    })
    .filter(function (d) {
      return d.section > 0;
    });

  app.data.locations = rawLocations.map(function (d) {
    return {
      watershed: d.watershed,
      river: d.riverAbbr,
      section: +d.section,
      lat: +d.lat,
      lon: +d.lon
    }
  });

  app.data.locationsMap = d3.map();
  app.data.locations.forEach(function(d) {
    app.data.locationsMap.set([d.watershed, d.river, d.section], {
      watershed: d.watershed,
      river: d.river,
      section: d.section,
      LatLng: new L.LatLng(d.lat, d.lon)
    });
  });

  app.xf = initCrossfilter(app.data.fish);
  app.charts = initCharts(app.xf);
  app.map = initMap('map');

  selectWatershed($('#selectWatershed').val());

  hideLoading();
}

function initCrossfilter(data) {
  var xf = {
    dims: {},
    groups: {}
  };

  xf.ndx = crossfilter(data);

  xf.all = xf.ndx.groupAll();

  xf.dims.watershed = xf.ndx.dimension(function (d) {
    return d.watershed;
  });
  xf.groups.watershed = xf.dims.watershed.group().reduceCount();

  xf.dims.year = xf.ndx.dimension(function (d) {
    return d.year;
  });
  xf.groups.year = xf.dims.year.group().reduceCount();

  xf.dims.section = xf.ndx.dimension(function (d) {
    return d.section;
  });
  xf.groups.section = xf.dims.section.group().reduceCount();

  xf.dims.riverSection = xf.ndx.dimension(function (d) {
    return [d.watershed, d.river, d.section];
  });
  xf.groups.riverSection = xf.dims.riverSection.group().reduce(function (p, v) {
    p.count += 1;
    p.lenSum += v.len;
    p.lenMean = p.count > 0 ? p.lenSum / p.count : 0;
    return p;
  }, function (p, v) {
    p.count -= 1;
    p.lenSum -= v.len;
    p.lenMean = p.count > 0 ? p.lenSum / p.count : 0;
    return p;
  }, function () {
    return {
      count: 0,
      lenSum: 0,
      lenMean: 0
    };
  });

  xf.dims.len = xf.ndx.dimension(function (d) {
    return Math.floor(d.len / 10) * 10;
  });
  xf.groups.len = xf.dims.len.group().reduceCount();

  xf.dims.season = xf.ndx.dimension(function (d) {
    return d.season;
  });
  xf.groups.season = xf.dims.season.group().reduceCount();

  xf.dims.species = xf.ndx.dimension(function (d) {
    return d.species;
  });
  xf.groups.species = xf.dims.species.group().reduceCount();

  xf.dims.river = xf.ndx.dimension(function (d) {
    return d.river;
  });
  xf.groups.river = xf.dims.river.group().reduceCount();

  xf.dims.time = xf.ndx.dimension(function (d) {
    return d3.time.month(d.date);
  });
  xf.groups.time = xf.dims.time.group().reduceCount();

  return xf;
}

function initCharts (xf) {
  var charts = {};

  charts.year = dc.barChart('#year-chart')
    .width(400)
    .height(200)
    .margins({top: 10, right: 50, bottom: 30, left: 40})
    .dimension(xf.dims.year)
    .group(xf.groups.year)
    .transitionDuration(10)
    .elasticY(true)
    .centerBar(true)
    .gap(1)
    .alwaysUseRounding(true)
    .round(function(n) { return Math.floor(n) + 0.5; })
    .x(d3.scale.linear().domain([1996, 2016]))
    .renderHorizontalGridLines(true)
    .filterPrinter(function (filters) {
      var filter = filters[0];
      s = '[' + (filter[0] + 0.5) + ' -> ' + (filter[1] - 0.5) + ']';
      return s;
    });

  charts.section = dc.barChart('#section-chart')
    .width(400)
    .height(200)
    .margins({top: 10, right: 50, bottom: 30, left: 40})
    .dimension(xf.dims.section)
    .group(xf.groups.section)
    .transitionDuration(10)
    .elasticY(true)
    .centerBar(true)
    .gap(1)
    .x(d3.scale.linear().domain([0, 51]))
    .renderHorizontalGridLines(true);

  charts.season = dc.barChart('#season-chart')
    .width(400)
    .height(200)
    .margins({top: 10, right: 50, bottom: 30, left: 40})
    .dimension(xf.dims.season)
    .group(xf.groups.season)
    .transitionDuration(10)
    .elasticY(true)
    .gap(1)
    .x(d3.scale.ordinal().domain(["Spring", "Summer", "Autumn", "Winter"]))
    .xUnits(dc.units.ordinal)
    .renderHorizontalGridLines(true);

  charts.len = dc.barChart('#len-chart')
    .width(400)
    .height(200)
    .margins({top: 10, right: 50, bottom: 30, left: 40})
    .dimension(xf.dims.len)
    .group(xf.groups.len)
    .transitionDuration(10)
    .elasticY(true)
    .centerBar(true)
    .xUnits(function () { return 40; })
    .x(d3.scale.linear().domain([0, 400]))
    .renderHorizontalGridLines(true);

  charts.species = dc.barChart('#species-chart')
    .width(400)
    .height(200)
    .margins({top: 10, right: 50, bottom: 30, left: 40})
    .dimension(xf.dims.species)
    .group(xf.groups.species)
    .transitionDuration(10)
    .elasticY(true)
    .gap(1)
    .x(d3.scale.ordinal().domain(["ats", "bkt", "bnt"]))
    .xUnits(dc.units.ordinal)
    .renderHorizontalGridLines(true);
  charts.species.xAxis().tickFormat(function (v) {
    return app.config.labels.species[v];
  });

  charts.river = dc.barChart('#river-chart')
    .width(400)
    .height(200)
    .margins({top: 10, right: 50, bottom: 30, left: 40})
    .dimension(xf.dims.river)
    .group(xf.groups.river)
    .transitionDuration(10)
    .elasticY(true)
    .gap(1)
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal)
    .renderHorizontalGridLines(true);
  charts.river.xAxis().tickFormat(function (v) {
    return app.config.labels.rivers[v];
  });

  charts.time = dc.lineChart('#time-chart')
    .width(800)
    .height(280)
    .margins({top: 10, right: 50, bottom: 30, left: 40})
    .transitionDuration(10)
    .dimension(xf.dims.time)
    .group(xf.groups.time)
    .x(d3.time.scale().domain(d3.extent(app.data.fish, function(d) { return d.date; })));

  charts.year.xAxis().tickFormat(function (v) {
    return v.toString();
  });

  dc.constants.EVENT_DELAY = 0;
  dc.renderAll();

  window.resetChart = function (name) {
    charts[name].filterAll();
    dc.redrawAll();
  }

  return charts;
}

function initMap (mapId) {
  var map = L.map(mapId).setView([42.434, -72.669], 15);

  L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 4,
    maxZoom: 18,
    ext: 'png'
  }).addTo(map);

  map._initPathRoot();

  var svg = d3.select("#" + mapId).select("svg"),
  g = svg.append("g").attr("id", "map-g");

  var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  return map;
}

function updateMapWatershed (watershed) {
  var riverColors = d3.scale.category10()
    .domain(app.config.domains[watershed].river);

  var radiusScale = d3.scale.sqrt()
    // .domain([50, 200]) // value.lenMean
    .domain([0, 1000]) // value.count
    // .domain([0, 1]) // value.count / max(value.count)
    // .domain([0, 0.1]) // value.count / total count
    .range([0, 15])
    .clamp(true);

  var featureData = app.xf.groups.riverSection.top(Infinity)
    .filter(function (d) {
      return d.key[0] === app.watershed;
    });

  featureData.sort(function (a, b) {
    var keyA = a.key[1] < 10 ? a.key[0] + "0" + a.key[1] : a.key[0] + a.key[1],
        keyB = b.key[1] < 10 ? b.key[0] + "0" + b.key[1] : b.key[0] + b.key[1];

    if (keyA < keyB) {
      return 1;
    }
    if (keyA > keyB) {
      return -1;
    }
    return 0;
  });

  var tooltip = d3.select(".tooltip")

  d3.select("#map-g").selectAll("circle");
  var feature = d3.select("#map-g").selectAll("circle")
    .data(featureData, function (d) {
      return d.key;
    });

  feature.enter()
    .append("circle")
    .style("stroke", "black")
    .style("opacity", 0.6)
    .style("fill", function (d) {
      return riverColors(d.key[1]);
    })
    .on("mouseover", function (d) {
      d3.select(this)
        .style("stroke", "red");

      tooltip.html(app.config.labels.rivers[d.key[1]] + ' - Section ' + d.key[2])
        .style("left", (d3.event.pageX + 15) + "px")
        .style("top", (d3.event.pageY - 15) + "px")
        .transition()
        .duration(100)
        .style("opacity", 1);
    })
    .on("mouseout", function (d) {
      d3.select(this)
        .style("stroke", "black");

      tooltip.transition()
        .duration(100)
        .style("opacity", 0);
    });

  feature.exit().remove();

  app.charts.section
    .on('renderlet', function(chart, filter){
      onFilter();
    });

  // fit map to features
  var featureArray = featureData.map(function (d) {
    var location = app.data.locationsMap.get(d.key);
    return location.LatLng;
  });
  app.map.fitBounds(L.latLngBounds(featureArray));

  app.map.on("viewreset", onViewReset);
  onViewReset();

  function onViewReset() {
    feature.attr("transform", function(d) {
      var location = app.data.locationsMap.get(d.key);

      if (!location) {
        console.error("Undefined: ", d.key);
      }
      return "translate("+
        app.map.latLngToLayerPoint(location.LatLng).x +","+
        app.map.latLngToLayerPoint(location.LatLng).y +")";
    });
  }

  function onFilter() {
    // var count = app.state.ndx.groupAll().value();
    // var maxCount = d3.max(riverSectionGroup.top(Infinity), function (d) {
    //   return d.value.count;
    // });
    // console.log(maxCount);
    feature
      .data(app.xf.groups.riverSection.top(Infinity), function (d) {
        return d.key;
      })
      .attr("r", function (d) {
        return radiusScale(d.value.count);
        // return radiusScale(maxCount > 0 ? d.value.count/maxCount : 0);
        // return radiusScale(count > 0 ? d.value.count/count : 0);
      });
  }
}

function selectWatershed (watershed) {
  dc.filterAll();

  app.watershed = watershed;
  app.xf.dims.watershed.filterExact(watershed);

  app.charts.river.x(d3.scale.ordinal().domain(app.config.domains[app.watershed].river));
  updateMapWatershed(app.watershed);

  dc.redrawAll();
}

function hideLoading () {
  d3.select('#loading')
    .style('opacity', 1)
    .transition()
    .duration(1000)
    .style('opacity', 0)
    .each('end', function () {
      d3.select(this).remove();
      startTour();
    });
}

function startTour () {
  var intro = introJs();
  intro.setOptions({
    showStepNumbers: false,
    steps: [
      {
        intro: '<p class="intro-intro text-center" style="font-size:20px">Welcome to the<br><strong>Crossfilter Tool</strong><br>for<br><strong>PIT Tagging Studies</strong><br>from the West Brook and Stanley Brook</p><p>Click Next to begin the tour of this dashboard, or Skip to quit the tour and get right to exploring the data.</p>'
      },
      {
        element: '#row-1',
        intro: '<p>These are histograms of categorical variables showing the number of individual fish captured for each category.</p><p>Each chart is interactive and allows you to select a subset of the data by clicking on one or more bars.</p><p>When you select one or more categories, the corresponding bars remain blue, while the unselected bars turn gray indicating that these categories are excluded from the dataset.</p><p>Click reset to clear any existing selections.</p><p>Whenever you select a subset of the data, all other charts will be automatically updated to reflect that subset.</p>'
      },
      {
        element: '#row-2',
        intro: '<p>These are histograms of continuous variables showing the number of individual fish captured within each bin.</p><p>On these charts, you can click-and-drag to create a window that will filter the dataset by a range of values.</p>'
      },
      {
        element: '#map',
        position: 'top',
        intro: '<p>The map shows the location of each section of the four branches.</p><p>The size of each circle is proportional to the number of fish captured in that section.</p>'
      },
      {
        element: '#time-chart',
        position: 'top',
        intro: 'The timeseries shows the number of fish captured on each sampling date. You can also click-and-drag on this chart to select a specific period of the dataset.'
      },
      {
        element: '#watershed-form',
        position: 'bottom',
        intro: 'Use the dropdown menu to switch between watersheds.'
      }
    ]
  })
  intro.start();
}

// export globals
window.app = app;
window.startTour = startTour;

})();
