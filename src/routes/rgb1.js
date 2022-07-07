import { createBbox, createRgbTile } from '../tiler'
import { openTiffImage1, getScene1 } from '../cog'
import path from 'path'
import { latLonToUtm,latLonTotile,lonlat2WebMercator } from '../utils'
var proj4 = require("proj4")

function  reprojectBbbox (requestBbox, geotiffProps) {
  if (geotiffProps.ProjectedCSTypeGeoKey!=undefined){
    const bboxMinUtm = proj4('EPSG:4326',"EPSG:"+geotiffProps.ProjectedCSTypeGeoKey).forward([requestBbox[0], requestBbox[1]])
    const bboxMaxUtm = proj4('EPSG:4326',"EPSG:"+geotiffProps.ProjectedCSTypeGeoKey).forward([requestBbox[2], requestBbox[3]])
    return [bboxMinUtm[0], bboxMinUtm[1], bboxMaxUtm[0], bboxMaxUtm[1]]
  }
  else if(geotiffProps.nativeSR.search("unnamed")!=-1){
    const bboxMinUtm = proj4('EPSG:4326',"EPSG:3857").forward([requestBbox[0], requestBbox[1]])
    const bboxMaxUtm = proj4('EPSG:4326',"EPSG:3857").forward([requestBbox[2], requestBbox[3]])
    return [bboxMinUtm[0], bboxMinUtm[1], bboxMaxUtm[0], bboxMaxUtm[1]]
  }
}

function getrgbBands(req, band_length){
  if(band_length>=3){
    var rgbBands = req.query.rgbBands ? req.query.rgbBands.split(',') : [1,2,3]
    rgbBands.forEach((element,index) => {
      if(element>3) rgbBands[index]=3
      else if(element<1) rgbBands[index] =1
    });
    return rgbBands
  }
  else if(band_length==2) {
    var rgbBands = req.query.rgbBands ? req.query.rgbBands.split(',') : [1,2,1]  //当只存在两个波段时，蓝色通道复用红色通道
    rgbBands.forEach((element,index) => {
      if(element>2) rgbBands[index]=2
      else if(element<1) rgbBands[index] =1
    });
    return rgbBands
  }
  else if(band_length==1) {
    return [1,1,1]
  }
}

function getpara(image){
  var bands=image.data.getSamplesPerPixel()
  var bytes=image.data.getBytesPerPixel()/bands
  // var nodata= image.data.getGDALNoData()
  var nodata= 0//image.data.getGDALMetadata()
  
  // console.log("###byte:",image.data.getSampleByteSize(0))
  var pMax
  if(bytes==1){
    pMax=255
  }
  else if(bytes==2){
    pMax=65535
  }
  return [bands,pMax,nodata]
}

async function fetchTile(requestBbox, layer,recall){
  var mapnik = require("mapnik");
  var fs = require("fs");
  
  mapnik.register_default_fonts();
  mapnik.register_default_input_plugins();
  var map = new mapnik.Map(256, 256);
  
  map.load("./test/stylesheet_cog.xml", function(err, map) {
     console.log("##",map);
     var start = new Date().getTime()
     map.zoomToBox(requestBbox)
     var im = new mapnik.Image(256, 256);
     map.render(im, function(err, im) {
         im.encode("png", function(err, buffer) {
             recall(buffer)
             fs.writeFile("map_cog2.png", buffer, (err) => { 
                 if (err) { 
                   console.log(err); 
                 } 
               });
               var processTime=new Date().getTime()
               console.log("###process Time1.1:",processTime-start)
               return buffer
          });
    });
  });
}


export default async (req, res) => {
  const fileName = req.query.fileName ? req.query.fileName : null
  if (fileName === null) throw new Error('GeoTiff-Server: You must pass in a fileName to your query')

  var start = new Date().getTime()
  const dir = req.query.dir ? req.query.dir : path.join(__dirname, 'test', 'data')
  var requestBbox = createBbox(Number(req.params.x), Number(req.params.y), Number(req.params.z))

  var image= []
  image.dir=path.join(dir, fileName)

  //返回结果
  res.contentType('image/png')
  var buffer= fetchTile(requestBbox, image.dir, buffer=>{ res.send(buffer) } )

  var processTime=new Date().getTime()
  console.log("###process Time1:",processTime-start)

  // //返回结果
  // res.contentType('image/png')
  // // res.send(buffer)

}



// export default async (req, res) => {
//   const fileName = req.query.fileName ? req.query.fileName : null
//   if (fileName === null) throw new Error('GeoTiff-Server: You must pass in a fileName to your query')

//   const dir = req.query.dir ? req.query.dir : path.join(__dirname, 'test', 'data')
//   var requestBbox = createBbox(Number(req.params.x), Number(req.params.y), Number(req.params.z))

//   var image= []
//   image.dir=path.join(dir, fileName)

//   //open img
//    var start = new Date().getTime()
//   const getImageCalls = []
//   getImageCalls.push(openTiffImage1(image))
//   await Promise.all(getImageCalls)
//   var processTime=new Date().getTime()
//   console.log("###process Time1:",processTime-start)


//   //get info of img
//   image.data = await image.tiff.getImage()
//   const geotiffProps = image.data.getGeoKeys()
//   // console.log("###geotiffProps:",geotiffProps)
//   var imgBbox=[]

//   if(geotiffProps.ProjectedCSTypeGeoKey!=undefined)
//       imgBbox = reprojectBbbox(requestBbox, geotiffProps)
//   else if(geotiffProps.GeographicTypeGeoKey==4326)
//       imgBbox =requestBbox

//   processTime=new Date().getTime()
//   console.log("###process Time2:",processTime-start)
  
//   //提前异步执行块读取操作，提高执行效率
//   const getDataCalls = []
//   getDataCalls.push(getScene1(image, imgBbox))
  

//   //计算渲染参数
//   var pMin=0
//   var [bands,pMax, nodata]= getpara(image)
//   // console.log("###nodata:",nodata)
//   var rgbBands= getrgbBands(req,bands)
  

//   //等待块读取完成，编码
//   await Promise.all(getDataCalls)
//   processTime=new Date().getTime()
//   console.log("###process Time3:",processTime-start)

//   res.contentType('image/png')
//   const png = createRgbTile(image.block[rgbBands[0]-1], image.block[rgbBands[1]-1], image.block[rgbBands[2]-1], [pMin, pMax],nodata,res)
  
//   processTime=new Date().getTime()
//   console.log("###process Time4:",processTime-start)

//   //返回结果
//   // res.send(img)
// }
