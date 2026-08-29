import {loadFont} from '@remotion/fonts';
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

await Promise.all([
  loadFont({family: 'Yekan', url: staticFile('Yekan.woff2'), weight: '400'}),
  loadFont({family: 'Yekan', url: staticFile('Yekan-Bold.woff2'), weight: '700'}),
]);

export const SajedTeaser: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{backgroundColor: '#0c1825', color: '#f6f2e8', fontFamily: 'Yekan, Tahoma, sans-serif', overflow: 'hidden', direction: 'rtl'}}>
      <CanvasImage
        name="نمای واقعی نقشه"
        src={staticFile('map-ui.png')}
        width={1920}
        height={1080}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          opacity: interpolate(frame, [0, 12, 76, 108], [0, 0.82, 0.7, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)}),
          scale: interpolate(frame, [0, 108], [1.04, 1.14], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.33, 1, 0.68, 1), output: 'perceptual-scale'}),
          filter: 'saturate(0.72) contrast(1.08) brightness(0.72)',
        }}
      />

      <Interactive.Div name="گذار به زمین سه‌بعدی" style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: interpolate(frame, [62, 112], [0, 1080], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.76, 0, 0.24, 1)}), overflow: 'hidden', boxShadow: '0 -4px 70px rgba(214,148,35,0.26)'}}>
        <CanvasImage
          src={staticFile('terrain-concept.png')}
          width={1920}
          height={1080}
          style={{
            position: 'absolute', width: 1920, height: 1080, left: 0, bottom: 0,
            objectFit: 'cover', objectPosition: 'center 52%',
            scale: interpolate(frame, [62, 149], [1.12, 1.02], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1), output: 'perceptual-scale'}),
            filter: 'saturate(0.75) contrast(1.08) brightness(0.72)',
          }}
        />
      </Interactive.Div>

      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(7,15,24,0.2) 0%, rgba(7,15,24,0.18) 42%, rgba(7,15,24,0.9) 100%)'}} />

      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <path d="M 280 650 C 520 590, 650 710, 900 570 S 1290 390, 1510 470" fill="none" stroke="#d69423" strokeWidth="6" strokeLinecap="round" strokeDasharray="1600" strokeDashoffset={interpolate(frame, [18, 78], [1600, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)})} opacity={interpolate(frame, [10, 24, 82, 100], [0, 1, 1, 0.2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
        <path d="M 280 650 C 520 590, 650 710, 900 570 S 1290 390, 1510 470" fill="none" stroke="#f7d89a" strokeWidth="18" strokeLinecap="round" opacity={0.08} />
      </svg>

      <Interactive.Div name="نشانگر اول" style={{position: 'absolute', left: 263, top: 632, width: 38, height: 38, borderRadius: 999, border: '7px solid #f6f2e8', backgroundColor: '#667044', boxShadow: '0 0 0 7px rgba(102,112,68,0.42)', opacity: interpolate(frame, [12, 24, 86, 98], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), scale: interpolate(frame, [12, 27], [0.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1), output: 'perceptual-scale'})}} />
      <Interactive.Div name="نشانگر دوم" style={{position: 'absolute', left: 884, top: 553, width: 46, height: 46, borderRadius: 999, border: '7px solid #f6f2e8', backgroundColor: '#d69423', boxShadow: '0 0 0 9px rgba(214,148,35,0.32)', opacity: interpolate(frame, [42, 54, 90, 102], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), scale: interpolate(frame, [42, 57], [0.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1), output: 'perceptual-scale'})}} />
      <Interactive.Div name="نشانگر سوم" style={{position: 'absolute', left: 1492, top: 452, width: 38, height: 38, borderRadius: 999, border: '7px solid #f6f2e8', backgroundColor: '#667044', boxShadow: '0 0 0 7px rgba(102,112,68,0.42)', opacity: interpolate(frame, [65, 77, 92, 103], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), scale: interpolate(frame, [65, 80], [0.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1), output: 'perceptual-scale'})}} />

      <Interactive.Div name="نوار زمان" style={{position: 'absolute', left: 110, right: 110, bottom: 72, height: 3, backgroundColor: 'rgba(246,242,232,0.3)', opacity: interpolate(frame, [5, 18, 112, 132], [0, 1, 1, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
        <Interactive.Div name="پیشرفت زمان" style={{position: 'absolute', right: 0, top: -2, height: 7, width: interpolate(frame, [8, 102], [0, 1700], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.33, 1, 0.68, 1)}), backgroundColor: '#d69423'}} />
      </Interactive.Div>

      <Interactive.Div name="عنوان ساجد" style={{position: 'absolute', right: 110, top: 250, textAlign: 'right', opacity: interpolate(frame, [88, 106, 140, 149], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)}), translate: interpolate(frame, [88, 108], ['80px 0px', '0px 0px'], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)})}}>
        <div style={{fontSize: 128, lineHeight: 1, fontWeight: 700}}>ساجد</div>
        <div style={{width: 118, height: 8, marginTop: 28, marginBottom: 30, marginRight: 4, backgroundColor: '#d69423'}} />
        <div style={{fontSize: 52, lineHeight: 1.55, fontWeight: 400}}>عملیات، یک نقشه ثابت نیست.</div>
      </Interactive.Div>

      <Interactive.Div name="برچسب نمونه" style={{position: 'absolute', left: 110, top: 82, padding: '12px 22px', border: '1px solid rgba(246,242,232,0.34)', color: 'rgba(246,242,232,0.76)', fontSize: 26, opacity: interpolate(frame, [0, 15, 125, 145], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
        نمونه زبان بصری
      </Interactive.Div>
    </AbsoluteFill>
  );
};
