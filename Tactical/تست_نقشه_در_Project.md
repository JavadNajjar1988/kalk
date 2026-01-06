# 🔍 تست نقشه در Project.vue

## 📋 تست‌های Console:

### **1. بررسی Elements:**
```javascript
const mapEl = document.getElementById('map');
const mapContainer = document.getElementById('map-container');
const siteContainer = document.querySelector('.site-container');
const content = document.querySelector('.content');

console.log('=== ELEMENTS ===');
console.log('map:', mapEl, mapEl?.offsetWidth, 'x', mapEl?.offsetHeight);
console.log('map-container:', mapContainer, mapContainer?.offsetWidth, 'x', mapContainer?.offsetHeight);
console.log('site-container:', siteContainer, siteContainer?.offsetWidth, 'x', siteContainer?.offsetHeight);
console.log('content:', content, content?.offsetWidth, 'x', content?.offsetHeight);
```

### **2. بررسی Canvas:**
```javascript
const mapEl = document.getElementById('map');
const canvas = mapEl?.querySelector('canvas');
console.log('Canvas:', canvas);
console.log('Canvas size:', canvas?.width, 'x', canvas?.height);
```

### **3. بررسی Styles:**
```javascript
const mapEl = document.getElementById('map');
if (mapEl) {
  const styles = window.getComputedStyle(mapEl);
  console.log('=== MAP STYLES ===');
  console.log('position:', styles.position);
  console.log('display:', styles.display);
  console.log('visibility:', styles.visibility);
  console.log('width:', styles.width);
  console.log('height:', styles.height);
  console.log('z-index:', styles.zIndex);
}
```

### **4. بررسی Container Styles:**
```javascript
const mapContainer = document.getElementById('map-container');
if (mapContainer) {
  const styles = window.getComputedStyle(mapContainer);
  console.log('=== CONTAINER STYLES ===');
  console.log('position:', styles.position);
  console.log('width:', styles.width);
  console.log('height:', styles.height);
}
```

---

## 🎯 **لطفاً نتایج را بفرستید!**

