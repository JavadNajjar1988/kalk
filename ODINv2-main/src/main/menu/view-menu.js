import { dispatch, send } from './helpers'

export default options => {
  const preferences = options.preferences || {}
  const coordinatesFormat = preferences['coordinates-format'] || 'MGRS'
  const graticule = preferences.graticule
  const sidebarShowing = preferences['ui.sidebar.showing'] ?? true
  const toolbarShowing = preferences['ui.toolbar.showing'] ?? true

  return [{
    label: 'نمایش',
    submenu: [
      { type: 'separator' },
      {
        label: 'فرمت مختصات',
        submenu: [
          {
            label: 'MGRS',
            type: 'checkbox',
            checked: coordinatesFormat === 'MGRS',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'MGRS'))
          },
          {
            label: 'UTM',
            type: 'checkbox',
            checked: coordinatesFormat === 'UTM',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'UTM'))
          },
          {
            label: 'عرض و طول جغرافیایی',
            type: 'checkbox',
            checked: coordinatesFormat === 'LATLON',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'LATLON'))
          },
          {
            label: 'درجه، دقیقه و ثانیه (DMS)',
            type: 'checkbox',
            checked: coordinatesFormat === 'DMS',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'DMS'))
          },
          {
            label: 'درجه و دقیقه اعشاری (DDM)',
            type: 'checkbox',
            checked: coordinatesFormat === 'DDM',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'DDM'))
          },
          {
            label: 'درجه اعشاری (DD)',
            type: 'checkbox',
            checked: coordinatesFormat === 'DD',
            click: dispatch(browserWindow => send(browserWindow, 'VIEW_COORDINATES_FORMAT', 'DD'))
          }
        ]
      },
      {
        label: 'شبکه مختصات',
        submenu: [
          {
            label: 'MGRS (پیاده\u200cسازی نشده)',
            type: 'checkbox',
            checked: graticule === 'MGRS',
            click: ({ checked }, browserWindow) => {
              if (browserWindow) browserWindow.webContents.send('VIEW_GRATICULE', 'MGRS', checked)
            }
          },
          {
            label: 'WGS84',
            type: 'checkbox',
            checked: graticule === 'WGS84',
            click: ({ checked }, browserWindow) => {
              if (browserWindow) browserWindow.webContents.send('VIEW_GRATICULE', 'WGS84', checked)
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'ظاهر',
        submenu: [
          {
            label: 'نمایش نوار کناری',
            accelerator: 'CmdOrCtrl+B',
            type: 'checkbox',
            checked: sidebarShowing,
            click: ({ checked }, browserWindow) => {
              if (browserWindow) browserWindow.webContents.send('VIEW_SHOW_SIDEBAR', checked)
            }
          },
          {
            label: 'نمایش نوار ابزار',
            accelerator: 'CmdOrCtrl+T',
            type: 'checkbox',
            checked: toolbarShowing,
            click: ({ checked }, browserWindow) => {
              if (browserWindow) browserWindow.webContents.send('VIEW_SHOW_TOOLBAR', checked)
            }
          }
        ]
      },
      { type: 'separator' },
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  }]
}
