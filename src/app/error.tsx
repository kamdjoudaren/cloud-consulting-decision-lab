'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="card empty-state">
      <h1>Something interrupted this page.</h1>
      <p>Your saved work remains in the local database. Try loading the page again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
