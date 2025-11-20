import * as R from 'ramda'
import * as TS from '../ts'

<<<<<<< Updated upstream
export default (mode, geometry) => {
  const selection = []
=======
export default (mode: string | null, geometry: any): any[] => {
  const selection: any[] = []
>>>>>>> Stashed changes
  const guideline = mode === 'singleselect'
    ? { id: 'style:guide-stroke', geometry }
    : null

  const points = () => TS.points(geometry)

  const handles = R.cond([
    [R.equals('default'), R.always(null)],
    [R.equals('singleselect'), R.always({ id: 'style:circle-handle', geometry: TS.multiPoint(points()) })],
    [R.equals('multiselect'), R.always({ id: 'style:rectangle-handle', geometry: points()[0] })]
  ])(mode)

<<<<<<< Updated upstream
  guideline && selection.push(guideline)
  handles && selection.push(handles)

  return selection
}
=======
  if (guideline) selection.push(guideline)
  if (handles) selection.push(handles)

  return selection
}

>>>>>>> Stashed changes
