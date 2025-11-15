
/**
 * @typedef {Object} FileMenuOptions
 * @property {SessionStore} sessionStore
 * @property {Emitter} emitter
 * @property {String} [platform]
 */

/**
 * @function
 * @name FileMenu
 * @param {FileMenuOptions} options
 */
export default async options => {
  const { sessionStore, emitter } = options
  const platform = options.platform || process.platform
  const recent = await sessionStore.getRecent()

  const submenu = recent.map(({ key, name }) => ({
    id: key,
    label: name,
    click: (menuItem, focusedWindow, focusedWebContents) => {
      emitter.emit(`project/open/${key}`)
    }
  }))

  return {
    label: 'فایل',
    submenu: [
      {
        label: 'مدیریت پروژه\u200cها',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: (/* menuItem, browserWindow, event */) => {
          emitter.emit('project/create')
        }
      },
      { type: 'separator' },
      {
        label: 'باز کردن اخیر',
        submenu
      },
      platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
    ]
  }
}
