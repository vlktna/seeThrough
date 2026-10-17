import { Footer, Icon, Navigation } from './ui';
export default function NotFound() {
  return <div className="shell"><Navigation /><main id="main-content" className="not-found" tabIndex={-1}><p className="eyebrow">404 · Outside the map</p><h1>Let’s find your way back.</h1><p>This page is not on our floor plan. Your next session starts at the live map.</p><a className="text-link" href="/"><Icon name="arrow-left" />Back to the live map</a></main><Footer /></div>;
}
