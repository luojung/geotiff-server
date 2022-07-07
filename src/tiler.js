import { getRgbFromRamp } from './symbology'
import { rescaleValueTo256 } from './utils'

import tilebelt from 'tilebelt'
import jpeg from 'jpeg-js'
import expr from 'expr-eval'
const Parser = expr.Parser

const tileHeight = 256
const tileWidth = 256

const frameData = Buffer.alloc(tileWidth * tileHeight * 4)

export function createBbox (x, y, z) {
  return tilebelt.tileToBBOX([x, y, z])
}

export function createRgbTile (rData, gData, bData, percentiles,nodata,res) {
  // console.log("rData:",rData[0],rData[1],rData[2])
  if(percentiles[0]==0&&percentiles[1]==255){
    for (let i = 0; i < frameData.length / 4; i++) {
      frameData[i * 4] = rData[i]
      frameData[(i * 4) + 1] = gData[i]
      frameData[(i * 4) + 2] = bData[i]
      if(rData[i]==undefined||gData[i]==undefined||bData[i]==undefined ||(rData[i]==0&&gData[i]==0&&bData[i]==0) ||(rData[i]==nodata&&gData[i]==nodata&&bData[i]==nodata)){
           frameData[(i * 4) + 3] = 0
      }
      else
          frameData[(i * 4) + 3] = 255
    }
  }
  else{
    for (let i = 0; i < frameData.length / 4; i++) {
      frameData[i * 4] = rescaleValueTo256(rData[i], percentiles)
      frameData[(i * 4) + 1] = rescaleValueTo256(gData[i], percentiles)
      frameData[(i * 4) + 2] = rescaleValueTo256(bData[i], percentiles)
      if(rData[i]==undefined||gData[i]==undefined||bData[i]==undefined ||(rData[i]==0&&gData[i]==0&&bData[i]==0)||(rData[i]==nodata&&gData[i]==nodata&&bData[i]==nodata)){
        frameData[(i * 4) + 3] = 0
      }
      else
          frameData[(i * 4) + 3] = 255
    }
  }
  
  // return encodeImageData(frameData)
  return encodePng(frameData,res)
}

export function createSingleBandTile (bands, expression, colorRamp) {
  var parser = new Parser()
  var expr = parser.parse(expression)
  for (let i = 0; i < frameData.length / 4; i++) {
    const args = {}
    for (var ii = 0; ii < bands.length; ii++) {
      args[bands[ii].shortName] = bands[ii].data[i]
    }

    var calculatedVal = expr.evaluate(args)
    const rgb = getRgbFromRamp(colorRamp, calculatedVal)

    frameData[i * 4] = rgb[0]
    frameData[(i * 4) + 1] = rgb[1]
    frameData[(i * 4) + 2] = rgb[2]
    frameData[(i * 4) + 3] = rgb[3]
  }

  return encodeImageData(frameData)
}

export function encodeImageData (data) {
  return jpeg.encode({
    data: data,
    width: tileWidth,
    height: tileHeight
  })
}


export function encodePng(data ,res){
  var fs = require("fs"),
  PNG = require("pngjs").PNG;
  
  let png = new PNG({
    width: tileWidth,
    height: tileHeight,
    bitDepth: 8,
    colorType: 6,
    inputHasAlpha: true,
  });
  
  png.data = data
  // var dst = fs.createWriteStream( "./out.png");
  const readStream=png.pack().pipe(res)

  return  readStream
  
}