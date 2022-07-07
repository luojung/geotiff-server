import { getProviderByName } from '../providers'
import { createBbox, createRgbTile } from '../tiler'
import { openTiffImage, getScene } from '../cog'

export default async (req, res) => {
  const sceneId = req.query.sceneId ? req.query.sceneId : null
  if (sceneId === null) throw new Error('GeoTiff-Server: You must pass in a sceneId to your query')

  const providerSrc = req.query.provider ? req.query.provider : 'landsat-pds'
  const pMin = req.query.pMin ? req.query.pMin : 0
  const pMax = req.query.pMax ? req.query.pMax : 10000

  console.log("###providerSrc:",providerSrc)
  const provider = getProviderByName(providerSrc)
  console.log("###provider:",provider)

  var requestBbox = createBbox(Number(req.params.x), Number(req.params.y), Number(req.params.z))
  console.log("###‘requestBbox’:",requestBbox)

  const requiredBandsShortNames = req.query.rgbBands ? req.query.rgbBands.split(',') : provider.naturalColorBands

  const bandsToUse = provider.getRequiredBandsByShortNames(requiredBandsShortNames, sceneId)

  const getImageCalls = []

  for (var i = 0; i < bandsToUse.length; i++) {
    getImageCalls.push(openTiffImage(bandsToUse[i], provider))
  }
  await Promise.all(getImageCalls)
  // console.log("###band.urlPath:",band.urlPath)

  const firstImage = await bandsToUse[0].tiff.getImage()
  const geotiffProps = firstImage.getGeoKeys()
  console.log("###image.tiff:",bandsToUse[0].tiff)
  console.log("###geotiffProps:",geotiffProps)
  let imgBbox = null

  if (provider.requiresReprojecting) imgBbox = provider.reprojectBbbox(requestBbox, geotiffProps.GTCitationGeoKey)

  const getDataCalls = []
  for (var i = 0; i < bandsToUse.length; i++) {
    getDataCalls.push(getScene(bandsToUse[i], imgBbox))
  }
  await Promise.all(getDataCalls)

  console.log("###bandsToUse[0].data.length:",bandsToUse[0].data.length)
  console.log("###bandsToUse[0].data:",bandsToUse[0].data[1])
  const png = createRgbTile(bandsToUse[0].data, bandsToUse[1].data, bandsToUse[2].data, [pMin, pMax])
  var img = Buffer.from(png.data, 'binary')

  res.contentType('image/jpeg')
  res.send(img)

}
