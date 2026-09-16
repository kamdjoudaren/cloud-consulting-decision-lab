import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="card empty-state">
      <div className="eyebrow">404 / NOT FOUND</div>
      <h1>This case isn’t here.</h1>
      <p>Return to your workspace to find a saved case or start a new one.</p>
      <Link href="/" className="button primary">
        Back to overview
      </Link>
    </div>
  );
}
