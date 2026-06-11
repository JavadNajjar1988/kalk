const EraseFade = function (services) {
  this.emitter = services.emitter
  this.label = 'قلم‌مو محو'
  this.path = 'mdiEraser'
}

EraseFade.prototype.execute = function () {
  this.emitter.emit('ERASE_FADE_START')
}

EraseFade.prototype.enabled = function () {
  return true
}

const EraseCut = function (services) {
  this.emitter = services.emitter
  this.label = 'قلم‌مو حذف'
  this.path = 'mdiContentCut'
}

EraseCut.prototype.execute = function () {
  this.emitter.emit('ERASE_CUT_START')
}

EraseCut.prototype.enabled = function () {
  return true
}

const EraseCancel = function (services) {
  this.emitter = services.emitter
  this.label = 'لغو قلم‌مو'
  this.path = 'mdiClose'
}

EraseCancel.prototype.execute = function () {
  this.emitter.emit('command/erase/cancel')
}

EraseCancel.prototype.enabled = function () {
  return true
}

export default services => ({
  ERASE_FADE: new EraseFade(services),
  ERASE_CUT: new EraseCut(services),
  ERASE_CANCEL: new EraseCancel(services)
})
