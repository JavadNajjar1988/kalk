import * as R from 'ramda'
import * as ID from '../../../ids.js'
import { ensurePersianTacticalLabel } from '../../../persianTacticalLabels.js'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [symbol, tags] = await this.store.collect(id, keys)

  return ({
    id,
    scope: ID.SYMBOL,
    // Keep both languages searchable while all visible option labels are Persian.
    text: [
      ...symbol.hierarchy,
      ...symbol.hierarchy.map(ensurePersianTacticalLabel)
    ].join(' '),
    tags: [
      ...symbol.dimensions,
      symbol.scope,
      ...(tags || [])
    ]
  })
}
