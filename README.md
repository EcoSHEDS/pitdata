Interactive Data Visualizations of Fish Tagging Data for SHEDS
==============================================================

Ben Letcher, PhD and Jeffrey D Walker, PhD

USGS Conte Anadromous Fish Lab and UMass Amherst Dept of Environmental Conservation

September 2016

**Live Website**: [http://pitdata.ecosheds.org]()

## About

This repo contains source code for a series of interactive data visualizations showing the movement of individual fish based on the West Brook (MA) and Stanley Brook (ME) PIT Tagging Studies.

## Directory Structure

```txt
public/               - root directory of website
public/data           - common data directory
public/crossfilter    - crossfilter application
public/fish-movements - fish movements application
public/img            - static images
public/libs           - front-end dependencies (installed with bower, see below)
public/overview       - overview application
```

## Applications

- Overview - introduction to the two tagging studies (WB and SB) [`./public/overview`]  
- Crossfilter - multi-variate crossfilter application (WB only) [`./public/crossfilter`]  
- Fish Movements - dynamic fish movements application (WB and SB) [`./public/fish-movements`]  

## Dependencies

Install front-end dependencies using [bower](https://bower.io/). Libraries are installed to the `public/libs` folder.

```bash
npm install -g bower # if not already installed
bower install
```

## Development Server

Use [http-server](https://www.npmjs.com/package/http-server) to run a development server from the `public/` root directory.

```bash
npm install -g http-server # if not already installed
http-server ./public -p 8080
```
