/**
 * Initialize all services needed for a project
 * This is the web version adapted from Project-services.web.js
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

export async function initializeProjectServices(projectUUID) {
  console.log('🔄 projectServices.js: Initializing services for project:', projectUUID)
  const services = {}
  
  // Event emitter for communication
  const emitter = new Emitter()
  console.log('✅ projectServices.js: Emitter created')
  
  // Mock undo/selection/osdDriver/ipcRenderer for web MVP
  const undo = new MockUndo() // Now inherits from Emitter
  const selection = new MockSelection()
  const osdDriver = new MockOSDDriver()
  const ipcRenderer = new MockIpcRenderer()
  
  // Persistent DB per project in browser (IndexedDB)
  try {
    const down = leveljs(`ODINv2:${projectUUID}`)
    const db = L.leveldb({ down })
    
    const jsonDB = L.jsonDB(db)
    const wkbDB = L.wkbDB(db)
    const preferencesDB = L.preferencesDB(db)
    const sessionDB = L.sessionDB(db)
    
    // Initialize stores
    const projectStore = new ProjectStore()
    const preferencesStore = new PreferencesStore()
    const sessionStore = new SessionStore()
    
    // Initialize main store with mock undo/selection
    const store = new Store(jsonDB, wkbDB, undo, selection)
    
    // Initialize additional stores
    const tileLayerStore = new TileLayerStore(store)
    const spatialIndex = new SpatialIndex(wkbDB)
    const featureStore = new FeatureStore(store)
    
    // Initialize Clipboard
    const clipboard = new Clipboard(selection, store)
    
    // Initialize SearchIndex dependencies
    const documentStore = new DocumentStore(store)
    const coordinatesFormat = new CoordinatesFormat(emitter, preferencesStore)
    const optionStore = new OptionStore(coordinatesFormat, store, sessionStore)
    const nominatim = new Nominatim(store)
    const searchIndex = new SearchIndex(jsonDB, documentStore, optionStore, emitter, nominatim, sessionStore, spatialIndex)
    
    // Assign services
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
    
    // Initialize Schema
    const schema = new Schema(db, {
      ids: 'KEY-ONLY',
      tags: 'SEPARATE',
      flags: 'SEPARATE',
      'default-tag': 'SEPARATE',
      styles: 'SEPARATE',
      ms2525c: 'LOADED',
      skkm: 'LOADED',
      'default-style': 'LOADED'
    })
    
    // Orderly bootstrapping
    console.log('🔧 projectServices.js: Bootstrapping schema...')
    await schema.bootstrap()
    console.log('✅ projectServices.js: Schema bootstrapped')
    
    console.log('🔧 projectServices.js: Bootstrapping tileLayerStore...')
    await tileLayerStore.bootstrap()
    console.log('✅ projectServices.js: TileLayerStore bootstrapped')
    
    console.log('🔧 projectServices.js: Bootstrapping spatialIndex...')
    await spatialIndex.bootstrap()
    console.log('✅ projectServices.js: SpatialIndex bootstrapped')
    
    console.log('🔧 projectServices.js: Bootstrapping searchIndex...')
    await searchIndex.bootstrap()
    console.log('✅ projectServices.js: SearchIndex bootstrapped')
    
    // Initialize replication provider (disabled for web MVP)
    services.replicationProvider = { disabled: true }
    
    // Initialize signals
    services.signals = {}
    services.signals['replication/operational'] = Signal.of(false)
    
    // Initialize command registry
    const commandRegistry = new CommandRegistry(services)
    services.commandRegistry = commandRegistry
    bindings(commandRegistry, emitter)
    
    console.log('✅ projectServices.js: All services initialized successfully', {
      serviceKeys: Object.keys(services),
      tileLayerStore: !!services.tileLayerStore,
      store: !!services.store
    })
    
    return services
  } catch (error) {
    console.error('Failed to initialize project services:', error)
    throw error
  }
}

