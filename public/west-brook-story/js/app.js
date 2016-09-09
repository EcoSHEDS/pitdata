var app = window.app = {
  params: {
    fishPerCircle: 25,
    radius: 3
  },
  scales: {},
  state: {
    step: 'step1',
    groupby: 'none',
    colorby: 'none'
  },
  layout: {
    canvas: {
      margin: { top: 40, right: 40, bottom: 0, left: 100 }
    }
  },
  steps: {}
};

app.steps.step1 = {
  enter: function () {
    app.state.groupby = 'none';
    app.state.colorby = 'none';
  },
  exit: function () {
  }
};
app.steps.step2 = {
  enter: function () {
    app.state.groupby = 'species';
    app.state.colorby = 'species';
  },
  exit: function () {
  }
};
app.steps.step3 = {
  enter: function () {
    app.state.groupby = 'river';
    app.state.colorby = 'river';
  },
  exit: function () {
  }
};
app.steps.step4 = {
  enter: function () {
    app.state.groupby = 'season';
    app.state.colorby = 'season';
  },
  exit: function () {
  }
};
app.steps.step5 = {
  enter: function () {
    app.state.groupby = 'year';
    app.state.colorby = 'year';
  },
  exit: function () {
  }
};
app.steps.step6 = {
  enter: function () {
    app.state.groupby = 'seasonyear';
    app.state.colorby = 'year';
  },
  exit: function () {
  }
};
app.steps.step7 = {
  enter: function () {
    app.state.groupby = 'species';
    app.state.colorby = 'species';
    this.timeout = window.setTimeout( function() {
      app.state.groupby = 'seasonyear';
    }, 2000);
  },
  exit: function () {
    if (this.timeout) {
      // clear the timeout in case user switches to another state within 2 sec
      window.clearTimeout(this.timeout);
      delete this.timeout;
    }
  }
};
app.steps.step8 = {
  enter: function () {
    app.state.groupby = 'none';
    app.state.colorby = 'none';
  },
  exit: function () {
  }
};

app.initialize = function (url) {
  console.log('Loading data...');
  d3.csv(url, parseRow, function (error, data) {
    if (error) {
      alert('Error occurred trying to load data.');
      throw error;
    }

    console.log('Initializing interface...');

    data = data.filter(function(d) {
      return d.enc == 1;
    });
    app.nodes = initializeNodes(data, app.params.fishPerCircle);

    app.layout.canvas = initializeCanvas('#viz-canvas', app.layout.canvas);
    app.layout.legend = initializeLegend('#legend-canvas');
    app.layout.labels = initializeLabels('#chart-container');
    app.scales = initializeScales(app.layout.canvas, app.nodes);
    app.simulation = initializeSimulation(app.nodes, app.layout.canvas, app.params.radius);


    initializeControls();

    switchStep(app.state.step);
  });
}


function parseRow (d) {
  d.sample = +d.sample;
  d.date = Date.parse(d.date);
  d.id = +d.id;
  d.section = +d.section;
  d.len = +d.len;
  d.wt = +d.wt;
  d.enc = +d.enc;
  d.moveDir = +d.moveDir;
  d.distMoved = +d.distMoved;
  d.lagSection = +d.lagSection;
  d.season = d.seasonStr;
  d.year = +d.year;
  d.cohortFamilyID = d.cohortFamilyID;
  d.familyID = +d.familyID;
  d.minSample = +d.minSample;
  d.maxSample = +d.maxSample;
  d.familyCount = +d.familyCount;
  d.riverAbbr = d.river;
  d.age = +d.age;
  d.dateEmigrated = Date.parse(d.dateEmigrated);
  d.isYOY = +d.isYOY;
  return d;
}

function initializeNodes (data, fishPerCircle) {
  var result = [];

  var nest = d3.nest()
    .key(function (d) {
      // creates a compound key as string (e.g. "bkt,IL,Spring,2013")
      return [d.species, d.river, d.season, d.year];
    })
    .rollup(function (leaves) {
      return leaves.length;
    })
    .entries(data);

  nest.forEach(function (d) {
    var key = d.key.split(","), // "bkt,IL,Spring,2013" -> ["bkt", "IL", "Spring", 2013]
        fishCount = d.value,
        circleCount = parseInt(fishCount / fishPerCircle);

    for (var i = 0; i < circleCount; i++) {
      result.push({
        species: key[0],
        river: key[1],
        season: key[2],
        year: key[3]
      });
    }
  });

  result.forEach(function(d) {
    d.color = "lightgrey";
    d.year = +d.year;
  });

  var sorter = firstBy(function (d) { return d.species; })
    .thenBy("river")
    .thenBy("season");
  result.sort(sorter);

  return result;
}

function initializeControls () {
  // update footnote
  d3.select('#fish-per-circle').text(app.params.fishPerCircle);
  d3.select('#chart-footnote').style('display', 'block');

  // setup listeners on groupby buttons
  var state = app.state;
  d3.selectAll('.btn-groupby').on('click', function () {
    // extract value of selected button
    state.groupby = d3.select(this).attr('data-value');

    // update active groupby button
    d3.selectAll('.btn-groupby').classed('active', false);
    d3.select(this).classed('active', true);

    redraw();
  });
  // set initial active groupby button
  d3.select('.btn-groupby[data-value="' + state.groupby + '"]').classed('active', true);

  // setup listeners on colorby buttons
  d3.selectAll('.btn-colorby').on('click', function () {
    // extract value of selected button
    state.colorby = d3.select(this).attr('data-value');

    // update active colorby button
    d3.selectAll('.btn-colorby').classed('active', false);
    d3.select(this).classed('active', true);

    redraw();
  });
  // set initial active colorby button
  d3.select('.btn-colorby[data-value="' + state.colorby + '"]').classed('active', true);

  // setup listeners on step buttons
  d3.selectAll('.step').on('click', function () {
    var step = d3.select(this).attr('data-value');
    switchStep(step);
  });

  // $("#all").on("click", function () {
  //   console.log("#all click");
  //   getGroupbyPosition("all");
  //   posVar = "all";
  //   drawLabels(posVar); // to empty out the labels if return to here
  //   simulation.alpha(1).nodes(state.counts).restart();
  // });
  // $("#species").on("click", function () {
  //   console.log("#species click");
  //   getGroupbyPosition("species");
  //   posVar = "species";
  //   drawLabels(posVar);
  //   simulation.alpha(1).nodes(state.counts).restart();
  // });
  // $("#river").on("click", function () {
  //   console.log("#river click");
  //   getGroupbyPosition("river");
  //   posVar = "river";
  //   drawLabels(posVar);
  //   simulation.alpha(1).nodes(state.counts).restart();
  // });
  // $("#season").on("click", function () {
  //   console.log("#season click");
  //   getGroupbyPosition("season");
  //   posVar = "season";
  //   drawLabels(posVar);
  //   simulation.alpha(1).nodes(state.counts).restart();
  // });
  // $("#year").on("click", function () {
  //   console.log("#year click");
  //   getGroupbyPosition("year");
  //   posVar = "year";
  //   drawLabels(posVar);
  //   // sim was not completing - run 3/4 way, then start again seems to work well
  //   simulation.alpha(1).alphaMin(0.75).nodes(state.counts).restart()
  //     .on( "end", function(){simulation.alpha(1).nodes(state.counts).restart()} );
  // });
  // $("#seasonYear").on("click", function () {
  //   console.log("#seasonYear click");
  //   getGroupbyPosition("seasonYear");
  //   posVar = "seasonYear";
  //   drawLabels(posVar);
  //   simulation.alpha(1).alphaMin(0.75).nodes(state.counts).restart()
  //     .on( "end", function(){simulation.alpha(1).nodes(state.counts).restart()} );
  // });
  // $("#colorSpecies").on("click", function () {
  //   console.log("#colorSpecies click");
  //   state.counts.forEach(function(d){ d.color = sppColor( d.species )  });
  //   ticked();
  //   canvasL.height = 125;
  //   contextL.clearRect(0, 0, canvasL.width, canvasL.height);
  //   spp.forEach(function(d,i) {drawLegend(d,i,"species")});
  // });
  // $("#colorRiver").on("click", function () {
  //   console.log("#colorSpecies click");
  //   state.counts.forEach(function(d){ d.color = riverColor( d.river )  });
  //   ticked();
  //   canvasL.height = 150;
  //   contextL.clearRect(0, 0, canvasL.width, canvasL.height);
  //   riv.forEach(function(d,i) {drawLegend(d,i,"river")});
  // });
  // $("#colorSeason").on("click", function () {
  //   console.log("#colorSeason click");
  //   state.counts.forEach(function(d){ d.color = seasonColor( d.season )  });
  //   ticked();
  //   canvasL.height = 150;
  //   contextL.clearRect(0, 0, canvasL.width, canvasL.height);
  //   sea.forEach(function(d,i) {drawLegend(d,i,"season")});
  // });
  // $("#colorYear").on("click", function () {
  //   console.log("#colorYear click");
  //   state.counts.forEach(function(d){ d.color = yearColor( d.year )  });
  //   ticked();
  //   canvasL.height = 500;
  //   contextL.clearRect(0, 0, canvasL.width, canvasL.height);
  //   yea.forEach(function(d,i) {drawLegend(d,i,"year")});
  // });

  // $("#reset").on("click", function () {
  //   console.log("#reset click");
  //   //location.reload();
  //   //$("#all").click();
  //   state.counts.forEach(function(d){ d.color = "lightgrey" });
  //   ticked();
  //   contextL.clearRect(0, 0, canvasL.width, canvasL.height);
  //   canvasL.height = 0;
  // });

  // remove loading splash
  d3.select('#loading')
    .style('opacity', 1)
    .transition()
    .duration(1000)
    .style('opacity', 0)
    .on('end', function () {
      // after transition, hide element
      d3.select(this).style('display', 'none');
  });
}

function switchStep (step) {
  // exit current step
  app.steps[app.state.step].exit();

  // update app state to next step
  app.state.step = step;

  // enter next step
  app.steps[app.state.step].enter();

  // update active step button
  d3.selectAll('.step').classed('selected', false);
  d3.select('.step[data-value="' + app.state.step + '"]').classed('selected', true);

  // show next step narration
  d3.selectAll('.narration-step').style('display', 'none');
  d3.select('#narration-' + app.state.step).style('display', 'block');

  redraw();
}

function initializeGroupbyPositions (w, h) {
}

function initializeScales (canvas, data) {
  var width = canvas.width,
      height = canvas.height,
      margin = canvas.margin;

  var labels = {},
      color = {},
      groupby = {};

  // label scales
  labels.species = d3.scaleOrdinal()
    .domain(["ats","bnt","bkt"])
    .range(["Atlantic salmon", "Brown trout", "Brook trout"]);
  labels.river = d3.scaleOrdinal()
    .domain(["WB","OL","OS","IL"])
    .range(["Main branch","Large tributary","Small tributary","Isolated trib."]);

  // color scales
  var greens = ['#A6CEE3', '#1F78B4', '#B2DF8A', '#33A02C'];
  color.none = function (d) {
    return 'lightgrey';
  };
  color.species =  d3.scaleOrdinal()
    .domain(["ats","bnt","bkt"])
    .range(greens);
  color.river = d3.scaleOrdinal()
    .domain(["WB","OL","OS","IL"])
    .range(greens);
  color.season = d3.scaleOrdinal()
    .domain(["Spring","Summer","Autumn","Winter"])
    .range(greens);
  color.year = d3.scaleOrdinal(d3.schemeCategory20c);

  // groupby position scales
  var xProp = [0.33, 0.5, 0.66],
      yProp = [0.33, 0.5, 0.66];

  groupby.none = function () {
    return [width * xProp[1], height * yProp[1]];
  };
  groupby.species = function (d) {
    var positions = {
      ats: [width * xProp[1], height * yProp[2]],
      bkt: [width * xProp[0], height * yProp[0]],
      bnt: [width * xProp[2], height * yProp[0]]
    };
    return positions[d.species];
  };
  groupby.river = function (d) {
    var positions = {
      WB: [width * xProp[0], height * yProp[0]],
      OL: [width * xProp[0], height * yProp[2]],
      OS: [width * xProp[2], height * yProp[0]],
      IL: [width * xProp[2], height * yProp[2]]
    };
    return positions[d.river];
  };
  groupby.season = function (d) {
    var positions = {
      Spring: [width * xProp[0], height * yProp[0]],
      Summer: [width * xProp[0], height * yProp[2]],
      Autumn: [width * xProp[2], height * yProp[0]],
      Winter: [width * xProp[2], height * yProp[2]]
    };
    return positions[d.season];
  };

  var scaleYearX = d3.scaleLinear()
    .domain(d3.extent(data, function (d) { return d.year; }))
    .range([margin.left, width - margin.left - margin.right]);
  groupby.year = function (d) {
    return [scaleYearX(d.year), height * 0.5];
  };

  var seasons = ["Spring", "Summer", "Autumn", "Winter"],
      scaleSeasonY = d3.scaleLinear()
                       .domain([0, 3])
                       .range([100, height - 200]);
  groupby.seasonyear = function (d) {
    return [scaleYearX(d.year), 40 + scaleSeasonY(seasons.indexOf(d.season))];
  };

  return {
    labels: labels,
    color: color,
    groupby: groupby
  };
}

function initializeSimulation (nodes, canvas, radius) {
  var simulation = d3.forceSimulation()
    .force("charge",
           d3.forceManyBody()
             .strength(- radius + 1)) // strength of attraction among points [ - repels, + attracts ]
             // .distanceMax(200))
    .force("collide",
           d3.forceCollide()
             .radius(radius + 1.02)) // (function(d) { return ageScale(d.currentAge) + 1.025; })
    .force("x", d3.forceX().x(function (d) { return d.xx; }))
    .force("y", d3.forceY().y(function (d) { return d.yy; }))
    .alphaMin(0.01)
    .nodes(nodes)
    .on("tick", function () {
      ticked(canvas, nodes, radius);
    });

  return simulation;
}

function initializeCanvas (el, options) {
  var el = document.querySelector(el),
      context = el.getContext("2d");

  var margin = options.margin,
      width = el.width - margin.left - margin.right,
      height = el.height - margin.top - margin.bottom;

  // TODO: Add interaction
  // d3.select(el)
  //   .on("mousemove", mouseMoved)
  //   .call(d3.drag()
  //     .container(el)
  //     .subject(clickDot)  // acts as 'onclick'
  //   );

  return {
    el: el,
    context: context,
    margin: margin,
    width: width,
    height: height
  }
}

function initializeLegend (el) {
  var canvas = document.querySelector(el),
      context = canvas.getContext("2d");

  var margin = {top: 0, right: 0, bottom: 0, left: 0},
      width = canvas.width - margin.left - margin.right,
      height = 0; //canvas.height - margin.top - margin.bottom;

  return {
    el: canvas,
    context: context,
    margin: margin,
    width: width,
    height: height
  }
}

function initializeLabels (el) {
  var svg = d3.select(el)
    .append('svg')
    .append('g');
  return svg;
}

// DRAWING FUNCTIONS ----------------------------------------------------------
function redraw () {
  // update target and color of each node based on current state
  updateNodes(app.nodes, app.state, app.scales);

  // TODO: update legend
  // TODO: update labels

  // restart simulation
  if (app.state.groupby == 'year') {
    // hack to restart simulation after 50% completion in order to get all
    // nodes to move to their groups (otherwise nodes get stuck in wrong group)
    app.simulation
      .alpha(1)
      .alphaMin(0.5)
      .nodes(app.nodes)
      .restart()
      .on('end', function () {
        app.simulation
          .alpha(1)
          .alphaMin(0.01)
          .nodes(app.nodes)
          .restart()
          .on('end', function () {}); // need to turn off the end event, otherwise simulation will infinitely restart
      });
  } else {
    app.simulation
      .alpha(1)
      .nodes(app.nodes)
      .restart();
  }
}

function updateNodes (nodes, state, scales) {
  var groupby = state.groupby,
      colorby = state.colorby,
      groupbyScale = scales.groupby[groupby],
      colorScale = scales.color[colorby];

  nodes.forEach(function (d) {
    // update target position (focus)
    d.xx = groupbyScale(d)[0];
    d.yy = groupbyScale(d)[1];

    // update node color
    d.color = colorScale(d[colorby]);
  });
}

function drawNode(d, radius, context){
  context.beginPath();
  context.arc( d.x, d.y, radius, 0, 2 * Math.PI);

  context.strokeStyle = d3.rgb(d.color).darker(1);
  context.stroke();
  context.fillStyle = d.color;
  context.fill();
}

function ticked (canvas, nodes, radius) {
  var context = canvas.context;
  context.clearRect(0, 0, canvas.el.width, canvas.el.height);
  context.save();
  context.translate(canvas.margin.left, canvas.margin.top); // subtract the margin values whenever use simulation.find()

  nodes.forEach(function (d) {
    drawNode(d, radius, context);
  });

  context.restore();
}

function drawLegend (d, i, variable) {
  var col, txt, numrows;

  switch (variable) {
   case "species":
     col = d3.rgb(sppColor( d ));
     txt = sppScale(d);
     numRows = spp.length;
     break;
   case "river":
     col = d3.rgb(riverColor( d ));
     txt = d;
     numRows = riv.length;
     break;
   case "season":
     col = d3.rgb(seasonColor( d ));
     txt = d;
     numRows = sea.length;
     break;
   case "year":
     col = d3.rgb(yearColor( d ));
     txt = d;
     numRows = yea.length;
     break;
  }

  // scale the legend canvas to # or rows
  var vOffset = 25;

  heightL = canvasL.height - marginL.top - marginL.bottom;
  var radius = 5; vOffsetText = radius/2;
  var w = 10, h = (heightL/2 + vOffset*numRows/2 - vOffset) - vOffset * i;

  contextL.save();
  contextL.translate(0.5, 0.5);

  contextL.beginPath();
  contextL.arc(w, h, radius, 0, 2 * Math.PI);
  contextL.strokeStyle = col.darker(2);
  contextL.stroke();
  contextL.fillStyle = col;
  contextL.fill();
  contextL.font = "20px calibri";
  contextL.fillText(txt ,w + 20, h + vOffsetText);

  contextL.restore();
}

function drawLabels (posVar) {
  posData = [];
  d3.selectAll("text").remove();

  switch(posVar){
    case "species":
      spp.forEach(function(d,i) {getPosData(d,i,posVar)});
    break;
    case "river":
      riv.forEach(function(d,i) {getPosData(d,i,posVar)});
    break;
    case "season":
      sea.forEach(function(d,i) {getPosData(d,i,posVar)});
    break;
    case "year":
      yea.forEach(function(d,i) {getPosData(d,i,posVar)});
    break;
    case "seasonYear":
      sea.forEach(function(d,i) {getPosData(d,i,posVar,'s')});
      yea.forEach(function(d,i) {getPosData(d,i+4,posVar,'y')}); // +4 is a hack, cause I cound't get updating to work in V4
    break;
  }

  textLabel = svgContainer.selectAll("text")
    .data(posData);

  textLabel
    .enter()
    .append("text")
    .attr("x", function(d) { return d.xPos; })
    .attr("y", function(d) { return d.yPos; })
    .text( function (d) { return d.txt; })
    .attr("font-family", function (d) { return d.fontFamily; })
    .attr("font-size", function (d) { return d.fontSize; })
    .attr("fill", function(d) { return d.col; });
}


// GLOBALS --------------------------------------------------------------------

// var xy, posVar, posData = [], xPos, yPos, textLabel;

// var byFish;

// var spp, riv, sea, yea;
// // var spp = ["bkt", "bnt", "ats"].reverse();//sortUnique(cd.map(function(d){return d.species}));
// // var riv = [ "WB", "OL", "OS", "IL"].reverse(); //sortUnique(cd.map(function(d){return d.river}));
// // var sea = [ "Spring", "Summer", "Autumn", "Winter"].reverse(); // sortUnique(cd.map(function(d){return d.season}));
// // var yea = sortUnique(data.map(function(d){return d.year}));

// var uniqueYears, stepWidth, uniqueSeasons, stepHeight;

// var searchRadius = 5;

// var tooltip = d3.select("body")
//   .append("div")
//     .attr("class", "tooltip")
//     .style("position", "absolute")
//     .style("z-index", "10")
//     .style("visibility", "hidden");

// FUNCTIONS ------------------------------------------------------------------

// function getDataSRSY(d,spp,riv,sea,yea){
//  return d.filter( function(dd) {
//    return dd.species == spp && dd.river == riv && dd.season == sea && dd.year == yea ;
//  });
// }






function getPosData(d,i,variable,sOrY){
  var col,txt;
  var fontSize = "24px";
  var fontFamily = "calibri";

  switch(variable){
    case "species":
      switch(d){
        case "ats":
          xPos = xy.species.ats[0] + 200;
          yPos = xy.species.ats[1] + 50;
          col = d3.rgb(sppColor( d ));
          txt = sppScale(d);
          break;
        case "bkt":
          xPos = xy.species.bkt[0] - 300;
          yPos = xy.species.bkt[1] - 120;
          col = d3.rgb(sppColor( d ));
          txt = sppScale(d);
          break;
        case "bnt":
          xPos = xy.species.bnt[0] + 175;
          yPos = xy.species.bnt[1] - 100;
          col = d3.rgb(sppColor( d ));
          txt = sppScale(d);
          break;
      }
      break;
    case "river":
      switch(d){
        case "WB":
          xPos = xy.river.WB[0] - 300;
          yPos = xy.river.WB[1] - 150;
          col = d3.rgb(riverColor( d ));
          txt = riverScale( d );
          break;
        case "OL":
          xPos = xy.river.OL[0] - 300;
          yPos = xy.river.OL[1] + 100;
          col = d3.rgb(riverColor( d ));
          txt = riverScale( d );
          break;
        case "OS":
          xPos = xy.river.OS[0] + 150;
          yPos = xy.river.OS[1] - 50;
          col = d3.rgb(riverColor( d ));
          txt = riverScale( d );
          break;
        case "IL":
          xPos = xy.river.IL[0] + 150;
          yPos = xy.river.IL[1] + 100;
          col = d3.rgb(riverColor( d ));
          txt = riverScale( d );
          break;
      }
      break;
    case "season":
     switch(d){
        case "Spring":
          xPos = xy.season.Spring[0] - 250;
          yPos = xy.season.Spring[1] - 150;
          col = d3.rgb(seasonColor( d ));
          txt = d;
          break;
        case "Summer":
          xPos = xy.season.Summer[0] - 250;
          yPos = xy.season.Summer[1] + 100;
          col = d3.rgb(seasonColor( d ));
          txt = d;
          break;
        case "Autumn":
          xPos = xy.season.Autumn[0] + 200;
          yPos = xy.season.Autumn[1] - 150;
          col = d3.rgb(seasonColor( d ));
          txt = d;
          break;
        case "Winter":
          xPos = xy.season.Winter[0] + 200;
          yPos = xy.season.Winter[1] + 100;
          col = d3.rgb(seasonColor( d ));
          txt = d;
          break;
      }
      break;
    case "year":
      xPos = scaleWidthYear( uniqueYears.indexOf(d) * stepWidth + stepWidth );
      yPos = height * 0.95;
      col = d3.rgb(yearColor( d ));
      txt = d;
      fontSize = "20px";
      break;
    case "seasonYear":
      if (sOrY == "y"){
        xPos = scaleWidthSeasonYear( uniqueYears.indexOf(d) * stepWidth + stepWidth );
        yPos = height * 1;
        col = d3.rgb(yearColor( d ));
        txt = d;
        fontSize = "20px";
      }
      else if (sOrY == "s"){
        switch(d){
          case "Spring":
            xPos = 25 - margin.left;
            yPos = 20;
            col = '#cccccc';//d3.rgb(seasonColor( d ));
            txt = d;
            break;
          case "Summer":
            xPos = 25 - margin.left;
            yPos = 140;
            col = '#cccccc';//d3.rgb(seasonColor( d ));
            txt = d;
            break;
          case "Autumn":
            xPos = 25 - margin.left;;
            yPos = 250;
            col = '#cccccc';//d3.rgb(seasonColor( d ));
            txt = d;
            break;
          case "Winter":
            xPos = 25 - margin.left;;
            yPos = 410;
            col = '#cccccc';//d3.rgb(seasonColor( d ));
            txt = d;
            break;
        }
      }
      break;
  }

  posData[i] = { xPos: xPos + margin.left,
                 yPos: yPos + margin.top,
                 col: col,
                 txt: txt,
                 fontSize: fontSize,
                 fontFamily: fontFamily
               };
}

// INTERACTION ----------------------------------------------------------------

function clickSubject() {
  console.log("mouseClickSubject",d3.event.x,d3.event.y,simulation.find(d3.event.x - margin.left, d3.event.y - margin.top, searchRadius));
  return simulation.find(d3.event.x - margin.left, d3.event.y - margin.top, searchRadius);
}

function clickDot(){

  var d = clickSubject();
  console.log("selected",d.id);

}

function mouseMoved() {
  var a = this.parentNode,
      m = d3.mouse(this),
      d = simulation.find(m[0]- margin.left , m[1]- margin.top , searchRadius);

  if (!d) return a.removeAttribute("title"), tooltip.style('visibility','hidden');

  a.setAttribute("title", sppScale(d.species) + ", " + d.river + ", " +  d.season + ", " + d.year);

  tooltip
    .style("visibility", "visible");
}

// UTILITIES ------------------------------------------------------------------

function uniques(array) {
  return Array.from(new Set(array));
}

function sortUnique(arr) {
  arr.sort();
  var last_i;
  for (var i=0;i<arr.length;i++) {
    if ((last_i = arr.lastIndexOf(arr[i])) !== i) {
      arr.splice(i+1, last_i-i);
    }
  }
  return arr;
}

/*** Copyright 2013 Teun Duynstee Licensed under the Apache License, Version 2.0 https://github.com/Teun/thenBy.js ***/
firstBy=function(){function n(n){return n}function t(n){return"string"==typeof n?n.toLowerCase():n}function r(r,e){if(e="number"==typeof e?{direction:e}:e||{},"function"!=typeof r){var i=r;r=function(n){return n[i]?n[i]:""}}if(1===r.length){var u=r,o=e.ignoreCase?t:n;r=function(n,t){return o(u(n))<o(u(t))?-1:o(u(n))>o(u(t))?1:0}}return-1===e.direction?function(n,t){return-r(n,t)}:r}function e(n,t){var i="function"==typeof this?this:!1,u=r(n,t),o=i?function(n,t){return i(n,t)||u(n,t)}:u;return o.thenBy=e,o}return e}();


// APP CODE -------------------------------------------------------------------

// var sppScale = d3.scaleOrdinal().domain(["ats","bnt","bkt"]).range(["Atlantic salmon", "Brown trout", "Brook trout"]);
// var riverScale = d3.scaleOrdinal().domain(["WB","OL","OS","IL"]).range(["Main branch","Large tributary","Small tributary","Isolated trib."]);

// var fourColors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c']
// var sppColor = d3.scaleOrdinal().domain(["ats","bnt","bkt"]).range(fourColors);//[d3.rgb(162,205,174), d3.rgb(74,116,134), d3.rgb(36,45,66)]); //ICE+20

// //var riverColor = d3.scaleOrdinal().domain(["WB","OL","OS","IL"]).range([d3.schemeCategory20[0], d3.schemeCategory20[2],d3.schemeCategory20[4],d3.schemeCategory20[6]]);

// var riverColor = d3.scaleOrdinal().domain(["WB","OL","OS","IL"]).range(fourColors);

// //var riverColor = d3.scaleOrdinal().domain(["WB","OL","OS","IL"]).range([d3.rgb(162,205,174), d3.rgb(74,116,134), d3.rgb(36,45,66), d3.rgb(16,25,46)]); //ICE+20

// var seasonColor = d3.scaleOrdinal().domain(["Spring","Summer","Autumn","Winter"]).range(fourColors);//[d3.rgb(162,205,174), d3.rgb(74,116,134), d3.rgb(36,45,66), d3.rgb(16,25,46)]); //ICE+20
// //var yearColor = d3.scaleOrdinal().domain(d3.range(0,3)).range([d3.rgb(162,205,174), d3.rgb(74,116,134), d3.rgb(36,45,66), d3.rgb(16,25,46)]); //ICE+20

// var yearColor = d3.scaleOrdinal(d3.schemeCategory20c);

/////////////////////
// set up map graphics

