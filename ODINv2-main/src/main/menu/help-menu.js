import { shell } from 'electron'

export default options => {
  return {
    label: 'راهنما',
    submenu: [
      {
        label: 'پیوستن به انجمن ODINv2 از طریق [Matrix]',
        click: () => shell.openExternal('https://matrix.to/#/#ODIN.Community:syncpoint.io', { activate: true })
      }
    ]
  }
}
