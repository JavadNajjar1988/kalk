import * as R from 'ramda'
import * as ID from '../../../ids.js'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [service, tags] = await this.store.collect(id, keys)

  const document = {
    id,
    scope: ID.TILE_SERVICE,
    text: service.name,
    tags: [...(tags || []), service.type]
  }

  return document
}
