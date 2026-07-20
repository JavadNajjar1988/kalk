const MeasureDistance = function (services) {
  this.emitter = services.emitter
  this.label = 'اندازهگیری فاصله'
  this.path = 'mdiMapMarkerDistance'
}

MeasureDistance.prototype.execute = function () {
  this.emitter.emit('MEASURE_DISTANCE')
}

const MeasureArea = function (services) {
  this.emitter = services.emitter
  this.label = 'اندازهگیری مساحت'
  this.path = 'mdiVectorPolygon'
}

MeasureArea.prototype.execute = function () {
  this.emitter.emit('MEASURE_AREA')
}

export default services => ({
  MEASURE_DISTANCE: new MeasureDistance(services),
  MEASURE_AREA: new MeasureArea(services)
})
