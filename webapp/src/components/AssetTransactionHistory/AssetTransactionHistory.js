import React from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Grid, Responsive } from 'semantic-ui-react'
import { t } from '@dapps/modules/translation/utils'

import { locations } from 'locations'
import AddressBlock from 'components/AddressBlock'
import BlockDate from 'components/BlockDate'
import Mana from 'components/Mana'
import {
  assetType,
  assetTypingType,
  publicationType,
  bidType
} from 'components/types'
import {
  publicationToListing,
  bidToListing,
  sortListings,
  LISTING_STATUS,
  LISTING_SORT_BY
} from 'shared/listing'
import { findAssetPublications } from 'shared/publication'
import { distanceInWordsToNow, shortenAddress } from 'lib/utils'

import './AssetTransactionHistory.css'

export default class AssetTransactionHistory extends React.PureComponent {
  static propTypes = {
    asset: assetType.isRequired,
    assetType: assetTypingType.isRequired,
    publications: PropTypes.objectOf(publicationType),
    bids: PropTypes.arrayOf(bidType)
  }

  componentWillMount() {
    this.props.onFetchAssetTransactionHistory()
  }

  getAssetListings() {
    const { asset, publications, bids } = this.props
    const assetPublications = findAssetPublications(
      publications,
      asset,
      LISTING_STATUS.sold
    )

    const listingPublications = assetPublications.map(publicationToListing)
    const listingBids = bids.map(bidToListing)

    return sortListings(
      listingPublications.concat(listingBids),
      LISTING_SORT_BY.BLOCK_UPDATED
    )
  }

  hasAuctionData() {
    const { asset } = this.props
    return asset.auction_price != null && asset.auction_owner != null
  }

  renderAddress(address) {
    return (
      <div className="address-wrapper" title={address}>
        <Link to={locations.profilePageDefault(address)}>
          <AddressBlock
            address={address}
            scale={4}
            hasTooltip={false}
            hasLink={false}
          />&nbsp;
          <span className="short-address">{shortenAddress(address)}</span>
        </Link>
      </div>
    )
  }

  render() {
    const { asset } = this.props
    const assetListings = this.getAssetListings()

    if (!this.hasAuctionData() && assetListings.length === 0) {
      return null
    }

    return (
      <Grid stackable>
        <Grid.Row>
          <Grid.Column>
            <Grid
              className="AssetTransactionHistory asset-detail-row"
              columns="equal"
            >
              <Grid.Row>
                <Grid.Column>
                  <h3>{t('asset_detail.history.title')}</h3>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row className="transaction-history-header">
                <Grid.Column>{t('global.price')}</Grid.Column>
                <Grid.Column>{t('asset_detail.history.when')}</Grid.Column>
                <Responsive
                  as={Grid.Column}
                  minWidth={Responsive.onlyTablet.minWidth}
                >
                  {t('global.from')}
                </Responsive>
                <Responsive
                  as={Grid.Column}
                  minWidth={Responsive.onlyTablet.minWidth}
                >
                  {t('asset_detail.history.to')}
                </Responsive>
              </Grid.Row>

              {assetListings.map(listing => (
                <Grid.Row
                  key={listing.id}
                  className="transaction-history-entry"
                >
                  <Grid.Column>
                    <Mana amount={listing.price} />
                  </Grid.Column>
                  <Grid.Column>
                    <BlockDate
                      blockNumber={listing.block_number}
                      blockTime={
                        listing.block_time_updated_at ||
                        listing.block_time_created_at
                      }
                    />
                  </Grid.Column>
                  <Responsive
                    as={Grid.Column}
                    minWidth={Responsive.onlyTablet.minWidth}
                  >
                    {this.renderAddress(listing.from)}
                  </Responsive>
                  <Responsive
                    as={Grid.Column}
                    minWidth={Responsive.onlyTablet.minWidth}
                  >
                    {this.renderAddress(listing.to)}
                  </Responsive>
                </Grid.Row>
              ))}

              {this.hasAuctionData() ? (
                <Grid.Row className="transaction-history-entry">
                  <Grid.Column>
                    <Mana amount={asset.auction_price} />
                  </Grid.Column>
                  <Grid.Column>
                    {distanceInWordsToNow(
                      parseInt(asset.auction_timestamp, 10)
                    )}
                  </Grid.Column>
                  <Responsive
                    as={Grid.Column}
                    minWidth={Responsive.onlyTablet.minWidth}
                  >
                    {t('asset_detail.history.auction')}
                  </Responsive>
                  <Responsive
                    as={Grid.Column}
                    minWidth={Responsive.onlyTablet.minWidth}
                  >
                    {this.renderAddress(asset.auction_owner)}
                  </Responsive>
                </Grid.Row>
              ) : null}
            </Grid>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }
}
