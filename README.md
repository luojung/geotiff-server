## geotiff-server
A node.js server that generate tiles from cloud-optimised geotiff's designed for use with a serverless function provider like AWS Lambda.

## The general idea
- A simple slippy-map tile server based on NodeJS and [express.js](https://expressjs.com/)
- Configurable 'providers' to handle interactions with datastores such as the [landsat on AWS](https://landsatonaws.com/)
- An endpoint for rgb tiles allowing different band combinations
- An endpoint for calculated indices such as NDVI
- An endpoint for getting metadata

## deploy
```
cd sl-component-vis-raster-v2
./run.sh
```

## usage
| Param         |  Description                          | Mandatory  |
| ------------- |  ------------------------------------ | ---------- |
| fileName      |    A fileName for a geotiff           | true       |
| dir           | A dir where file named fileName exist | false      |
| rgbBands      | specify the bands aganist RGB channels| false      |


fileName 文件默认存放在(./test/data/ )路径下
单波段影像默认使用波段1、1、1作为rgb三通道的输入
两波段影像默认使用波段1、2、1作为rgb三通道的输入
多波段影像默认使用波段1、2、3作为rgb三通道的输入


#### Example
````
访问默认存放路径下的影像
http://localhost:5000/tiles/27297/12889/15.png?fileName=clip2_cog.tif    

访问指定路径下的影像
http://localhost:5000/tiles/27297/12889/15.png?fileName=clip2_cog.tif&dir=/work/test/

````
