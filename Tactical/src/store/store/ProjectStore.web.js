import { DateTime } from 'luxon'
import * as R from 'ramda'

const STORAGE_PROJECTS = 'odin:web:projects:v1'
const STORAGE_CREDENTIALS = id => `odin:web:credentials:${id}`
const STORAGE_STREAM_TOKEN = id => `odin:web:streamToken:${id}`
const STORAGE_SEED = id => `odin:web:seed:${id}`

const normalizeProject = project => ({
  id: project.id,
  name: project.name || 'New Project',
  lastAccess: project.lastAccess || DateTime.local().toISO(),
  tags: Array.isArray(project.tags) ? project.tags : []
})

const loadProjects = () => {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(normalizeProject) : []
  } catch {
    return []
  }
}

const saveProjects = projects => {
  localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(projects))
}

const split = s =>
  s.replace(/[()-]/gi, ' ')
    .split(' ')
    .filter(R.identity)
    .map(name => name.toLowerCase())

const tokenizeName = project => split(project.name)
const isTag = s => s[0] === '#'
const tags = project => (project.tags ? project.tags.map(tag => tag.toLowerCase()) : [])

const filterProjects = tokens =>
  tokens.length
    ? projects =>
      projects.filter(project =>
        tokens.every(({ tag, token }) => {
          const xs = tag ? tags(project) : tokenizeName(project)
          return xs.some(x => x.startsWith(token))
        })
      )
    : R.identity

const makeId = uuid => (uuid.startsWith('project:') ? uuid : `project:${uuid}`)

export default class ProjectStoreWeb {
  constructor () {
    this._handlers = new Map()
  }

  on (event, handler) {
    const set = this._handlers.get(event) || new Set()
    set.add(handler)
    this._handlers.set(event, set)
  }

  off (event, handler) {
    const set = this._handlers.get(event)
    if (!set) return
    set.delete(handler)
  }

  _emit (event, payload) {
    const set = this._handlers.get(event)
    if (!set) return
    set.forEach(fn => fn(payload))
  }

  async getProject (id) {
    return loadProjects().find(p => p.id === id) || null
  }

  async getProjects (filter) {
    const tokens = (filter || '').split(' ')
      .filter(R.identity)
      .map(token => token.toLowerCase())
      .map(token => ({ tag: isTag(token), token: isTag(token) ? token.substring(1) : token }))
      .filter(({ token }) => token.length)

    const projects = loadProjects()
    projects.sort((a, b) => {
      const nameA = a.name || ''
      const nameB = b.name || ''
      const lastAccessA = a.lastAccess || ''
      const lastAccessB = b.lastAccess || ''
      return nameA.localeCompare(nameB) || lastAccessA.localeCompare(lastAccessB)
    })

    return filterProjects(tokens)(projects)
  }

  async createProject (projectUUID = (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now())), projectName = 'New Project', projectTags = []) {
    const id = makeId(projectUUID)
    const project = normalizeProject({ id, name: projectName, lastAccess: DateTime.local().toISO(), tags: projectTags })
    const projects = loadProjects()
    projects.push(project)
    saveProjects(projects)
    this._emit('created', { project })
    this._emit('tagged', { id: projectUUID })
    return project
  }

  async updateProject (project) {
    const projects = loadProjects()
    const idx = projects.findIndex(p => p.id === project.id)
    const updated = normalizeProject({ ...projects[idx], ...project, lastAccess: DateTime.local().toISO() })
    if (idx >= 0) projects[idx] = updated
    else projects.push(updated)
    saveProjects(projects)
    this._emit('updated', { project: updated })
    return updated
  }

  async deleteProject (id) {
    const projects = loadProjects().filter(p => p.id !== id)
    saveProjects(projects)
    this._emit('deleted', { id })
  }

  getPreview () { return Promise.resolve(null) }

  async addTag (id, tag) {
    const project = await this.getProject(id)
    if (!project) return
    const tags = new Set(project.tags || [])
    tags.add(tag)
    await this.updateProject({ ...project, tags: [...tags] })
    this._emit('tagged', { id })
  }

  async removeTag (id, tag) {
    const project = await this.getProject(id)
    if (!project) return
    await this.updateProject({ ...project, tags: (project.tags || []).filter(t => t !== tag) })
    this._emit('tagged', { id })
  }

  async getCredentials (id) {
    try {
      const raw = localStorage.getItem(STORAGE_CREDENTIALS(id))
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  async putCredentials (id, credentials) {
    localStorage.setItem(STORAGE_CREDENTIALS(id), JSON.stringify(credentials))
    return true
  }

  async delCredentials (id) {
    localStorage.removeItem(STORAGE_CREDENTIALS(id))
    return true
  }

  async getStreamToken (id) {
    return localStorage.getItem(STORAGE_STREAM_TOKEN(id))
  }

  async putStreamToken (id, streamToken) {
    if (streamToken == null) localStorage.removeItem(STORAGE_STREAM_TOKEN(id))
    else localStorage.setItem(STORAGE_STREAM_TOKEN(id), streamToken)
    return true
  }

  async putReplicationSeed (id, seed) {
    localStorage.setItem(STORAGE_SEED(id), JSON.stringify(seed))
    return true
  }

  async getReplicationSeed (id) {
    try {
      const raw = localStorage.getItem(STORAGE_SEED(id))
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  async purgeCollaborationSettings () {
    await this.putCredentials('default', null)
    // remove SHARED tag from all projects
    const projects = loadProjects().map(p => ({ ...p, tags: (p.tags || []).filter(t => t !== 'SHARED') }))
    saveProjects(projects)
  }
}


