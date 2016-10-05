function getWatershedData(){
  var w;
  switch(state.selectedWatershed){
    case "west":
      w = watershed.WB;
      getNextSeason = getNextSeasonWB;
      break;
    case "stanley":
      w = watershed.SB;
      getNextSeason = getNextSeasonSB;
      break;
  }
  state.watershedData = w;
  
  nextDown = state.watershedData.nextDown,
  terminalTrib = state.watershedData.terminalTrib,
  emigrationRiver = state.watershedData.emigrationRiver,
  emigrationRiverN = state.watershedData.emigrationRiverN,
  emigrationSection = state.watershedData.emigrationSection,
  emigrationSectionN = state.watershedData.emigrationSectionN,
  scaleRiverNtoRiver = state.watershedData.scaleRiverNtoRiver,
  uniqueRivers = state.watershedData.uniqueRivers,
  uniqueSeasons = state.watershedData.uniqueSeasons,
  scaleRivertoRiverHeatMap = state.watershedData.scaleRivertoRiverHeatMap,
  sppScale = state.watershedData.sppScale,
  sppScaleColor = state.watershedData.sppScaleColor;
  initialSampleNumber = state.watershedData.initialSampleNumber;
  siteTitle = state.watershedData.siteTitle;
  
  /////
  env = getDataWatershed(csvIn.env,state.selectedWatershed);
  coordsXY =  getDataWatershed(csvIn.coordsXY, state.selectedWatershed);
  cd =  getDataWatershed(csvIn.cd, state.selectedWatershed);
  
  // title
  $('#siteTitle').empty();
  $("#siteTitle").append(siteTitle);
  
  getRiverLabelXY(state.selectedWatershed); // Function in watershedInfo.js
  
  xScale.domain(d3.extent(coordsXY, function(d) { return d.lat; }));
  yScale.domain(d3.extent(coordsXY, function(d) { return d.lon; }));
  
  //intervalNum = undefined;
  
  // year dropdown //
  // Populate year dropdown. State.yearSet hasn't been defined yet, get unique years here.
  var y = sortUnique(cd.map(function(d){return (d.year) }));
  
  //empty existing dropdown
  $('#getYear').children().remove();
  
  // fill in with this watershed's years

   for( var index in y )
   {
     $('#yearSelect ul').append('<li><a href="#">'  + y[index] + '</a></li>');
   }
  
   getYearList();
}

// inputting data
  function type(d){
    d.lat = +d.lat;
    d.lon = +d.lon;
    d.section = +d.section;
    d.sectionN = +d.sectionN;
    d.riverN = +d.riverN;
    d.tTrib = +d.terminalTrib;
    return d;
  }

  function typeEnv(d){
    d.date =  Date.parse(d.date);
    d.temp = +d.daily_mean_temp;
    d.flow = +d.qPredicted;
    d.season = +d.seasonFill;
    d.sample = +d.sampleNumberFill;
    d.year = +d.year;
    return d;
  }

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
    d.watershed = d.watershed;
    d.tag = d.tag;
    return d;
  }

function color(d){ return d.id; }

 function initializeState() {
   console.log('initializeState()');
   state.selectedWatershed = $("#selectedWatershedDD").val();
   state.selectedSpecies = $("#selectedSpeciesDD").val();
   state.dotOption = $("#dotOptionDD").val();   
   state.onClick = $("#onClickDD").val();
   state.propMovedDD = $("#propMovedDD").val();
   state.addLastSample = $("#addLastSampleDD").val();
   state.selectedRiver = "all"; // default setting. changed when onClick == 'riv'
   console.log('state: ', state);
 }
         
 function initializeInterface() {
   console.log('initializeInterface()');

   $("#selectedWatershedDD").on("change", function () {
    console.log("#selectedWatershedDD change");
//      state.selectedWatershed = $("#selectedWatershedDD").val();

    if($("#selectedWatershedDD").val() == 'stanley') {}

    initializeState();
    getWatershedData(csvIn.envIn,csvIn.coordsIn,csvIn.cdIn);
//      initializeInterface(); This causes skips in the samples (recursive). Do not run in "#selectedWatershedDD" change.
    getYearList(); //this does need to be updated when pick new watershed
    
    initializeNetwork(coordsXY);
    initializeFishData(cd,coordsXY);
    initializeEnvData(env);

    updateRenderData();
    incrementSegments();

   });     
   $("#selectedSpeciesDD").on("change", function () {
    console.log("#selectedspeciesDD change");
    state.selectedSpecies = $("#selectedSpeciesDD").val();
    updateDistMovedArr();
    updateRenderData();
    if(state.nodesCurrent.length === 0) bootstrap_alert.warning('There are no ' + sppScale( state.selectedSpecies ) + ' in this watershed');
    ticked();
    ended();
   });
   $("#dotOptionDD").on("change", function () {
     console.log("#dotOption change");
     state.dotOption = $("#dotOptionDD").val();
     updateRenderData();
     ticked();
     ended();
   });
   $("#onClickDD").on("change", function () {
     console.log("#onClickDD change");
     state.onClick = $("#onClickDD").val();
     if(state.selectedWatershed == "stanley" && state.onClick == "fam") bootstrap_alert.warning('There are no Family data in this watershed');
     resetOpacityToOne();
     state.selectedID = [];
     updateRenderData();
     ticked();
     ended();
   });
  $("#propMovedDD").on("change", function () {
     console.log("#propMovedDD change");
     state.propMovedDD = $("#propMovedDD").val();
     drawHeatMap();
     ended();
  });   
  $("#addLastSampleDD").on("change", function () {
     console.log("#addLastSampleDD change");
     state.addLastSample = $("#addLastSampleDD").val();
     ended();
   });
   $("#unselectAll").on("click", function () {
     console.log("#unselectAll click");
     resetOpacityToOne();
     state.selectedID = [];
     updateRenderData();
     ticked();
     ended();
   });
   $("#showNotEnc").on("click", function () {
     console.log("#showNotEnc change");
     whitenUnEnc();
     ticked();
     ended();
     setTimeout(function () {
       reColorUnEnc();
       ticked();
       ended();
     }, 1000);
   });
   
   $("#prevSamp").on("click", function () {
     console.log("#prevSamp change", state.currentSample, state.firstSample);

     if(state.currentSample <= state.firstSample + 1) {
       disableButton('#prevSamp');
     //  alert('You are at the first sample');
       bootstrap_alert.warning('You are at the first sample');
     }
     else {
       // button gets enabled in ended()
       state.currentSample = state.currentSample - 1;
       updateRenderData();
       incrementSegments();
     }
     
   });
   
   $("#nextSamp").on("click", function () {
     console.log("#nextSamp change", state.currentSample, state.lastSample);

     if(state.currentSample >= state.lastSample){
       disableButton('#nextSamp');
    //   alert('You are at the last sample');
       bootstrap_alert.warning('You are at the last sample');
     }
     else{
       enableButton('#nextSamp');
       
       state.currentSample = state.currentSample + 1;
       console.log("#nextSamp change2", state.currentSample, state.lastSample);
       updateRenderData();
       incrementSegments();
     }

   });
   
   /*getYearList();
   $("#getYear li").on("click", function (d) {
     console.log("#yearSelect change",$(this).text());
     state.currentSample = getDataSampleInfoFromYear( state.sampleInfo,$(this).text() )[0].sample;
     updateRenderData();
     incrementSegments();
   });
   */
 }
 
function getYearList(){     
  $("#getYear li").on("click", function (d) {
     console.log("#yearSelect change",$(this).text());
     state.currentSample = getDataSampleInfoFromYear( state.sampleInfo,$(this).text() )[0].sample;
     updateRenderData();
     incrementSegments();
   });
} 

function initializeNetwork(coordsXY){
  console.log("initializeNetwork");
    ////////////////////////////////////////////////////////////////////////////
    // set up xy coordinates from csv file
    byRiver = d3.nest()
                .key(function(d){return d.riverN;}).sortKeys(d3.ascending)
                .entries(coordsXY); 
  
    xy = byRiver.map(function (d) {
                 return {
                   riverN: Number(d.key),
                   coordinates: d.values.map(function(dd) {
                     return [dd.lat,dd.lon,dd.sectionN];
                   }),
                   minSection: d3.min( d.values.map(function(dd) { return dd.section; }) ),
                   maxSection: d3.max( d.values.map(function(dd) { return dd.section; }) )
                 };
               }); 
               
    console.log("byRiver/xy",byRiver,xy); 
  
    getPathsCoords(xy,nextDown,terminalTrib);
}


function initializeFishData(cd,coordsXY){
    console.log("initializefishData");
    cdHold = getDataNotNaN_distMoved(cd);
    
    // massage fish data
    state.firstSample =    d3.min(cd, function(d) { return d.sample; }) - 1;
    //state.currentSample = state.firstSample + 1;
    state.lastSample = d3.max(cd, function(d) { return d.sample; });
    console.log("timeStep",state.currentSample,maxTimeStep,cd);
    
    // get set of unique samples with year and season - must be a better way...
    cd.forEach(function(d,i){
      d.uniqueString = d.sample.toString().concat("_" + d.year.toString()).concat("_" + d.season.toString());
    });
    
    var uString = sortUnique(cd.map( function(d) { return d.uniqueString } ));
    
    state.sampleInfo = uString.map(function(d){
      return {
        sample: +d.split("_")[0],
        year: +d.split("_")[1],
        season: d.split("_")[2]
      };
    });

    // put into separate arrays so they are easy to read for repeated calls
    state.sampSet = state.sampleInfo.map(function(d){return d.sample});
    state.yearSet = state.sampleInfo.map(function(d){return d.year});
    state.seasonSet = state.sampleInfo.map(function(d){return d.season});
    
    // Define starting sample #
    state.currentSample = d3.min(state.sampSet); //initialSampleNumber; //
        
  //  console.log("sampSet",state);

    spp = uniques( cd.map( function(d) {return d.species}) ); // array of unique species
    console.log("spp",spp);
    
    assignSectionN(cd,coordsXY);
    
    // add extra row for fish that emigrated. Put them in section 0 in the WB [river 7]
    addEmigrants(cd);

    byFish = d3.nest()
               .key(function(d){return d.id;}).sortKeys(d3.ascending)
               .entries(cd);
    
    state.nodes = byFish.map(function (d) {
                 return {
                   id: d.values[0].id,
                   tag: d.values[0].tag,
                   riverN: d.values.map(function(dd) {
                     return dd.riverN;
                   }),
                   river: d.values.map(function(dd) {
                     return dd.river;
                   }),
                   section: d.values.map(function(dd) {
                     return dd.section;
                   }),
                   sectionN: d.values.map(function(dd) {
                     return dd.sectionN;
                   }),
                   sample: d.values.map(function(dd) {
                     return dd.sample;
                   }),
                   len: d.values.map(function(dd) {
                     return dd.len;
                   }),
                   age: d.values.map(function(dd) {
                     return dd.age;
                   }),
                   year: d.values.map(function(dd) {
                     return dd.year;
                   }),
                   season: d.values.map(function(dd) {
                     return dd.season;
                   }),
                   date: d.values.map(function(dd) {
                     return dd.date;
                   }),
                   enc: d.values.map(function(dd) {
                     return dd.enc;
                   }),
                   distMoved: d.values.map(function(dd) {
                     return dd.distMoved;
                   }),
                   species: d.values[0].species,
                   speciesIndex: spp.indexOf(d.values[0].species), // integer value of spp
                   color: sppScaleColor( d.values[0].species ),// colorScale( spp.indexOf(d.values[0].species) ),
                   familyID: d.values[0].familyID,
                   dateEmigrated: d.values[0].dateEmigrated
             //      uniqueString: d.values[0].uniqueString
                 };
               });
  
  state.nodes.forEach( function(d){ d.firstSample = d3.min(d.sample);//d.sample[0];
                                    d.lastSample  = d3.max(d.sample);
                                  }
                     );

  // get data for movement distribution histos                   
  updateDistMovedArr();
}

function initializeEnvData(env){
  envData=env;
}

function ticked() {
//  console.log(state.currentSample,simulation.alpha())
  
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(margin.left, margin.top); // subtract the margin values whenever use simulation.find()

  context.beginPath();
  xy.forEach(drawcoordinate);
  context.fillStyle = 'rgb(245, 245, 245)';//"lightgrey";
  context.fill();
  context.strokeStyle = 'rgb(245, 245, 245)';//"lightgrey";
  context.stroke();

  spp.forEach(drawLegend);
  drawInfo();

  state.nodesRender.forEach(drawNode);

  context.restore();
  
  disableButton("#prevSamp");
  disableButton("#nextSamp");
}


function drawcoordinate (d, i) {
  d.coordinates.forEach( function (dd,ii) {
    context.moveTo( xScale(dd[0]), yScale(dd[1]) );
    context.arc( xScale(dd[0]), yScale(dd[1]), 10, 0, 2 * Math.PI);
//     context.fillText(dd[2], xScale(dd[0])+0, yScale(dd[1])-20);
  });
}


function drawLegend(d,i){
  // move to global variables?
  var vOffset = 25, radius = 9; vOffsetText = radius/2;
  var w = -60, h = 50 - vOffset * i - 20;
  var col = d3.rgb(sppScaleColor( d ));
  
  col.opacity = 1;
  
  context.beginPath();
//    context.moveTo(w, h );
  context.arc(   w, h, radius, 0, 2 * Math.PI);
  context.strokeStyle = col.darker(2);
  context.stroke();
  context.fillStyle = col;
  context.fill();
  context.font = "20px calibri";
  context.fillText(sppScale(d) ,w + 20, h + vOffsetText);
//  console.log(d,sppScaleColor( d ))
}

function drawInfo(){
  
  context.fillStyle = "lightgrey";
  context.font = "40px calibri";
  context.fillText(state.currentSeason + " - " + getNextSeason( state.currentSeason ), 600, 600);
  
  state.currentYear = getDataSampleInfo(state.sampleInfo,state.currentSample)[0].year;
  context.fillText(state.currentYear, 600, 550);
  
  // River names
  context.fillStyle = "lightgrey";
  context.font = "35px calibri";
  fillTextRiver(state.selectedWatershed);

  // last obs
  var vOffset = 25, radius = 9; vOffsetText = radius/2;
  var w = -60, h = 50 - vOffset * (-3) - 20;
  var col = d3.rgb(sppScaleColor( 2 ));
  
  col.opacity = 1;
  
  context.beginPath();
  context.arc( w, h, radius, 0, 2 * Math.PI );
  context.strokeStyle = col;//.darker(2);
  context.stroke();
  context.fillStyle = col;
  context.fill();
  context.font = "18px calibri";
  context.fillStyle = "lightgrey";
  context.fillText("Last observation", w + 20, h + vOffsetText);
  
  context.beginPath();
  context.arc(w, h, radius - 2, 0, 2 * Math.PI);
  context.fillStyle = d3.rgb(253,255,204); // ICE
  context.fill();
  
}

function drawNode (d, i) {

  context.beginPath();

  if( ((d.isFirstSample) && (simulation.alpha() < 0.2)) ){  // keep new fish from entering from the upper left, they emerge near the end
      
    context.arc( d.x, d.y, ageScale(d.currentAge)*(1-simulation.alpha()/0.2), 0, 2 * Math.PI );

    d.color.opacity = 1;
//    state.selectedID.length > 0;
    if(state.selectedID.length > 0 && !IDinSelectedID(state.selectedID,d.id)) {  
      d.color.opacity = 0.1;
    }

    context.strokeStyle = d3.rgb(d.color).darker(0.75);
    context.stroke();
    context.fillStyle = d.color;
    context.fill();
  }  
  
  else if (!d.isFirstSample ) {
    
    context.arc(d.x, d.y, ageScale(d.currentAge), 0, 2 * Math.PI);

    d.color.opacity = 1;
  //  state.selectedID.length > 0;
    if(state.selectedID.length > 0 && !IDinSelectedID(state.selectedID,d.id)) {  
      d.color.opacity = 0.1;
    }

    context.strokeStyle = d3.rgb(d.color).darker(0.75);
    context.stroke();
    context.fillStyle = d.color;
    context.fill();
 }
} 

function ended(){

  if( state.addLastSample == "yes" ){
    context.save();
  //  context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(margin.left, margin.top); // subtract the margin values whenever use simulation.find()
  
    state.nodesRender.forEach(fillInLastSample);
    
    context.restore();
  }
  else if( state.addLastSample == "no" ){
    ticked();
  }
  
  if( state.currentSample > state.firstSample + 1 || state.currentSample < state.lastSample ) {
    enableButton("#prevSamp");
    enableButton("#nextSamp"); 
  }  

}

bootstrap_alert = function() {};
bootstrap_alert.warning = function(message) {
     $('#alert_placeholder').html('<div class="alert alert-warning alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button><span>'+ message +'</span></div>');
      };

function addEmigrants(cd){
  cd.forEach(function(d,i){
    
    if ( !isNaN( d.dateEmigrated ) && d.sample == d.maxSample ){

      var e = jQuery.extend(true, {}, d); //clone

      e.date = d.dateEmigrated;
      e.lagSection = d.section;
      e.maxSample = d.sample + 1; 
      e.river = emigrationRiver; e.riverAbbr = emigrationRiver;
      e.riverN = emigrationRiverN;
      e.sample = d.sample + 1;
      e.season = getNextSeason(d.season); e.seasonStr = e.season;
      e.section = emigrationSection; e.sectionN = emigrationSectionN;
      if (d.season == "Winter") { e.year = d.year + 1; e.age = d.age + 1; }
      
      cd.push(e);
      
      d.maxSample = d.sample + 1;
      d.distMoved = -50; //put  -50 into previous sample for movement distribution histos
      
    }
  });
}

function fillInLastSample(d){
    if ( d.isLastSample ){

      context.beginPath();
   //   context.moveTo(d.x, d.y );
      context.arc(d.x, d.y, ageScale(d.currentAge) - 1, 0, 2 * Math.PI);
      context.fillStyle = d3.rgb(253,255,204); // ICE
  //    context.fillStyle = "#E4FB68"//"#EFEE69"//"#ffffb3";//'rgb(250,250,250)';//"yellow";
      context.fill();
  }
}

function fillInUnEnc2(d){
    if ( d.isLastSample ){

      context.beginPath();
   //   context.moveTo(d.x, d.y );
      context.arc(d.x, d.y, ageScale(d.currentAge) - 1, 0, 2 * Math.PI);
      context.fillStyle = d3.rgb(253,255,204); // ICE
  //    context.fillStyle = "#E4FB68"//"#EFEE69"//"#ffffb3";//'rgb(250,250,250)';//"yellow";
      context.fill();
  }
} 

 function whitenUnEnc(){
  state.nodesRender.forEach( function(d){ 
    var indx = d.sample.indexOf(state.currentSample + 1); 
    if( d.enc[indx] === 0 ) {
      d.color = d3.rgb('255','255','255');
    }  
  });  
} 

function reColorUnEnc(){
  state.nodesRender.forEach( function(d){ 
    var indx = d.sample.indexOf(state.currentSample + 1); 
    if( d.enc[indx] === 0 ) {
      d.color = sppScaleColor( d.species );
    }  
  });  
}

 function disableButton(buttonIn){
     $(buttonIn).addClass('disabled');
     $(buttonIn).removeAttr('data-toggle');
 }
 
 function enableButton(buttonIn){
     $(buttonIn).removeClass('disabled');
     $(buttonIn).attr("data-toggle", "modal");
 }

function getNodesCurrent(){
  
  // get fish that were seen only once at the end of the interval (state.currentSample + 1, beginning of this one)  
  nodesFirstSampleOnly = state.nodes.filter( function(d) { return d.sample.includes( state.currentSample + 1 ) && d.sample.length == 1 });
  getPathFirstOnly(nodesFirstSampleOnly);
  nodesFirstSampleOnly.forEach( function(d) { d.isFirstSample = ( d.firstSample == state.currentSample + 1 );
                                              d.isLastSample  = ( d.lastSample  == state.currentSample + 1 );
                                            }
                              );
  
  // get fish that were seen in the beginning and end of the interval [this to next]
  nodesCurrentTmp = state.nodes.filter( function(d) { return d.sample.includes( state.currentSample ) && d.sample.includes( state.currentSample + 1 ) });
  getPath(nodesCurrentTmp);
  nodesCurrentTmp.forEach( function(d) { d.isFirstSample = ( d.firstSample == state.currentSample );
                                         d.isLastSample  = ( d.lastSample  == state.currentSample + 1 );
                                       }
                         );
  
  // Put them together
  state.nodesCurrent = nodesCurrentTmp.concat(nodesFirstSampleOnly);
  
  // Update 3 variables
  state.nodesCurrent.forEach( function(d) { d.coordinate = d.pathEnd; } );
}

function updateRenderData(){
  console.log("in render", state.currentSample)
  getNodesCurrent();
  state.nodesCurrent.forEach(function(d) { updateCurrentAge(d); });
  getNodesRender();
  
  //getSelected();
  
  // update season and yearinfo for drawInfo()
  state.nodesCurrent.forEach(function(d) { updateCurrentSeason(d); updateCurrentYear(d); });
  state.currentSeason = getDataSampleInfo(state.sampleInfo,state.currentSample)[0].season;
  
  drawHeatMap();
  drawHistogram();
  drawHistogramDistMoved();
}

function getNodesRender(){
  if( state.selectedSpecies != "all" ) { state.nodesCurrent = getDataSpecies(state.nodesCurrent, state.selectedSpecies);}
  
  if (      state.dotOption == "all" ) {      state.nodesRender = state.nodesCurrent; }
  else if ( state.dotOption == "selected" ) { state.nodesRender = getDataSelected(state.nodesCurrent); }
  
}



/*  function getSelected(){
  // all fish are 'selected' (opacity = 1) if the selectedID list is empty
  // if not, just retain existing selectedID list
  if( state.selectedID.length === 0 ) state.selectedID =  state.nodesCurrent.map(function(d){ return d.id });
}
*/

function incrementSegments(){
/*
  // Jump to path end if first sample or skip a sample
  if( (state.currentSample == state.firstSample + 1) || (state.currentSample != state.previousSample + 1) ){  
    
    state.nodesRender.forEach(function (d,i) { d.coordinate = d.pathEnd; });
    console.log("Prop done moving all",state.nodesRender);
    simulation.alpha(1).alphaMin(0.01).nodes(state.nodesRender).restart();
  }
  
  // Step through path
  else {  
*/  

    var indexSegNum = 0;
    var intDur = state.currentSample == state.firstSample ? 2 : intervalDur; //probably not needed now
  
    clearInterval(existingIntervalNum); //avoids jerky circle behavior when an intervalNum exists

    // increment segments until all fish have moved
    var intervalNum = setInterval(function(){
         existingIntervalNum = intervalNum;
         indexSegNum = indexSegNum + 1;
         var indexNumDone = 0;
         
         state.nodesRender.forEach(function (d,i) {
           if(indexSegNum < d.nodePath.length){
             d.coordinate = d.nodePath[indexSegNum];
           }
           else { 
             d.coordinate = d.coordinate;
             indexNumDone = indexNumDone + 1;
           }
         });
         
         console.log("Prop done moving", (indexNumDone/state.nodesRender.length).toFixed(4), indexSegNum, intervalNum, state.currentSample);
         $("#propDoneLabel").html((indexNumDone/state.nodesRender.length).toFixed(2));
         
         var aMin = state.currentSample == state.firstSample + 1 ? 0.00001 : 0.01;
         simulation.alpha(1).alphaMin(0.01).nodes(state.nodesRender).restart(); //alphaMin > 0 shortens the simulation - keeps the dots from jiggling near end as they find the packing solution
  
         if (state.nodesRender.length === 0 || indexNumDone/state.nodesRender.length == 1) clearInterval(intervalNum);
         
     },intDur);
 // }
  
}

  function incrementSegments_d3(){ // moves dots too fast

    var indexSegNum = 0;
    var intDur = state.currentSample == state.firstSample ? 2 : intervalDur; //probably not needed now
  
    // increment segments until all fish have moved
    var intervalNum = d3.timer(function(){ 
         indexSegNum = indexSegNum + 1;
         var indexNumDone = 0;
         
         state.nodesRender.forEach(function (d,i) {
           if(indexSegNum < d.nodePath.length){
             d.coordinate = d.nodePath[indexSegNum];
           }
           else { 
             d.coordinate = d.coordinate;
             indexNumDone = indexNumDone + 1;
           }
         });
         
         console.log("Prop done moving", indexNumDone/state.nodesRender.length, indexSegNum, state.currentSample);
         $("#propDoneLabel").html((indexNumDone/state.nodesRender.length).toFixed(2));
         
         var aMin = state.currentSample == state.firstSample + 1 ? 0.00001 : 0.01;
         simulation.alpha(1).alphaMin(0.01).nodes(state.nodesRender).restart(); //alphaMin > 0 shortens the simulation - keeps the dots from jiggling near end as they find the packing solution
  
         if (state.nodesRender.length === 0 || indexNumDone/state.nodesRender.length == 1) intervalNum.stop();
         
     },intDur);
 // }
  
}

function updateCurrentAge(d){
   var indx = d.sample.indexOf(state.currentSample); 
       d.currentAge = d.age[indx];
}

function updateCurrentSeason(d){
   var indx = d.sample.indexOf(state.currentSample); 
       d.currentSeason = d.season[indx];
}

function updateCurrentYear(d){
   var indx = d.sample.indexOf(state.currentSample); 
       d.currentYear = d.year[indx];
}

function getDistMoved(d){
   var indx = d.sample.indexOf(state.currentSample); // 
   return d.distMoved[indx];
}

function getDistMovedBySeason(d,s=state.currentSeason){
   var indx = d.season.indexOf(s); // 
   return d.distMoved[indx];
}


function removeFalsey(arr) {
  var filteredArray = arr.filter(Boolean);
  return filteredArray;
}

function selectedIDIsNotAlive(){
  state.selectedID.forEach( function(d){
    console.log("selectedIsAlive",d);
    if( !state.nodesRender.map(function(d){ return d.id }).includes(d) ){ console.log("selectedIsNOTAlive",d);state.selectedID.splice(state.selectedID.indexOf(d),1)  }
  });
}

function resetOpacityToOne(){
  state.nodes.forEach( function(d){ d.color.opacity = 1;} );  
}

function clickSubject() {
  console.log("mouseClickSubject",d3.event.x,d3.event.y,simulation.find(d3.event.x - margin.left, d3.event.y - margin.top, searchRadius));
  return simulation.find(d3.event.x - margin.left, d3.event.y - margin.top, searchRadius);
}

function clickDot(){

 var d = clickSubject();
 console.log("selected",d.id);
 
 // select an individual circle when clicked 
 if (state.onClick == "ind") {

   // selecting new point
   if ( !IDinSelectedID( state.selectedID,d.id ) ){
     state.selectedID.push(d.id);
     console.log("selected",state.selectedID);
   }
   
   // unselect existing selected ID
   else if ( IDinSelectedID(state.selectedID,d.id) ){
     unSelectThisOne(d);
     console.log("UNselected",state.selectedID);
   }
 }
 
 else if (state.onClick == "sec") {

   // Empty selectedID array
   state.selectedID = [];
   
   // get all data from the section of the selected individual
   state.sectionData = getDataSection(state.nodesRender,d.coordinate);

   // Add ID's of the selected fish's family to selectedID
   state.selectedID = state.sectionData.map( function(d){ return(d.id) } );

 }
 
 // Select IDs of all individuals in the selected individual's family
 else if (state.onClick == "fam") {

   // Empty selectedID array
   state.selectedID = [];
   
   // get all data from the family of the selected individual
   state.familyData = getDataFamily(state.nodesRender,d.familyID);
   // Add ID's of the selected fish's family to selectedID
   state.selectedID = state.familyData.map( function(d){ return(d.id) } );

   console.log("family",state.selectedID);
 }
 
 else if (state.onClick == "riv") {

   // Empty selectedID array
   state.selectedID = [];
   
   // get all data from the section of the selected individual
   state.riverData = getDataRiver(state.nodesRender,d.endRiver);

   // Add ID's of the selected fish's family to selectedID
   state.selectedID = state.riverData.map( function(d){ return(d.id) } );
   
   state.selectedRiver = d.endRiver;
   updateDistMovedArr();

 }
 
 updateRenderData();
 ticked();
 ended(); 
}

// Is id in selectedID array?
function IDinSelectedID(arr, val) {
  return arr.some(function(arrVal) {
    return val === arrVal;
  });
}

function unSelectThisOne(d){ 
  state.selectedID.splice(state.selectedID.indexOf(d.id),1);
}

function getDataSection(d,coord){
  return d.filter( function(dd) {
    return dd.coordinate == coord;
  });
}

function getDataFamily(d,famID){
  return d.filter( function(dd) {
    return dd.familyID == famID;
  });
}

function getDataRiver(d,river){
  return d.filter( function(dd) {
    return dd.endRiver == river;
  });
}

function getDataSpecies(d,s) {
  return d.filter( function(d) {
    return d.species == s;
  });
}

function getDataWatershed(d,s) {
  return d.filter( function(d) {
    return d.watershed == s;
  });
}

function getDataID(d,id) {
  return d.filter( function(d) {
    return d.id == id;
  });
}

function getDataSelected(dd) {
  return dd.filter( function(d) {
    return IDinSelectedID(state.selectedID,d.id);
  });
}

function getDataSample(dd,s) {
  return dd.filter( function(d) {
    return d.sample == s;
  });
}

function getDataSeason(dd,s) {
  return dd.filter( function(d) {
    return d.season == s;
  });
}

function getDataSampleInfo(dd,s) {
  return dd.filter( function(d) {
    return d.sample == s;
  });
}

function getDataSampleInfoFromYear(dd,y) {
  return dd.filter( function(d) {
    return d.year == y && d.season == state.currentSeason;
  });
}

function getFirstSample(dd,s) {
  return dd.filter( function(d) {
    return d.isFirstSample;
  });
}
function getLastSample(dd,s) {
  return dd.filter( function(d) {
    return d.isLastSample;
  });
}

function getDataEmigrated(dd) {
  return dd.filter( function(d) {
    return !isNaN(d.dateEmigrated);
  });
}
 
function getDataNotNaN_distMoved(dd) {
  return dd.filter( function(d) {
    return !isNaN(d.distMoved);
  });
}

function getNextSeasonWB(s){
  var n;
  switch(s){
    case "Spring":
      n = "Summer";
      break;
    case "Summer":
      n = "Autumn";
      break;
    case "Autumn":
      n = "Winter";
      break;
    case "Winter":
      n = "Spring";
      break;
  }
  return n;
}

function getNextSeasonSB(s){
  var n;
  switch(s){
    case "Summer":
      n = "Autumn";
      break;
    case "Autumn":
      n = "Summer";
      break;
  }
  return n;
}

function getStartRiver(dd,s) {
  return dd.filter( function(d) {
    return d.key == s;
  });
}

function getEndRiver(dd,s) {
  return dd.filter( function(d) {
    return d.values.key == s;
  });
}

function getStartAndEndRiver(ddd,s,e) {
  return ddd.filter( function(dd) {
    return dd.key == s; {
      return dd.filter(function(d){
        d.key.values == e;
      });  
    }
  });
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

function assignSectionN(cd,coordsXY){
// assign sectionN based on riverAbbr and section# 
// need to check lat/lon sor sections -1 and 0 in OS - just subtracted from the last decimal for now

  cd.forEach(function (d,i) {
//     if(state.selectedWatershed == "stanley") console.log(i,d,coordsXY)
    d.sectionN = coordsXY.filter( function(dd) { return d.riverAbbr == dd.riverAbbr && d.section == dd.section } )[0].sectionN;
    d.riverN =   coordsXY.filter( function(dd) { return d.riverAbbr == dd.riverAbbr && d.section == dd.section } )[0].riverN;
  });
}

function getPathsCoords(xy,nextDown,terminalTrib){
   // set up paths
 var index = 0;

  for( var i = 0; i < xy.length; i++ ){       // starting river
    for( var j = 0; j < xy.length; j++ ){     // ending river

      var path = [xy[i].riverN]; //Starting river and default for i=j - staying in river.
      var coords = [];
      
      // staying in the same river
      if (i == j) { 
        coords = xy[i].coordinates; 
      }
      
      // going downstream 
      else if(i < j){
        for( var ii = 1; ii < xy.length; ii++ ){
          if ( nextDown[path[[ii - 1]]] >= j ) {
            path[ii] = j;
            break;
          }
          else {
            path[ii] = nextDown[path[[ii - 1]]];
          }  
          
        }
        
        var riverHold = [];          
        
        for( var d = 0; d < path.length; d++ ){               
                       
           //if terminal trib to start, reverse dir of coordinates
           // or if mainstem, reverse dir of coordinates
           if ( (terminalTrib[path[d]] == 1 && d == 0) ||
                (terminalTrib[path[d]] == 0)){
             riverHold = xy[path[d]].coordinates.slice().reverse();
           }
           // do not reverse if terminalTrib is last step (i.e not the first) 
           else if (terminalTrib[path[d]] == 1 && d > 0) { riverHold = xy[path[d]].coordinates }

           coords = coords.concat(riverHold);
           
        }
      }

      //going upstream - symmetrical with downstream. Just reverse direction for paths and coords
      else if(i > j) { 
        path = paths.filter( function(d) { return d.startRiverN == j && d.endRiverN == i;})[0].path
                    .slice()
                    .reverse();
        
        coords = paths.filter( function(d) { return d.startRiverN == j && d.endRiverN == i;})[0].coordinates
                    .slice()
                    .reverse();            
      }
      
      paths[index] = { startRiverN:i,
                       endRiverN: j,
                       path: path,
                       coordinates: coords
                     };
      
      index = index + 1;
      //console.log(i,j,path,coords) 
    
   }  
  }
  
//  console.log("paths",paths);
  return paths;
}

// get path between the current and next time step
function getPath (nodesCurrentTmp) {
    nodesCurrentTmp.forEach(function (d,i) {
      
        var timeStepIndex = d.sample.indexOf(state.currentSample); // for all arrays in d
        
        d.nodePossiblePath = paths.filter( function(dd){ return dd.startRiverN == d.riverN[timeStepIndex] & dd.endRiverN == d.riverN[timeStepIndex + 1] } );

//console.log("inside",i,timeStepIndex)

        d.pathStart = xy.filter( function(dd){ return dd.riverN == d.riverN[timeStepIndex    ] })[0].coordinates[d.sectionN[timeStepIndex    ] - 1];// -1 because of 0 indexing of sectionN
        d.pathEnd =   xy.filter( function(dd){ return dd.riverN == d.riverN[timeStepIndex + 1] })[0].coordinates[d.sectionN[timeStepIndex + 1] - 1];
        d.pathStartIndex = d.nodePossiblePath[0].coordinates.indexOf(d.pathStart);
        d.pathEndIndex =   d.nodePossiblePath[0].coordinates.indexOf(d.pathEnd);
        
        if(d.pathStartIndex <= d.pathEndIndex){
          d.nodePath =  d.nodePossiblePath[0].coordinates.slice(d.pathStartIndex,d.pathEndIndex + 1);
        }
        else d.nodePath = d.nodePossiblePath[0].coordinates.slice(d.pathEndIndex,d.pathStartIndex + 1).reverse(); //if stay in same river and go downstream

        d.once = false;
 //     }
    });
    return nodesCurrentTmp;
}

// for fish only caught once, on the second sample of the interval
// same structure as getPath, except the 'path' is just the current location
function getPathFirstOnly (nodesFirstSampleOnly) {
    nodesFirstSampleOnly.forEach(function (d,i) {
      
        var timeStepIndex = d.sample.indexOf(state.currentSample); // for all arrays in d
        
        d.nodePossiblePath = paths.filter( function(dd){ return dd.startRiverN == d.riverN[timeStepIndex + 1] & dd.endRiverN == d.riverN[timeStepIndex + 1] } );

//console.log("inside",i,timeStepIndex)

        d.pathStart = xy.filter( function(dd){ return dd.riverN == d.riverN[timeStepIndex + 1] })[0].coordinates[d.sectionN[timeStepIndex + 1] - 1];// -1 because of 0 indexing of sectionN
        d.pathEnd =   xy.filter( function(dd){ return dd.riverN == d.riverN[timeStepIndex + 1] })[0].coordinates[d.sectionN[timeStepIndex + 1] - 1];
        d.pathStartIndex = d.nodePossiblePath[0].coordinates.indexOf(d.pathStart);
        d.pathEndIndex =   d.nodePossiblePath[0].coordinates.indexOf(d.pathEnd);
        
        d.nodePath =  d.nodePossiblePath[0].coordinates.slice(d.pathStartIndex,d.pathEndIndex + 1);
        
        d.once = true;
    });
    return nodesFirstSampleOnly;
}

function mouseMoved() {
  var a = this.parentNode, 
      m = d3.mouse(this), 
      d = simulation.find(m[0]- margin.left , m[1]- margin.top , searchRadius);

  if (!d) return a.removeAttribute("title"), tooltip.style('visibility','hidden');

  var buildText = d.id + " " + d.tag + '\n' ;
  
    d.sample.forEach(function(dd,i){
      var tmp = [dd].concat([d.enc[i], d.river[i], d.year[i], d.season[i], d.section[i], d.age[i], d.len[i]]) ;
      if (dd == state.currentSample + 1) tmp = tmp + " *currSamp" ;
      buildText = buildText + tmp +'\n' 
    }) 

  a.setAttribute("title", buildText )

  tooltip
    .style("visibility", "visible");
}

function createArray(length) {
  var arr = new Array(length || 0),
      i = length;

  if (arguments.length > 1) {
      var args = Array.prototype.slice.call(arguments, 1);
      while(i--) arr[length-1 - i] = createArray.apply(this, args);
  }

  return arr;
}

function fill2D(rows, cols,i) {
  var array = [], row = [];
  while (cols--) row.push(i);
  while (rows--) array.push(row.slice());
  return array;
}

function hideLoading () {
  d3.select('#loading')
    .style('opacity', 1)
    .transition()
    .duration(1000)
    .style('opacity', 0)
    .on('end', function () {
      // after transition, hide element
      d3.select(this).style('display', 'none');
      startTour();
  });
}

function startTour () {
  var intro = introJs();
  intro.setOptions({
    showStepNumbers: false,
    steps: [
      {
        intro: '<p class="text-center" style="font-size:20px">Welcome to the<br><strong>Data Visualizer</strong><br>for<br><strong>PIT tagging studies</strong> from the West brook and Stanley brook</p><p>Click Next to begin the tour of this dashboard, or Skip to quit the tour and get right to exploring the data.</p>'
      },
      {
        element: '#mapCanvas',
        intro: '<p>This panel is the main display. Each circle represents a fish. The larger the circle, the larger the fish. Species is denoted by color and circles with yellow interiors are fish that were not seen again. The year and sampling interval are shown in the bottom right of the panel. Movements are shown from the beginning of the sampling interval to the end of the sampling interval.</p>'
      },
      {
        element: '#nextSamp',
        intro: '<p>Click to advance to the next sampling interval.</p>'
      },
      {
        element: '#yearSelect',
        intro: '<p>Click the arrow to switch years. You will stay in the same season.</p>'
      },
      {
        element: '#collapseOne',
        intro: '<p>This window contains selectors to choose what you see on the main display and in the panels below.</p>'
      },
      {
      element: '#selectedWatershedDD',
        intro: '<p>Use this dropdown to select the watershed (study area).</p>'
      },
      {
        element: '#selectedSpeciesDD',
        intro: '<p>Use this dropdown to select the species.</p>'
      },
      {
        element: '#dotOptionDD',
        intro: '<p>Use this dropdown to show all the circles or only the selected circles. When all is selected, the unselected points will be faded. If Selected is chosen in the dropdown and no fish are selected, you will not see any circles. </p>'
      },
      {
        element: '#onClickDD',
        intro: '<p>Use this dropdown to choose what group of circles is selected when you click on a circle.</p>'
      },
      {
        element: '#addLastSampleDD',
        intro: '<p>Use this dropdown to select whether fish observed for the last time will have yellow interiors or not.</p>'
      },
      {
        element: '#propMovedDD',
        intro: '<p>Use this dropdown to select whether transitions in the transitions box below are calculated as a proportion of all fish at the beginning of the interval or as a proportion of the fish in the same river at the beginning of the interval.</p>'
      },
      {
        element: '#unselectAll',
        intro: '<p>Use this botton to unselect all circles.</p>'
      },
      {
        element: '#showNotEnc',
        intro: '<p>Use this botton to show fish that were known to be alive, but were not captured (encountered).</p>'
      },
      {
        element: '#collapseTwo',
        intro: '<p>This panel shows distributions of daily environmental conditions (stream temperature [top, degress C] and stream flow [bottom, m3/sec]) for all samples (blue) and for the selected sampling interval (orange) for the current season. This panel and those below can be collapsed by double-clicking on the header.</p>'
      },
      {
        element: '#collapseThree',
        intro: '<p>This panel shows transitions (proportions) of fish moving from one part of the stream network to another. Stream locations are labelled on the map. Em stands for emigrants, which are fish that were observed for the last time on PIT tag antennas at the bottom of the study area.</p>'
      },
      {
        element: '#collapseFour',
        intro: '<p>This panel shows movement distance (m) distributions for the current season, for all years and for the current year.  </p>'
      },
      {
        element: '#btn-help',
        intro: '<p>Click this button to repeat this tour.</p>'
      }
    ]
  })
  intro.start();
}

//  $('#collapseTwo').collapse('toggle')
//  $('#collapseThree').collapse('toggle')
//  $('#collapseFour').collapse('toggle')

/*** Copyright 2013 Teun Duynstee Licensed under the Apache License, Version 2.0 ***/
firstBy=function(){function n(n){return n}function t(n){return"string"==typeof n?n.toLowerCase():n}function r(r,e){if(e="number"==typeof e?{direction:e}:e||{},"function"!=typeof r){var i=r;r=function(n){return n[i]?n[i]:""}}if(1===r.length){var u=r,o=e.ignoreCase?t:n;r=function(n,t){return o(u(n))<o(u(t))?-1:o(u(n))>o(u(t))?1:0}}return-1===e.direction?function(n,t){return-r(n,t)}:r}function e(n,t){var i="function"==typeof this?this:!1,u=r(n,t),o=i?function(n,t){return i(n,t)||u(n,t)}:u;return o.thenBy=e,o}return e}();