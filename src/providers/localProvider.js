import fetch from 'node-fetch'
import { latLonToUtm, degreesToRadians } from '../utils'

export class localProvider {
  constructor () {
    this.name = 'local'
    this.baseUrl = ''
    this.naturalColorBands = ['b1',]
    this.bands = [
      {
        shortName: 'b1',
        bandNumber: 1,
        commonName: 'Blue',
        resolution: 30,
        filePath: 'riocog.tif'
      }
    ]
    this.requiresReprojecting = false //true
    this.requiresToaCorrection = true
  }

  constructImageUrl (sceneId) {
    // const path = sceneId.substring(3, 6)
    // const row = sceneId.substring(6, 9)
    return `${this.baseUrl}/${sceneId}.tif`
  }

  getBandByShortName (shortName) {
    for (var i = 0; i < this.bands.length; i++) {
      if (this.bands[i].shortName === shortName) return this.bands[i]
    }
  }

  getRequiredBandsByShortNames (bands, sceneId) {
    const requiredBands = []
    // for (var i = 0; i < bands.length; i++) {
    //   const matchingBand = this.getBandByShortName(bands[i])
    //   matchingBand.urlPath = this.constructImageUrl(sceneId, matchingBand)
    //   requiredBands.push(matchingBand)
    // }

    const matchingBand = this.getBandByShortName(bands[0])
    matchingBand.urlPath = this.constructImageUrl(sceneId, matchingBand)
    requiredBands.push(matchingBand)

    return requiredBands
  }

  getBandUrls (sceneId, bands) {
    const urls = []
    for (var i = 0; i < bands.length; i++) {
      urls.push({
        band: bands[i],
        url: this.constructImageUrl(sceneId, bands[i])
      })
    }
    return urls
  }

  async getMetadata (sceneId) {
    const path = sceneId.substring(3, 6)
    const row = sceneId.substring(6, 9)
    var metaUrl = `${this.baseUrl}/${path}/${row}/${sceneId}/${sceneId}_MTL.json`

    const res = await fetch(metaUrl, {
      timeout: 5000
    })
    const meta = await res.json()
    return meta
  }

  reprojectBbbox (requestBbox, nativeSR) {
    const zoneHemi = nativeSR.split('UTM zone ')[1]
    const sceneUtmZone = zoneHemi.substring(0, 2)
    const bboxMinUtm = latLonToUtm([requestBbox[0], requestBbox[1]], sceneUtmZone)
    const bboxMaxUtm = latLonToUtm([requestBbox[2], requestBbox[3]], sceneUtmZone)
    return [bboxMinUtm[0], bboxMinUtm[1], bboxMaxUtm[0], bboxMaxUtm[1]]
  }

  performToa (band) {
    const sunElevation = this.metadata.L1_METADATA_FILE.IMAGE_ATTRIBUTES.SUN_ELEVATION
    const se = Math.sin(degreesToRadians(sunElevation))
    const reflectanceRescalingFactor = this.metadata.L1_METADATA_FILE.RADIOMETRIC_RESCALING[`REFLECTANCE_MULT_BAND_${band.bandNumber}`]
    const reflectanceAddition = this.metadata.L1_METADATA_FILE.RADIOMETRIC_RESCALING[`REFLECTANCE_ADD_BAND_${band.bandNumber}`]

    const tmp = new Float32Array(band.data.length)
    for (var i = 0; i < band.data.length; i++) {
      band.data[i] = (((reflectanceRescalingFactor * band.data[i]) + reflectanceAddition) / se) * 100000
      tmp[i] = band.data[i] / 65535
      band.data[i] = Math.round(tmp[i] * 255)
    }

  }

}
