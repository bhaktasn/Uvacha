import { ImageResponse } from 'next/og';
export const alt = 'Uvacha — Your AI film deserves an audience. Daily video competitions. Cash prizes.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '62px 72px', background: '#101410', color: '#f5f2e8', fontFamily: 'sans-serif', border: '2px solid #526047' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 32, letterSpacing: 7, color: '#f5d67b' }}>UVACHA</span><span style={{ fontSize: 19, color: '#b8c0ac' }}>THE DAILY AI VIDEO COMPETITION</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', fontSize: 78, lineHeight: 1.05, fontWeight: 700, letterSpacing: -4 }}><span>Your AI film deserves</span><span style={{ color: '#f5d67b' }}>an audience.</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #414a36', paddingTop: 28 }}><span style={{ fontSize: 25 }}>Share your film. Compete for cash prizes.</span><span style={{ display: 'flex', padding: '14px 24px', background: '#f5d67b', color: '#11160e', borderRadius: 8, fontSize: 22 }}>uvacha.ai ↗</span></div>
    </div>, size
  );
}
