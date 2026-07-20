import ms, { type Symbol as MilSymbol, type SymbolOptions } from 'milsymbol';

const customColorMode = ms.getColorMode('Light');
customColorMode.Friend = 'rgb(170, 176, 116)';

const customIconColor = { ...ms.getColorMode('FrameColor') };
customIconColor.Friend = 'rgb(65, 70, 22)';

const hostileLikeColorMode = ms.getColorMode('Light');
hostileLikeColorMode.Friend = hostileLikeColorMode.Hostile;

function replaceAt(text: string, index: number, replacement: string) {
  return text.substring(0, index) + replacement + text.substring(index + 1);
}

export function symbolGenerator(sidc: string, options: SymbolOptions = {}): MilSymbol {
  let resolvedSidc = sidc;
  let resolvedOptions = options;

  if (resolvedSidc[3] === '7') {
    resolvedSidc = replaceAt(resolvedSidc, 3, '3');
    resolvedOptions = {
      colorMode: { ...customColorMode },
      frameColor: { ...customIconColor },
      iconColor: { ...customIconColor },
      ...options,
    };
  } else if (resolvedSidc[3] === '8') {
    resolvedSidc = replaceAt(resolvedSidc, 3, '3');
    resolvedOptions = { colorMode: hostileLikeColorMode, ...options };
  }

  return new ms.Symbol(resolvedSidc, resolvedOptions);
}
