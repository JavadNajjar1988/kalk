export default options => {
  const platform = options.platform || process.platform

  return {
    label: 'پنجره',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(platform === 'darwin'
        ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ]
        : [{ role: 'close' }]
      )
    ]
  }
}
