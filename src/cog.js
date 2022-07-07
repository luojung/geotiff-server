const GeoTIFF = require('geotiff');
const { fromUrl, fromUrls, fromArrayBuffer, fromBlob, fromFile } = GeoTIFF;
// import geotiff from 'geotiff'
console.log(GeoTIFF);
let path = require('path')

export async function openTiffImage (band, bbox, provider) {
  try {

    band.tiff = await geotiff.fromUrl(band.urlPath)
      return band
    // if (process.env.NODE_ENV === 'testLocal') {
    //   console.log("'###path1'***",path.join(__dirname, 'test', 'harness', path.basename(band.urlPath)) )
    //   band.tiff = await geotiff.fromFile(path.join(__dirname, 'test', 'harness', path.basename(band.urlPath)))
    //   // console.log("###'band.tiff",band.tiff )
    //   return band
    // } else {
    //   // console.log("'path2'****",path.join(__dirname, 'test', 'harness', path.basename(band.urlPath)))
    //   // band.tiff = await geotiff.fromFile(path.join(__dirname, 'test', 'harness', path.basename(band.urlPath)))
    //   band.tiff = await geotiff.fromUrl(band.urlPath)
    //   return band
    // }
  } catch (err) {
    throw err
  }
}

export async function  openTiffImage1 (image ) {
  try {
    // image.tiff = await geotiff.fromFile(image.dir)
    console.log("###dir:",image.dir)
    image.tiff = await fromFile(image.dir)
    return image
  } catch (err) {
    throw err
  }
}

export async function getScene (band, bbox) {
  try {
    const data = await band.tiff.readRasters({
      bbox: bbox,
      width: 256,
      height: 256
    })
    // band.data = data[0]
    band.data = data
    return band
  } catch (err) {
    throw err
  }
}

export async function getScene1 (image, bbox) {
  try {
    image.block=await image.tiff.readRasters({
      bbox: bbox,
      width: 256,
      height: 256
    })
    return image
  } catch (err) {
    throw err
  }
}

export async function getSceneOverview (band, bbox, provider) {
  try {
    let tiff = null
    if (process.env.NODE_ENV === 'testLocal') {
      tiff = await geotiff.fromFile(path.join(__dirname, 'test', 'harness', path.basename(band.urlPath)))
    } else {
      // tiff = await geotiff.fromFile(path.join(__dirname, 'test', 'harness', path.basename(band.urlPath)))
      tiff = await geotiff.fromUrl(band.urlPath)
    }
    const image = await tiff.getImage()
    band.meta = image.getGDALMetadata()
    const data = await tiff.readRasters({
      bbox: bbox,
      width: 1024,
      height: 1024
    })
    band.data = Object.values(data[0])
    return band
  } catch (err) {
    throw err
  }
}
