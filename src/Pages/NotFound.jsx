import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="drink">
      <div className="drink__container">
        <h1>Page not found</h1>
        <p className="drink__message">
          <Link to="/">Head back home</Link>
        </p>
      </div>
    </section>
  );
}
