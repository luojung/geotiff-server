import { LandsatPdsProvider } from './LandsatPdsProvider'
import { DeaProvider } from './DeaProvider'
import { localProvider } from './localProvider'

const providerList = [new LandsatPdsProvider(), new DeaProvider(), new localProvider()]
export default providerList

export function getProviderByName (providerName) {
  for (var i = 0; i < providerList.length; i++) {
    if (providerList[i].name === providerName) {
      return providerList[i]
    }
  }
}
