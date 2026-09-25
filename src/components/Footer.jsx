export default function Footer() {
  return (
    <footer>
      <div className="footer__container">
        <div className="row">
          <p>&copy; {new Date().getFullYear()} Cocktail Explorer. All rights reserved.</p>
          <p className="footer__credit">
            Drink data and images from{' '}
            <a href="https://www.thecocktaildb.com" target="_blank" rel="noreferrer">TheCocktailDB</a>.
          </p>
        </div>
      </div>
    </footer>
  );
}
