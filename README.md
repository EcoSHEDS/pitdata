Interactive Data Visualizations of Fish Tagging Data for SHEDS
==============================================================

Ben Letcher, PhD and Jeffrey D Walker, PhD

USGS Conte Anadromous Fish Lab and UMass Amherst Dept of Environmental Conservation

September 2016

## About

This repo contains source code for a series of interactive data visualizations showing the movement of individual fish based on the West Brook (MA) and Stanley Brook (ME) PIT Tagging Studies.

## Applications
1. Tagging studies introduction (WB and SB)
2. Tagging studies overview (SB only)
3. Fish movements (WB and SB)

## Data Sources
1. Tagging studies introduction
  1. Coordinates for study site sections `/data/coordsForD3JS.csv`.
2. Tagging studies overview [`/PITtagOverview`]
  1. Raw fish data `/data/coreDataOut.csv` and environmental data `/data/envDataOut.csv` created with `createCSVFromDataWBSBForD3.R`.     2. Data input to create the CSV files is `data/dataWBSBForD3.RData` created  on `osensei/git/geWBCoreDataforD3FishMove/` using the 6 files that each start with 1_, 2_, or 3_ for both WB and SB and finally `4_combineWatersheds.R`. 
  3.Files were copied from osensei to felek and then to the /data subdirectories for each application. 
3. Fish movements [`/fish-movements`]
  1. Same data source as 'tagging Studies overview' above

## Dependencies

## Development Server
1. Introduction `none`
2. Overview `Home/wbTagViz/`
3. Fish movements `Home/d3FishMove/forceV4/selectWatershed/dev`

### Directory Structure
```
Project
 |
 +-- index.html [Introduction]
 |       
 +-- data
 |       
 +-- img 
 |       
 +-- libs
 |       
 +-- R
 
 +-- PITTagOverview [overview]
 |  |  
 |  +-- css
 |  |  
 |  +-- data
 |  |  
 |  +-- js
 |   
  +-- fish-movements [Fish movements]
 |  |  
 |  +-- css
 |  |  
 |  +-- data
 |  |  
 |  +-- js
 |  
 ```
