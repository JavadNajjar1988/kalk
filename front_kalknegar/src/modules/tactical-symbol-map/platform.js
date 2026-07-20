const isDarwin = () => {
  // Electron renderer (with Node integration) / Node:
  if (typeof process !== 'undefined' && process && process.platform) {
    return process.platform === 'darwin'
  }

  // Browser:
  if (typeof navigator !== 'undefined') {
    const platform = navigator.platform || ''
    const ua = navigator.userAgent || ''
    return /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS/i.test(ua)
  }

  return false
}

export const cmdOrCtrl = ({ metaKey, ctrlKey }) => {
  return isDarwin() ? metaKey : ctrlKey
}

export const cmdOrCtrlKey = () => (isDarwin() ? 'command' : 'ctrl')
export { isDarwin }
