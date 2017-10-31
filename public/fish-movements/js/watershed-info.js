
var watershed = {
  WB: {

    nextDown: [ 2,2,4,4,6,6,7,0 ], // Contiguous downstream river for each index (river #)
    terminalTrib: [ 1,1,0,1,0,1,0,0 ], // Is the river a terminal trib (eg.g no upstream movement possible)
    emigrationRiver: "WB",
    emigrationRiverN: 7,
    emigrationSection: -1,
    emigrationSectionN: 1,
    scaleRiverNtoRiver: d3.scaleOrdinal().domain(d3.range(0,8)).range(["WB","IL","WB","OL","WB","OS","WB","Em"]),
    uniqueRivers: ["WB","IL","OL","OS","Em"],
    uniqueSeasons: [1,2,3,4],
    scaleRivertoRiverHeatMap: d3.scaleOrdinal().domain(["WB","IL","OL","OS","Em"]).range([0,1,2,3,4]),
    sppScale: d3.scaleOrdinal().domain(["ats","bnt","bkt"]).range(["Atlantic salmon", "Brown trout", "Brook trout"]),
    sppScaleColor: d3.scaleOrdinal().domain(["bkt","bnt","ats"]).range([d3.rgb(162,205,174), d3.rgb(74,116,134), d3.rgb(36,45,66)]),
    initialSampleNumber: 31,
    siteTitle: "Trout and salmon in a small stream network in Western MA, USA"

  },
  SB: {

    nextDown: [ 2,2,3,4,0 ],
    terminalTrib: [ 1,1,0,0,0 ],
    emigrationRiver: "tidal",
    emigrationRiverN: 4,
    emigrationSection: -1,
    emigrationSectionN: 1,
    scaleRiverNtoRiver: d3.scaleOrdinal().domain(d3.range(0,5)).range(["west","east","mainstem","tidal","em"]),
    uniqueRivers: ["Main","West","East","Tide","Em"], // this is for the heatmap only
    uniqueSeasons: [2,3],
    scaleRivertoRiverHeatMap: d3.scaleOrdinal().domain(["mainstem","west","east","tidal","em"]).range([0,1,2,3,4]),
    sppScale: d3.scaleOrdinal().domain(["ats","bnt","bkt"]).range(["Atlantic salmon", "Brown trout", "Brook trout"]),
    sppScaleColor: d3.scaleOrdinal().domain(["bkt"]).range([d3.rgb(162,205,174)]),
    initialSampleNumber: 1,
    siteTitle: "Brook trout in a coastal stream network in Acadia National Park, ME, USA"

  }
};

function getRiverLabelXY(w){
  var wb = {
    wb: {x: width * 0.13, y: height * 0.5},
    ol: {x: width * 0.85, y: height * 0.10},
    os: {x: width * 0.60, y: height * 0.6},
    il: {x: width * 0.35, y: height * 0.2},
    em: {x: width * 0.13, y: height * 0.94}
  };
   var sb = {
    mainstem: {x: width * 0.25, y: height * 0.45},
    east:     {x: width * 0.92, y: height * 0.25},
    west:     {x: width * 0.76, y: height * 0.6},
    tidal:    {x: width * 0.06, y: height * 0.67},
    em:       {x: width * 0.02, y: height * 0.93}
  };

  switch(w){
    case "west":
      riverLabelXY = wb;
      break;
    case "stanley":
      riverLabelXY = sb;
      break;
  }
}

function fillTextRiver(w){
  if ( w == "west" ){
    context.fillText("WB", riverLabelXY.wb.x, riverLabelXY.wb.y);
    context.fillText("OL", riverLabelXY.ol.x, riverLabelXY.ol.y);
    context.fillText("OS", riverLabelXY.os.x, riverLabelXY.os.y);
    context.fillText("IL", riverLabelXY.il.x, riverLabelXY.il.y);
    context.fillText("EM", riverLabelXY.em.x, riverLabelXY.em.y);
  }
  else if ( w == "stanley" ){
    context.fillText("Main", riverLabelXY.mainstem.x, riverLabelXY.mainstem.y);
    context.fillText("East", riverLabelXY.east.x, riverLabelXY.east.y);
    context.fillText("West", riverLabelXY.west.x, riverLabelXY.west.y);
    context.fillText("Tide", riverLabelXY.tidal.x, riverLabelXY.tidal.y);
    context.fillText("Em", riverLabelXY.em.x, riverLabelXY.em.y);
  }
};
