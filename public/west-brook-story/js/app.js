// GLOBALS --------------------------------------------------------------------
var state = {
  forceX: undefined,
  forceY: undefined,
  nodes: undefined,
  counts: []
};

var xy, posVar, posData = [], xPos, yPos, textLabel;

var byFish;

var spp, riv, sea, yea;

var fishPerCircle = 25;

var csvIn = {};

var uniqueYears, stepWidth, uniqueSeasons, stepHeight;

var initialRadius = 3;

var searchRadius = 5;

var tooltip = d3.select("body")
  .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");


// var sppText = " <u>Brook trout</u> are native and reproduce naturally.</p>  <u>Brown trout</u> reproduce naturally, but were introduced from Europe in the mid 1800â€™s.</p>  <u>Atlantic salmon</u> were native but do not reproduce naturally. They were stocked as 25 mm fry in the spring.";

// var riverText = " <u>WB</u> is the mainstem and has the most area. </p>  <u>OL</u> is a Large, Open tributary, with a  fully passable culvert. </p>  <u>OS</u> is a Small, Open tributary, with a perched culvert until the Nature Conservancy replaced it in 2013. </p>  <u>IL</u> is a Large, Isolated tributary with an impassable waterfall at the confluence with WB";

// var riverText2 = " All three species lived in the <u>WB</u>. </p>  <u>OL</u> had mostly brook trout with some brown trout. </p>  <u>OS</u> was almost all brook trout. </p>  <u>IL</u> contained only brook trout.";

// var seasonText = "Most fish were caught in Autumn, when we could first tag the youngest fish";

// var stepText = [
//   "dummy",
//   "From 1997 to 2015, we tagged almost 30,000 individual fish. </p> Those fish were captured a total of 63,232 times, many just once, some up to 10 times. </p> In the dot cloud, each circle is 25 fish captures.",
//   "There were three <b>species</b> of fish in the stream. </p>" + sppText,
//   "There were four <b>rivers</b> in the stream network. </p> add map here" ,
//   "We sampled in four <b>seasons</b>. </p>" + seasonText,
//   "We sampled for 19 <b>years</b>.</p> There were high abundances in some years (e.g. 2003) and low abundances in others (e.g. 2011).",
//   "Over the 19 <b>years</b> of sampling we couldn't sample the winter in some years because of ice.",
//   "We started tagging <b>trout</b> in the WB in 2000 and in the WB and the tributaries in 2002.</p> We stopped stocking <b>salmon</b> in 2004. By 2008, there were very few salmon left in the stream network",
//   "Explore the data by <b>yourself</b> by clicking buttons to <u>position</u> and <u>color</u> the circles."
// ];

// FUNCTIONS ------------------------------------------------------------------

function typeCoreData(d){
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

function initializeInterface(){

   $("#all").on("click", function () {
     console.log("#all click");
     getXY("all");
     posVar = "all";
     drawPositionLabels(posVar); // to empty out the labels if return to here
     simulation.alpha(1).nodes(state.counts).restart();
   });
   $("#species").on("click", function () {
     console.log("#species click");
     getXY("species");
     posVar = "species";
     drawPositionLabels(posVar);
     simulation.alpha(1).nodes(state.counts).restart();
   });
   $("#river").on("click", function () {
     console.log("#river click");
     getXY("river");
     posVar = "river";
     drawPositionLabels(posVar);
     simulation.alpha(1).nodes(state.counts).restart();
   });
   $("#season").on("click", function () {
     console.log("#season click");
     getXY("season");
     posVar = "season";
     drawPositionLabels(posVar);
     simulation.alpha(1).nodes(state.counts).restart();
   });
   $("#year").on("click", function () {
     console.log("#year click");
     getXY("year");
     posVar = "year";
     drawPositionLabels(posVar);
     // sim was not completing - run 3/4 way, then start again seems to work well
     simulation.alpha(1).alphaMin(0.75).nodes(state.counts).restart()
       .on( "end", function(){simulation.alpha(1).nodes(state.counts).restart()} );
   });
   $("#seasonYear").on("click", function () {
     console.log("#seasonYear click");
     getXY("seasonYear");
     posVar = "seasonYear";
     drawPositionLabels(posVar);
     simulation.alpha(1).alphaMin(0.75).nodes(state.counts).restart()
       .on( "end", function(){simulation.alpha(1).nodes(state.counts).restart()} );
   });
//
   $("#colorSpecies").on("click", function () {
     console.log("#colorSpecies click");
     state.counts.forEach(function(d){ d.color = sppColor( d.species )  });
     ticked();
     canvasL.height = 125;
     contextL.clearRect(0, 0, canvasL.width, canvasL.height);
     spp.forEach(function(d,i) {drawLegend(d,i,"species")});
   });
   $("#colorRiver").on("click", function () {
     console.log("#colorSpecies click");
     state.counts.forEach(function(d){ d.color = riverColor( d.river )  });
     ticked();
     canvasL.height = 150;
     contextL.clearRect(0, 0, canvasL.width, canvasL.height);
     riv.forEach(function(d,i) {drawLegend(d,i,"river")});
   });
   $("#colorSeason").on("click", function () {
     console.log("#colorSeason click");
     state.counts.forEach(function(d){ d.color = seasonColor( d.season )  });
     ticked();
     canvasL.height = 150;
     contextL.clearRect(0, 0, canvasL.width, canvasL.height);
     sea.forEach(function(d,i) {drawLegend(d,i,"season")});
   });
   $("#colorYear").on("click", function () {
     console.log("#colorYear click");
     state.counts.forEach(function(d){ d.color = yearColor( d.year )  });
     ticked();
     canvasL.height = 500;
     contextL.clearRect(0, 0, canvasL.width, canvasL.height);
     yea.forEach(function(d,i) {drawLegend(d,i,"year")});
   });

   $("#reset").on("click", function () {
     console.log("#reset click");
     //location.reload();
     //$("#all").click();
     state.counts.forEach(function(d){ d.color = "lightgrey" });
     ticked();
     contextL.clearRect(0, 0, canvasL.width, canvasL.height);
     canvasL.height = 0;
   });

   // $("#numF").text("Each circle represents " + fishPerCircle + " fish");
}

function initializeXY(w,h){
  var xProp4 = [0.33,0.5,0.66], yProp4 = [0.33,0.5,0.66];
//   var xProp3 = [0.33,0.66], yProp3 = [0.33,0.66];

  xy = {
    all: [ w*xProp4[1], h*yProp4[1] ],
    species: {
      ats: [w*xProp4[1], h*yProp4[2]],
      bkt: [w*xProp4[0], h*yProp4[0]],
      bnt: [w*xProp4[2], h*yProp4[0]]
    },
    river: {
      WB: [w*xProp4[0], h*yProp4[0]],
      OL: [w*xProp4[0], h*yProp4[2]],
      OS: [w*xProp4[2], h*yProp4[0]],
      IL: [w*xProp4[2], h*yProp4[2]]
    },
    season: {
      Spring: [w*xProp4[0], h*yProp4[0]],
      Summer: [w*xProp4[0], h*yProp4[2]],
      Autumn: [w*xProp4[2], h*yProp4[0]],
      Winter: [w*xProp4[2], h*yProp4[2]]
    }
  };
}
/*
function initializeFishData(cd){
  console.log("initializefishData");

  spp = sortUnique(cd.map(function(d){return d.species}));
  riv = sortUnique(cd.map(function(d){return d.river}));
  sea = sortUnique(cd.map(function(d){return d.season}));
  yea = sortUnique(cd.map(function(d){return d.year}));

  state.counts = [];
  indx = 0;
  for (var s in spp){
    for (var r in riv){
      for (var s2 in sea){
        for (var y in yea){

          var subset = getDataSRSY(cd,spp[s],riv[r],sea[s2],yea[y]);
          var numLines = parseInt(subset.length / fishPerCircle);

          console.log(indx,spp[s],riv[r],sea[s2],yea[y],numLines)//,subset,subset.length,numLines)

          for( var i = 0; i < numLines; i++){

            state.counts[indx] = { species: spp[s], river: riv[r], season: sea[s2], year: yea[y] };
        //    console.log(i,indx,spp[s],riv[r],sea[s2],yea[y],subset,subset.length,numLines)
            indx = indx + 1;
          }

        }
      }
    }
  }
  console.log("initializefishData - done");
  state.counts.forEach(function(d){ d.color = sppColor( "bnt" ) });
}

*/
// Jeff's version, 12x faster
function initializeFishData(cd){
  console.log("initializefishData()");

  spp = ["bkt", "bnt", "ats"].reverse();//sortUnique(cd.map(function(d){return d.species}));
  riv = [ "WB", "OL", "OS", "IL"].reverse(); //sortUnique(cd.map(function(d){return d.river}));
  sea = [ "Spring", "Summer", "Autumn", "Winter"].reverse(); // sortUnique(cd.map(function(d){return d.season}));
  yea = sortUnique(cd.map(function(d){return d.year}));

  var nest = d3.nest()
    .key(function (d) {
      // creates a compound key as string (e.g. "bkt,IL,Spring,2013")
      return [d.species, d.river, d.season, d.year];
    })
    .rollup(function (leaves) {
      return leaves.length;
    })
    .entries(cd);

  nest.forEach(function (d) {
    var key = d.key.split(","), // "bkt,IL,Spring,2013" -> ["bkt", "IL", "Spring", 2013]
        fishCount = d.value,
        circleCount = parseInt(fishCount / fishPerCircle);

    for (var i = 0; i < circleCount; i++) {
      state.counts.push({
        species: key[0],
        river: key[1],
        season: key[2],
        year: key[3]
      });
    }
  });

  state.counts.forEach(function(d){ d.color = "lightgrey"; d.year = +d.year });
  sortFishData();
}

function sortFishData(){
  // sort the counts to get different starting patterns  (".thenBy(" ", -1)" to reverse)
  state.counts.sort(firstBy(function(d){return d.species})
                    .thenBy("river")
                    .thenBy("season")
  //                  .thenBy("year")
                    );
}

function getDataSRSY(d,spp,riv,sea,yea){
 return d.filter( function(dd) {
   return dd.species == spp && dd.river == riv && dd.season == sea && dd.year == yea ;
 });
}

function getXY(scenario){

    state.counts.forEach(function(d){

      switch(scenario){
        case "all":
          d.xx = xy.all[0];
          d.yy = xy.all[1];
        break;

        case "species":
          switch(d.species){
            case "ats":
              d.xx = xy.species.ats[0];
              d.yy = xy.species.ats[1];
              break;
            case "bkt":
              d.xx = xy.species.bkt[0];
              d.yy = xy.species.bkt[1];
              break;
            case "bnt":
              d.xx = xy.species.bnt[0];
              d.yy = xy.species.bnt[1];
              break;
          }
        break;

        case "river":
          switch(d.river){
            case "WB":
              d.xx = xy.river.WB[0];
              d.yy = xy.river.WB[1];
              break;
            case "OL":
              d.xx = xy.river.OL[0];
              d.yy = xy.river.OL[1];
              break;
            case "OS":
              d.xx = xy.river.OS[0];
              d.yy = xy.river.OS[1];
              break;
            case "IL":
              d.xx = xy.river.IL[0];
              d.yy = xy.river.IL[1];
              break;
          }
        break;

        case "season":
          switch(d.season){
            case "Spring":
              d.xx = xy.season.Spring[0];
              d.yy = xy.season.Spring[1];
              break;
            case "Summer":
              d.xx = xy.season.Summer[0];
              d.yy = xy.season.Summer[1];
              break;
            case "Autumn":
              d.xx = xy.season.Autumn[0];
              d.yy = xy.season.Autumn[1];
              break;
            case "Winter":
              d.xx = xy.season.Winter[0];
              d.yy = xy.season.Winter[1];
              break;
          }
        break;

        case "year":
          d.xx = scaleWidth( uniqueYears.indexOf(d.year) * stepWidth + stepWidth );
          d.yy = height * 0.5;
        break;

        case "seasonYear":
          d.xx = scaleWidth( uniqueYears.indexOf(d.year) * stepWidth + stepWidth );
          d.yy = scaleHeight( uniqueSeasons.indexOf(d.season) * stepHeight + stepHeight );
        break;
      }

    });
  }

function ticked() {
//  console.log(state.currentSample,simulation.alpha())

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(margin.left, margin.top); // subtract the margin values whenever use simulation.find()

  state.counts.forEach(drawNode);

  context.restore();
}

function drawNode(d){
    context.beginPath();
    context.arc( d.x, d.y, initialRadius, 0, 2 * Math.PI);

    context.strokeStyle = d3.rgb(d.color).darker(1);//"grey";
    context.stroke();
    context.fillStyle = d.color;//"grey";
    context.fill();

}

function drawLegend(d,i,variable){
  // move to global variables?
   var col, txt, numrows;

   switch(variable){
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

function drawPositionLabels(posVar){

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

  addTextLabels();

}

function addTextLabels(){
  textLabel = svgContainer.selectAll("text")
                          .data(posData);

  textLabel
     .enter()
     .append("text")
  //   .merge(textLabel)
     .attr("x", function(d) { return d.xPos; })
     .attr("y", function(d) { return d.yPos; })
     .text( function (d) { return d.txt; })
     .attr("font-family", function (d) { return d.fontFamily; })
     .attr("font-size", function (d) { return d.fontSize; })
     .attr("fill", function(d) { return d.col; })
     ;
}


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

/*    // add legends to context
  context.save();
  //context.translate(0.5, 0.5);

  context.fillStyle = col;
  context.fill();

  context.fillText(txt ,xPos, yPos);

  //if( selectedStep == "step4") spp.forEach(function(dd,ii){ addSpeciesStep4(dd,ii) });

  context.restore();
*/
}

/* function addSpeciesStep4 (d,i){
  var col,txt,xPos,yPos;

  switch(d){
    case "ats":
      xPos = 275 - margin.left;
      yPos = 300 - margin.top;
      col = d3.rgb(sppColor( d ));
      txt = sppScale(d);
      break;
    case "bkt":
      xPos = 190 - margin.left;
      yPos = 122 - margin.top;
      col = d3.rgb(sppColor( d ));
      txt = sppScale(d);
      break;
    case "bnt":
      xPos = 360 - margin.left;
      yPos = 100 - margin.top;
      col = d3.rgb(sppColor( d ));
      txt = sppScale(d);
      break;
  }

  // add legends to context
//    context.save();

  context.font = "24px calibri";
  context.textBaseline = 'top';
  context.fillStyle = '#FCFCFC';
  context.fillRect(xPos,yPos, context.measureText(txt).width + 4, 23);

  context.fillStyle = col;

  context.fillText(txt ,xPos + 2, yPos - 2);

//    context.restore();
}
*/

function getDataEnc(d){
 return d.filter( function(dd) {
   return dd.enc == 1;
 });
}

function getDataIdLessThan(d,maxId){
 return d.filter( function(dd) {
   return dd.id < maxId;
 });
}

function getDataIdBtw(d,minId,maxId){
 return d.filter( function(dd) {
   return dd.id < maxId && dd.id > minId;
 });
}



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
/*
  var buildText = d.id + " " + d.tag + '\n' ;

    d.sample.forEach(function(dd,i){
      var tmp = [dd].concat([d.river[i], d.year[i], d.season[i], d.section[i], d.age[i], d.len[i]]) +'\n';
      if (dd == state.currentSample + 1) tmp = "*" + tmp;
      buildText = buildText + tmp;
    });
*/
  a.setAttribute("title", sppScale(d.species) + ", " + d.river + ", " +  d.season + ", " + d.year);

  tooltip
    .style("visibility", "visible");
}

 function uniques(array) {
   return Array.from(new Set(array));
}

    function sortUnique(arr) {
        arr.sort();
        var last_i;
        for (var i=0;i<arr.length;i++)
            if ((last_i = arr.lastIndexOf(arr[i])) !== i)
                arr.splice(i+1, last_i-i);
        return arr;
    }


/*** Copyright 2013 Teun Duynstee Licensed under the Apache License, Version 2.0 https://github.com/Teun/thenBy.js ***/
firstBy=function(){function n(n){return n}function t(n){return"string"==typeof n?n.toLowerCase():n}function r(r,e){if(e="number"==typeof e?{direction:e}:e||{},"function"!=typeof r){var i=r;r=function(n){return n[i]?n[i]:""}}if(1===r.length){var u=r,o=e.ignoreCase?t:n;r=function(n,t){return o(u(n))<o(u(t))?-1:o(u(n))>o(u(t))?1:0}}return-1===e.direction?function(n,t){return-r(n,t)}:r}function e(n,t){var i="function"==typeof this?this:!1,u=r(n,t),o=i?function(n,t){return i(n,t)||u(n,t)}:u;return o.thenBy=e,o}return e}();

// APP CODE -------------------------------------------------------------------

var sppScale = d3.scaleOrdinal().domain(["ats","bnt","bkt"]).range(["Atlantic salmon", "Brown trout", "Brook trout"]);
var riverScale = d3.scaleOrdinal().domain(["WB","OL","OS","IL"]).range(["Main branch","Large tributary","Small tributary","Isolated trib."]);

var fourColors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c']
var sppColor = d3.scaleOrdinal().domain(["ats","bnt","bkt"]).range(fourColors);//[d3.rgb(162,205,174), d3.rgb(74,116,134), d3.rgb(36,45,66)]); //ICE+20

//var riverColor = d3.scaleOrdinal().domain(["WB","OL","OS","IL"]).range([d3.schemeCategory20[0], d3.schemeCategory20[2],d3.schemeCategory20[4],d3.schemeCategory20[6]]);

var riverColor = d3.scaleOrdinal().domain(["WB","OL","OS","IL"]).range(fourColors);

//var riverColor = d3.scaleOrdinal().domain(["WB","OL","OS","IL"]).range([d3.rgb(162,205,174), d3.rgb(74,116,134), d3.rgb(36,45,66), d3.rgb(16,25,46)]); //ICE+20

var seasonColor = d3.scaleOrdinal().domain(["Spring","Summer","Autumn","Winter"]).range(fourColors);//[d3.rgb(162,205,174), d3.rgb(74,116,134), d3.rgb(36,45,66), d3.rgb(16,25,46)]); //ICE+20
//var yearColor = d3.scaleOrdinal().domain(d3.range(0,3)).range([d3.rgb(162,205,174), d3.rgb(74,116,134), d3.rgb(36,45,66), d3.rgb(16,25,46)]); //ICE+20

var yearColor = d3.scaleOrdinal(d3.schemeCategory20c);

/////////////////////
// set up map graphics

var canvas = document.querySelector("canvas"),
    context = canvas.getContext("2d");

var margin = {top: 40, right: 40, bottom: 0, left: 100},
    width = canvas.width - margin.left - margin.right,
    height = canvas.height - margin.top - margin.bottom;

var xScale = d3.scaleLinear()
    .range([0, width - margin.top - margin.bottom]);

var yScale = d3.scaleLinear()
    .range([0, height - margin.left - margin.right]);

//var scaleWidth = d3.scaleLinear().domain([0, canvas.width - margin.left]).range([40, canvas.width - 240]);
var scaleWidth = d3.scaleLinear().domain([0, width]).range([40, width - 140]);
var scaleWidthYear = d3.scaleLinear().domain([0, width]).range([-margin.left - margin.right, width - 10]);
var scaleWidthSeasonYear = d3.scaleLinear().domain([0, width]).range([-margin.left- margin.right, width - 40]);
var scaleHeight = d3.scaleLinear().domain([0, height]).range([40, height - 80]);

d3.select(canvas)
  .on("mousemove", mouseMoved)
  .call(d3.drag()
    .container(canvas)
    .subject(clickDot)  // acts as 'onclick'
  );

var canvasL = document.getElementById("legendCanvas"),
    contextL = canvasL.getContext("2d");

var marginL = {top: 0, right: 0, bottom: 0, left: 0},
    widthL = canvasL.width - marginL.left - marginL.right,
    heightL = 0; //canvasL.height - marginL.top - marginL.bottom;

//////////////
// svg labels

svgContainer =
  d3.select('#chart-container')
    .append('svg')
      .attr('width', canvas.width)
      .attr('height', canvas.height)
      .append('g');

  simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody()
                       .strength(-initialRadius + 1) // strength of attraction among points [ - repels, + attracts ]
//                    .distanceMax(200)
          )
    .force("collide", d3.forceCollide()
                        .radius(initialRadius + 1.02) // (function(d) { return ageScale(d.currentAge) + 1.025; })
          )
    .force("x", d3.forceX().x(function(d) { return d.xx; })
          )
    .force("y", d3.forceY().y(function(d) { return d.yy; })
          )
  ;


  // hide panels to start
  d3.selectAll(".panel").style("visibility", "hidden")

  d3.selectAll(".step").on("click", function() {
      var transDur = 400, desc;

      d3.selectAll(".panel").style("visibility", "hidden"); // in case go back to steps
      d3.selectAll(".right-container").style("display", "block")
      desc = d3.select(".description");

      d3.selectAll(".step").classed("selected", false);
      d3.select(this).classed("selected", true);

      selectedStep = d3.select(this).attr("id");

      switch(selectedStep){
        case "step1":
          $("#all").click();
          state.counts.forEach(function(d){ d.color = "lightgrey" });
          contextL.clearRect(0, 0, canvasL.width, canvasL.height);
          break;
        case "step2":
          $("#colorSpecies").click();
          $("#species").click();
          break;
       case "step3":
          $("#colorRiver").click();
          $("#river").click();
          break;
       case "step4":
          $("#colorSeason").click();
          $("#season").click();
          break;
       case "step5":
          $("#colorYear").click();
          $("#year").click();
          break;
       case "step6":
          $("#colorYear").click();
          $("#seasonYear").click();
          break;
       case "step7":
          $("#species").click();
          $("#colorSpecies").click();
          window.setTimeout( function(){
            $("#seasonYear").click()},
            2000
          );
          break;
       case "step8":
          $("#all").click(),
          state.counts.forEach(function(d){ d.color = "lightgrey" });
          canvasL.height = 0;
          contextL.clearRect(0, 0, canvasL.width, canvasL.height);
          // d3.select('.control-container').style('display', 'block');
          // d3.selectAll(".panel").transition().duration(2000).style("visibility", "visible"),
          // d3.selectAll(".right-container").style("display", "none")
          break;
      }
      console.log('STEP:', selectedStep);
      d3.selectAll('.narration-step').style('display', 'none');
      d3.select('#narration-' + selectedStep).style('display', 'block');
      // desc.html(stepText[+selectedStep.substr(4)]).style("opacity", 0); // can't transition html
      desc.transition().duration(transDur).delay(250).style("opacity", 1)
  });
