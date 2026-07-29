/**
 * Initialize all services needed for a project.
 * This is the web version adapted from Project-services.web.js.
 */
import leveljs from 'level-js'
import * as L from '../shared/level/index.js'
import Emitter from '../shared/emitter.js'
import SessionStore from '../store/web/SessionStore.js'
import PreferencesStore from '../store/web/PreferencesStore.js'
import Store from '../store/store/Store.js'
import ProjectStore from '../store/web/ProjectStore.js'
import TileLayerStore from '../store/store/TileLayerStore.js'
import { SpatialIndex } from '../store/store/SpatialIndex.js'
import Schema from '../store/store/schema/Schema.js'
import { FeatureStore } from '../store/store/FeatureStore.js'
import DocumentStore from '../store/store/DocumentStore.js'
import OptionStore from '../store/store/OptionStore.js'
import Nominatim from '../store/store/Nominatim.js'
import SearchIndex from '../store/store/SearchIndex.js'
import { CoordinatesFormat } from '../model/CoordinatesFormat.js'
import { MockUndo, MockSelection, MockOSDDriver, MockIpcRenderer } from './mocks.js'
import { CommandRegistry } from '../model/CommandRegistry.js'
import Signal from '@syncpoint/signal'
import { bindings } from '../renderer/bindings.js'
import { Clipboard } from '../renderer/Clipboard.js'

const PERSISTENT_BOOTSTRAP_TIMEOUT_MS = 8000

function timeoutAfter(ms, message) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms)
  })
}

function createProjectDb(projectUUID, { persistent }) {
  if (persistent) {
    const down = leveljs(`kalk:${projectUUID}`)
    return L.leveldb({ down })
  }

  return L.leveldb()
}

async function initializeProjectServicesWithDb(projectUUID, { persistent, onCoreReady }) {
  console.log('projectServices.js: Initializing services for project:', projectUUID, {
    persistent
  })

  const services = {}
  const emitter = new Emitter()
  const undo = new MockUndo()
  const selection = new MockSelection()
  const osdDriver = new MockOSDDriver()
  const ipcRenderer = new MockIpcRenderer()

  try {
    const db = createProjectDb(projectUUID, { persistent })

    const jsonDB = L.jsonDB(db)
    const wkbDB = L.wkbDB(db)
    const projectStore = new ProjectStore()
    const preferencesStore = new PreferencesStore()
    const sessionStore = new SessionStore()
    const store = new Store(jsonDB, wkbDB, undo, selection)
    const tileLayerStore = new TileLayerStore(store)
    const spatialIndex = new SpatialIndex(wkbDB)
    const featureStore = new FeatureStore(store)
    const clipboard = new Clipboard(selection, store)
    const documentStore = new DocumentStore(store)
    const coordinatesFormat = new CoordinatesFormat(emitter, preferencesStore)
    const optionStore = new OptionStore(coordinatesFormat, store, sessionStore)
    const nominatim = new Nominatim(store)
    const searchIndex = new SearchIndex(
      jsonDB,
      documentStore,
      optionStore,
      emitter,
      nominatim,
      sessionStore,
      spatialIndex,
    )

    services.emitter = emitter
    services.projectStore = projectStore
    services.preferencesStore = preferencesStore
    services.sessionStore = sessionStore
    services.store = store
    services.tileLayerStore = tileLayerStore
    services.spatialIndex = spatialIndex
    services.featureStore = featureStore
    services.documentStore = documentStore
    services.searchIndex = searchIndex
    services.coordinatesFormat = coordinatesFormat
    services.optionStore = optionStore
    services.undo = undo
    services.selection = selection
    services.osdDriver = osdDriver
    services.ipcRenderer = ipcRenderer
    services.clipboard = clipboard
    services.jsonDB = jsonDB
    services.wkbDB = wkbDB
    services.replicationProvider = { disabled: true }
    services.signals = {
      'replication/operational': Signal.of(false),
    }

    const schema = new Schema(db, {
      ids: 'KEY-ONLY',
      tags: 'SEPARATE',
      flags: 'SEPARATE',
      'default-tag': 'SEPARATE',
      styles: 'SEPARATE',
      ms2525c: 'LOADED',
      skkm: 'LOADED',
      'default-style': 'LOADED',
    })

    // Map rendering only needs the core stores and the scenario snapshot.
    // Let the caller publish those before the comparatively expensive symbol
    // catalog migration and search-index bootstrap complete.
    await onCoreReady?.(services)

    console.log('projectServices.js: Bootstrapping schema...')
    await schema.bootstrap()
    console.log('projectServices.js: Schema bootstrapped')

    console.log('projectServices.js: Bootstrapping tileLayerStore...')
    await tileLayerStore.bootstrap()
    console.log('projectServices.js: TileLayerStore bootstrapped')

    console.log('projectServices.js: Bootstrapping spatialIndex...')
    await spatialIndex.bootstrap()
    console.log('projectServices.js: SpatialIndex bootstrapped')

    console.log('projectServices.js: Bootstrapping searchIndex...')
    await searchIndex.bootstrap()
    console.log('projectServices.js: SearchIndex bootstrapped')

    const commandRegistry = new CommandRegistry(services)
    services.commandRegistry = commandRegistry
    bindings(commandRegistry, emitter)

    console.log('projectServices.js: All services initialized successfully', {
      serviceKeys: Object.keys(services),
      tileLayerStore: !!services.tileLayerStore,
      store: !!services.store,
      persistent,
    })

    return services
  } catch (error) {
    throw error
  }
}

export async function initializeProjectServices(projectUUID, options = {}) {
  try {
    // Publish a persistent core only after its complete bootstrap succeeds.
    // Otherwise a late timeout leaves the map wired to the abandoned emitter
    // while the sidebar receives the in-memory fallback emitter.
    const services = await Promise.race([
      initializeProjectServicesWithDb(projectUUID, {
        persistent: true,
        onCoreReady: undefined,
      }),
      timeoutAfter(
        PERSISTENT_BOOTSTRAP_TIMEOUT_MS,
        `Persistent tactical services bootstrap timed out after ${PERSISTENT_BOOTSTRAP_TIMEOUT_MS}ms`,
      ),
    ])
    await options.onCoreReady?.(services)
    return services
  } catch (error) {
    console.warn(
      'projectServices.js: Falling back to in-memory tactical services.',
      error,
    )
    return initializeProjectServicesWithDb(projectUUID, {
      persistent: false,
      onCoreReady: options.onCoreReady,
    })
  }
}
