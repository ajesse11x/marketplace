import { server } from 'decentraland-server'
import { env } from 'decentraland-commons'
import { eth } from 'decentraland-eth'

import { Parcel } from './Parcel.model'
import { AssetRouter } from '../Asset.router'
import { ASSET_TYPES } from '../../shared/asset'
import { Bounds } from '../../shared/map'
import { sanitizeParcels, sanitizeParcel } from '../../sanitize'
import { unsafeParseInt } from '../../lib'

export class ParcelRouter {
  constructor(app) {
    this.app = app
  }

  mount() {
    /**
     * Returns the parcels in between the supplied coordinates
     * Or filtered by the supplied params
     * @param  {string} nw - North west coordinate
     * @param  {string} sw - South west coordinate
     * @param  {string} status - specify a publication status to retreive: [cancelled|sold|pending].
     * @param  {string} sort_by - Publication prop
     * @param  {string} sort_order - asc or desc
     * @param  {number} limit
     * @param  {number} offset
     * @return {array<Parcel>}
     */
    this.app.get('/parcels', server.handleRequest(this.getParcels))

    /**
     * Returns the parcels by its coordinates
     * @param  {string} x - coordinate X
     * @param  {string} y - coordinate Y
     * @return {array<Parcel>}
     */
    this.app.get('/parcels/:x/:y', server.handleRequest(this.getParcel))

    /**
     * Returns a random available parcel
     * @return {Parcel}
     */
    this.app.get(
      '/parcels/available',
      server.handleRequest(this.getAvailableParcel)
    )

    /**
     * Returns the amount of available parcels left
     * @return {Parcel}
     */
    this.app.get(
      '/parcels/availableCount',
      server.handleRequest(this.getAvailableParcelCount)
    )

    /**
     * Returns the parcel by its token id
     * @param  {string} tokenId  - Parcel token id
     * @return {string} coordinates
     */
    this.app.get(
      '/parcels/:tokenId',
      server.handleRequest(this.getParcelByTokenId)
    )

    /**
     * Returns the parcel token id by its coordinates
     * @param  {string} x - coordinate X
     * @param  {string} y - coordinate Y
     * @return {string} token id
     */
    this.app.get(
      '/parcels/:x/:y/encodedId',
      server.handleRequest(this.getParcelTokenId)
    )

    /**
     * Returns the parcels an address owns
     * @param  {string} address  - Parcel owner
     * @param  {string} [status] - specify a publication status to retreive: [cancelled|sold|pending].
     * @return {array<Parcel>}
     */
    this.app.get(
      '/addresses/:address/parcels',
      server.handleRequest(this.getAddressParcels)
    )
  }

  async getParcels(req) {
    let parcels
    let total

    try {
      const nw = server.extractFromReq(req, 'nw')
      const se = server.extractFromReq(req, 'se')
      const rangeParcels = await Parcel.inRange(nw, se)

      parcels = sanitizeParcels(rangeParcels)
      total = parcels.length
    } catch (error) {
      // Force parcel type
      req.params.asset_type = ASSET_TYPES.parcel
      const result = await new AssetRouter().getAssets(req)

      parcels = result.assets
      total = result.total
    }

    return { parcels, total }
  }

  async getParcel(req) {
    let x, y

    try {
      x = unsafeParseInt(server.extractFromReq(req, 'x'))
    } catch (e) {
      throw new Error('Invalid coordinate "x" must be an integer')
    }

    try {
      y = unsafeParseInt(server.extractFromReq(req, 'y'))
    } catch (e) {
      throw new Error('Invalid coordinate "y" must be an integer')
    }

    Bounds.validateInBounds(x, y)

    const id = Parcel.buildId(x, y)
    const parcel = await Parcel.findById(id)

    return sanitizeParcel(parcel)
  }

  async getAvailableParcel() {
    const parcel = await Parcel.findAvailable()
    if (parcel) {
      return sanitizeParcel(parcel)
    }
  }

  async getAvailableParcelCount() {
    const auctionParcelCount = env.get('AUCTION_PARCEL_COUNT', null)
    if (auctionParcelCount !== '' && auctionParcelCount != null) {
      return parseInt(auctionParcelCount, 10)
    }

    return Parcel.countAvailable()
  }

  async getAddressParcels(req) {
    const address = server.extractFromReq(req, 'address').toLowerCase()

    let parcels = []

    try {
      const status = server.extractFromReq(req, 'status')
      parcels = await Parcel.findByOwnerAndStatus(address, status)
    } catch (error) {
      parcels = await Parcel.findByOwner(address)
    }

    return sanitizeParcels(parcels)
  }

  async getParcelByTokenId(req) {
    const token_id = eth.utils
      .toBigNumber(server.extractFromReq(req, 'tokenId'))
      .toString()

    const parcel = await Parcel.findOne({ token_id })

    return sanitizeParcel(parcel)
  }

  async getParcelTokenId(req) {
    const x = server.extractFromReq(req, 'x')
    const y = server.extractFromReq(req, 'y')
    const { token_id } = await Parcel.findOne({ x, y })
    return { encoded_id: eth.utils.toHex(token_id) }
  }
}
