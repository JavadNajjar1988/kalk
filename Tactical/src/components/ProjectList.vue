<template>
  <div class="project-list-container">
    <div class="header">
      <h1>ODIN - Vue Version</h1>
      <button @click="createProject" class="btn-create">
        ایجاد پروژه جدید
      </button>
    </div>
    
    <div v-if="loading" class="loading">
      در حال بارگذاری...
    </div>
    
    <div v-else-if="projects.length === 0" class="empty">
      <p>هیچ پروژه‌ای وجود ندارد</p>
      <p>برای شروع یک پروژه جدید ایجاد کنید</p>
    </div>
    
    <div v-else class="projects-grid">
      <div 
        v-for="project in projects" 
        :key="project.id"
        class="project-card"
        @click="openProject(project.id)"
      >
        <h3>{{ project.name }}</h3>
        <p class="last-access">
          آخرین دسترسی: {{ formatDate(project.lastAccess) }}
        </p>
        <div class="actions">
          <button @click.stop="deleteProject(project.id)" class="btn-delete">
            حذف
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServices } from '../composables/useServices.js'
import { DateTime } from 'luxon'
import uuid from '../shared/uuid.js'

const router = useRouter()
const services = useServices()
const projects = ref([])
const loading = ref(true)

const loadProjects = async () => {
  loading.value = true
  try {
    if (services.projectStore) {
      const list = await services.projectStore.getProjects()
      projects.value = list
    }
  } catch (error) {
    console.error('Failed to load projects:', error)
  } finally {
    loading.value = false
  }
}

const createProject = async () => {
  const name = prompt('نام پروژه:')
  if (!name) return
  
  try {
    const projectUUID = uuid()
    await services.projectStore.createProject(projectUUID, name, [])
    await loadProjects()
  } catch (error) {
    console.error('Failed to create project:', error)
    alert('خطا در ایجاد پروژه')
  }
}

const openProject = (id) => {
  router.push(`/project/${id.replace('project:', '')}`)
}

const deleteProject = async (id) => {
  if (!confirm('آیا مطمئن هستید؟')) return
  
  try {
    await services.projectStore.deleteProject(id)
    await loadProjects()
  } catch (error) {
    console.error('Failed to delete project:', error)
    alert('خطا در حذف پروژه')
  }
}

const formatDate = (isoDate) => {
  return DateTime.fromISO(isoDate).toLocaleString(DateTime.DATETIME_SHORT)
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.project-list-container {
  width: 100vw;
  height: 100vh;
  padding: 2rem;
  background: #f5f5f5;
  overflow-y: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 2rem;
  color: #333;
}

.btn-create {
  padding: 0.75rem 1.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-create:hover {
  background: #45a049;
}

.loading, .empty {
  text-align: center;
  padding: 4rem;
  color: #666;
  font-size: 1.2rem;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.project-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.project-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.last-access {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.btn-delete {
  padding: 0.5rem 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-delete:hover {
  background: #da190b;
}
</style>

