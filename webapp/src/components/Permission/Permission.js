import React from 'react'
import PropTypes from 'prop-types'

import {
  walletType,
  assetType,
  actionType,
  assetTypingType
} from 'components/types'
import { isOnSale, canGetMortgage, isBiddeable } from 'modules/asset/utils'
import { canCreateEstate } from 'modules/parcels/utils'
import { can, ACTIONS } from 'shared/roles'

export default class Permission extends React.PureComponent {
  static propTypes = {
    wallet: walletType.isRequired,
    asset: assetType.isRequired,
    assetType: assetTypingType.isRequired,
    isConnecting: PropTypes.bool,
    children: PropTypes.node.isRequired,
    actions: PropTypes.arrayOf(actionType)
  }

  static defaultProps = {
    actions: []
  }

  isDoable(action) {
    const { wallet, asset, publications, bids } = this.props

    switch (action) {
      case ACTIONS.bid:
        return isBiddeable(wallet, asset, bids)
      case ACTIONS.buy:
      case ACTIONS.cancelSale:
        return isOnSale(asset, publications)
      case ACTIONS.createEstate:
        return canCreateEstate(wallet, asset, publications)
      case ACTIONS.getMortgage:
        return canGetMortgage(wallet, asset, publications)
      default:
        return true
    }
  }

  render() {
    const { wallet, isConnecting, asset, actions, children } = this.props

    if (isConnecting || actions.length === 0) {
      return null
    }

    for (const action of actions) {
      const hasPermission =
        can(action, wallet.address, asset) && this.isDoable(action)

      if (!hasPermission) {
        return null
      }
    }

    return children
  }
}
