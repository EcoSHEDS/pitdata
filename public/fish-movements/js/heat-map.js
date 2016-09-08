// http://bl.ocks.org/mbostock/3074470

function drawHeatMap(){
  var boxesXY = uniqueRivers.length,
      boxDim = 40;

  getPropMoved();

  var col = d3.scaleLinear().domain([0,1]).range([d3.rgb(172,215,184), d3.rgb(36,45,66)]);

  image = contextT.createImageData(boxesXY*boxDim, boxesXY*boxDim);

  for (var i = 0, p = -1; i < boxesXY; ++i) {
    for (var j = 0; j < boxDim; ++j) {
      for (var k = 0; k < boxesXY; ++k) {
        for (var l = 0; l < boxDim; ++l) {
          var c = d3.rgb( col(propMoved[k][i]) );
     //     var c = col(counts[k][i]);
    //     console.log(i,j,k,l,p,c)
          image.data[++p] = c.r;
          image.data[++p] = c.g;
          image.data[++p] = c.b;
          image.data[++p] = 255;
        }
      }
    }
  }

  contextT.clearRect(0, 0, canvasT.width, canvasT.height);

  var xOffset = 16*2, yOffset = 16*2, fontSize = 14;

  contextT.putImageData(image, xOffset, yOffset);

  contextT.font = fontSize + "px calibri";

  contextT.fillStyle = d3.rgb('50','50','50');
  contextT.fillText("From: ", boxesXY*boxDim/1.75, fontSize-4);

  for (var ii = 0; ii < boxesXY; ++ii) {
    // horizontal river labels
    contextT.fillStyle = d3.rgb('50','50','50');
    contextT.fillText(uniqueRivers[ii], ii*boxDim + xOffset + boxDim/5, yOffset - 2);
    for (var kk = 0; kk < boxesXY; ++kk) {
      var t;
      if (propMoved[ii][kk] === 0 ) t = 0;
      else t = propMoved[ii][kk].toFixed(2);
      contextT.fillStyle = d3.rgb('230','230', '230');
      contextT.fillText(t, ii*boxDim + xOffset + boxDim/5, kk*boxDim + yOffset + boxDim/1.75);
    }
  }
  contextT.fillStyle = d3.rgb('50','50','50');

  //Vertical river labels
  for (var v = 0; v < boxesXY; ++v) {
    contextT.fillText(uniqueRivers[v], 2, v*boxDim + yOffset + boxDim/1.75);
  }

}


function getPropMoved(){

  counts = fill2D(uniqueRivers.length,uniqueRivers.length,0);

  state.nodesRender.forEach( function(d){ //d.startEnd = scaleRiverNtoRiver(d.nodePossiblePath[0].startRiverN)
                                          //             .concat("_" + scaleRiverNtoRiver(d.nodePossiblePath[0].endRiverN));
                                          d.startRiver = scaleRiverNtoRiver(d.nodePossiblePath[0].startRiverN);
                                          d.endRiver =   scaleRiverNtoRiver(d.nodePossiblePath[0].endRiverN);
                                          d.startEnd = d.startRiver.concat("_" + d.endRiver);

            // sum up transitions from startRiver to endRiver
            counts[scaleRivertoRiverHeatMap(d.startRiver)][scaleRivertoRiverHeatMap(d.endRiver)] =
            counts[scaleRivertoRiverHeatMap(d.startRiver)][scaleRivertoRiverHeatMap(d.endRiver)] + 1;
                                        }
                           );

  propMoved = fill2D(uniqueRivers.length,uniqueRivers.length,0);

  for (var i = 0; i < uniqueRivers.length; ++i) {
    for (var j = 0; j < uniqueRivers.length; ++j) {

      if (state.propMovedDD == "all") propMoved[i][j] = counts[i][j] / state.nodesRender.length;   // as a prop of all fish
      else if (state.propMovedDD == "byRiver") propMoved[i][j] = counts[i][j] / (d3.sum(counts[i]) + 0.0001); // as a prop of fish by  river// 0.0001 to avoind div by 0 error for em column
    }
  }


/*
  propMoved = d3.nest()
                .key(function(d){return d.startEnd;})
                .rollup(function(v) { return {
                   count: v.length,
                   startRiver: d3.min(v.startRiver),
                   endRiver: d3.min(v.endRiver)
                }})
                .entries(state.nodesRender);

      propMoved = d3.nest()
                .key(function(d){return d.startRiver;})
                .key(function(d){return d.endRiver;})
                .rollup(function(v) { return {
                   count: v.length
//                     startRiver: d3.min(v.startRiver),
//                   endRiver: d3.min(v.endRiver)
                }})
                .entries(state.nodesRender);


  propMoved.values.forEach(function(d) {
    d.prop = d.values.count / state.nodesRender.length;
  });
*/
  return propMoved;
}