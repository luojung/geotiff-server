// Taken from https://stackoverflow.com/a/14438954
import tilebelt from 'tilebelt'

export function getUniqueValues (arr) {
  function onlyUnique (value, index, self) {
    return self.indexOf(value) === index
  }
  return arr.filter(onlyUnique)
}

export function findUniqueBandShortNamesInString (string) {
  var regExpressionTester = /(b)\d+/g
  return getUniqueValues(string.match(regExpressionTester))
}

export function  latLonTotile(lng, lat, zoom)
{
    var out_tile=[];
    out_tile.x = Math.floor((lng + 180.0) / 360.0 * Math.pow(2.0, zoom))

    var lat_ = Math.PI * lat / 180;
    out_tile.y = Math.floor((1.0 - Math.log( Math.tan(lat_) + (1.0 / Math.cos(lat_))) /Math.PI) /   2.0 * Math.pow(2.0, zoom))
    out_tile.z = zoom;

    return out_tile;
};

export function lonlat2WebMercator(lon,lat){
  var xy=[];
  var x =  lon*20037508.34/180;  
  var y =Math.log(Math.tan((90+lat)*Math.PI/360))/(Math.PI/180); 
  y = y *20037508.34/180; 
　xy[0]=x; 
　xy[1]=y; 
　return xy; 
}
export function webMercator2lonlat(x,y){
  var lonlat= [];
  var lon = x/20037508.34*180;  
  var lat = y/20037508.34*180;  
  lat= 180/Math.PI*(2*Math.atan(Math.exp(lat*Math.PI/180))-Math.PI/2);  
  lonlat[0] = lon;  
  lonlat[1] = lat; 
  return lonlat;
}

export function  webMercator2tile(x, y, zoom)
{
  var [lon,lat]=webMercator2lonlat(x, y)
  return tilebelt.pointToTile (lon,lat,zoom)
};


export function latLonToUtm (coords, zone, requiresSouthernHemiAdjustment) {
  const lat = coords[1]
  const lon = coords[0]
  if (!(-80 <= lat && lat <= 84)) throw new Error('Outside UTM limits') //eslint-disable-line

  const falseEasting = 500e3
  const falseNorthing = 10000e3

  var λ0 = degreesToRadians(((zone - 1) * 6 - 180 + 3)) // longitude of central meridian

  // grid zones are 8° tall; 0°N is offset 10 into latitude bands array
  var mgrsLatBands = 'CDEFGHJKLMNPQRSTUVWXX' // X is repeated for 80-84°N
  var latBand = mgrsLatBands.charAt(Math.floor(lat / 8 + 10))
  // adjust zone & central meridian for Norway
  if (zone === 31 && latBand === 'V' && lon >= 3) { zone++; degreesToRadians(λ0 += (6)) }
  // adjust zone & central meridian for Svalbard
  if (zone === 32 && latBand === 'X' && lon < 9) { zone--; degreesToRadians(λ0 -= (6)) }
  if (zone === 32 && latBand === 'X' && lon >= 9) { zone++; degreesToRadians(λ0 += (6)) }
  if (zone === 34 && latBand === 'X' && lon < 21) { zone--; degreesToRadians(λ0 -= (6)) }
  if (zone === 34 && latBand === 'X' && lon >= 21) { zone++; degreesToRadians(λ0 += (6)) }
  if (zone === 36 && latBand === 'X' && lon < 33) { zone--; degreesToRadians(λ0 -= (6)) }
  if (zone === 36 && latBand === 'X' && lon >= 33) { zone++; degreesToRadians(λ0 += (6)) }

  var φ = degreesToRadians(lat)
  var λ = degreesToRadians(lon) - λ0

  const a = 6378137
  const f = 1 / 298.257223563
  // WGS 84: a = 6378137, b = 6356752.314245, f = 1/298.257223563;

  var k0 = 0.9996

  var e = Math.sqrt(f * (2 - f))
  var n = f / (2 - f)
  var n2 = n * n
  const n3 = n * n2
  const n4 = n * n3
  const n5 = n * n4
  const n6 = n * n5

  const cosλ = Math.cos(λ)
  const sinλ = Math.sin(λ)

  var τ = Math.tan(φ)
  var σ = Math.sinh(e * Math.atanh(e * τ / Math.sqrt(1 + τ * τ)))

  var τʹ = τ * Math.sqrt(1 + σ * σ) - σ * Math.sqrt(1 + τ * τ)

  var ξʹ = Math.atan2(τʹ, cosλ)
  var ηʹ = Math.asinh(sinλ / Math.sqrt(τʹ * τʹ + cosλ * cosλ))

  var A = a / (1 + n) * (1 + 1 / 4 * n2 + 1 / 64 * n4 + 1 / 256 * n6)

  var α = [ null, // note α is one-based array (6th order Krüger expressions)
    1 / 2 * n - 2 / 3 * n2 + 5 / 16 * n3 + 41 / 180 * n4 - 127 / 288 * n5 + 7891 / 37800 * n6,
    13 / 48 * n2 - 3 / 5 * n3 + 557 / 1440 * n4 + 281 / 630 * n5 - 1983433 / 1935360 * n6,
    61 / 240 * n3 - 103 / 140 * n4 + 15061 / 26880 * n5 + 167603 / 181440 * n6,
    9561 / 161280 * n4 - 179 / 168 * n5 + 6601661 / 7257600 * n6,
    34729 / 80640 * n5 - 3418889 / 1995840 * n6,
    212378941 / 319334400 * n6 ]

  var ξ = ξʹ
  var j = 1
  for (j; j <= 6; j++) ξ += α[j] * Math.sin(2 * j * ξʹ) * Math.cosh(2 * j * ηʹ)

  var η = ηʹ
  for (j = 1; j <= 6; j++) η += α[j] * Math.cos(2 * j * ξʹ) * Math.sinh(2 * j * ηʹ)

  var x = k0 * A * η
  var y = k0 * A * ξ

  x = x + falseEasting

  if (requiresSouthernHemiAdjustment && y < 0) y = y + falseNorthing

  return [x, y]
};

export function degreesToRadians (degrees) {
  return degrees * Math.PI / 180
}

export function scaleValueBetweenRange (value, max, min) {
  return (value - min) / (max - min)
}

export function rescaleValueTo256 (oldVal, percentiles) {
  if (oldVal < percentiles[0]) return 0
  if (oldVal > percentiles[1]) return 255
  return (255 - 0) * (oldVal - percentiles[0]) / (percentiles[1] - percentiles[0]) + 0
}
