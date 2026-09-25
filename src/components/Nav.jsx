import { Link, NavLink } from 'react-router-dom';

export default function Nav() {
  return (
    <nav>
      <div className="nav__container">
        <div className="nav__row">
          <Link to="/">
            <img className="logo" src="https://www.thecocktaildb.com/images/logo.png" alt="CocktailDB logo" />
          </Link>
          <ul className="nav__links">
            <li className="nav__link"><NavLink to="/" end>Home</NavLink></li>
            <li className="nav__link"><NavLink to="/search">Search</NavLink></li>          </ul>
        </div>
      </div>
    </nav>
  );
}
