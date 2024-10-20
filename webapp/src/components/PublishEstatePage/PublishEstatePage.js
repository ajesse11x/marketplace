import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Container, Message, Loader } from 'semantic-ui-react'
import { t, T } from '@dapps/modules/translation/utils'

import { locations } from 'locations'
import Estate from 'components/Estate'
import EstateModal from 'components/EstateModal'
import EstateName from 'components/EstateName'
import TxStatus from 'components/TxStatus'
import { publicationType, authorizationType } from 'components/types'
import { isOpen } from 'shared/listing'
import PublishAssetForm from '../PublishAssetForm'

export default class PublishEstatePage extends React.PureComponent {
  static propTypes = {
    id: PropTypes.string.isRequired,
    authorization: authorizationType,
    isLoading: PropTypes.bool.isRequired,
    publication: publicationType,
    isTxIdle: PropTypes.bool.isRequired,
    onPublish: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
  }

  renderLoading() {
    return (
      <div>
        <Loader active size="massive" />
      </div>
    )
  }

  render() {
    const {
      id,
      publication,
      isLoading,
      authorization,
      isTxIdle,
      onPublish,
      onCancel
    } = this.props

    if (isLoading) {
      return this.renderLoading()
    }

    return (
      <Estate id={id} shouldBeOwner>
        {estate => {
          const isMarketplaceApproved =
            authorization && authorization.approvals.Marketplace.EstateRegistry
          const isOnSale = isOpen(publication)
          return (
            <div className="PublishEstatePage">
              {!isMarketplaceApproved ? (
                <Container text>
                  <Message
                    warning
                    icon="warning sign"
                    header={t('global.unauthorized')}
                    content={
                      <T
                        id="asset_publish.please_authorize"
                        values={{
                          settings_link: (
                            <Link to={locations.settings()}>Settings</Link>
                          ),
                          asset_name: t('name.estate')
                        }}
                      />
                    }
                  />
                </Container>
              ) : null}
              <EstateModal
                parcels={estate.data.parcels}
                title={
                  <T
                    id={
                      isOnSale
                        ? 'asset_publish.update_asset'
                        : 'asset_publish.list_asset'
                    }
                    values={{ asset_name: t('name.estate') }}
                  />
                }
                subtitle={
                  <T
                    id={
                      isOnSale
                        ? 'asset_publish.set_new_asset_price'
                        : 'asset_publish.set_asset_price'
                    }
                    values={{ asset_name: estate.data.name }}
                  />
                }
                hasCustomFooter
              >
                <PublishAssetForm
                  asset={estate}
                  assetName={t('name.estate')}
                  publication={isOnSale ? publication : null}
                  isTxIdle={isTxIdle}
                  onPublish={onPublish}
                  onCancel={onCancel}
                  isDisabled={!isMarketplaceApproved}
                />
                <TxStatus.Asset
                  asset={estate}
                  name={<EstateName estate={estate} />}
                />
              </EstateModal>
            </div>
          )
        }}
      </Estate>
    )
  }
}
