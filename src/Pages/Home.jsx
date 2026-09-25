import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CocktailCard from '../components/CocktailCard.jsx';
import Loading from '../components/Loading.jsx';
import { fetchCocktailById } from '../api.js';

// Margarita, Mojito, Old Fashioned
const FEATURED_IDS = ['11007', '11000', '11001'];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    Promise.all(FEATURED_IDS.map(fetchCocktailById))
      .then((drinks) => {
        if (!ignore) setFeatured(drinks.filter(Boolean));
      })
      .catch((error) => console.error('Failed to load featured cocktails:', error))
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">Shake up something new</h1>
          <p className="hero__subtitle">
            Browse hundreds of cocktails, find out what goes in them, and learn how to make them at home.
          </p>
          <Link to="/search" className="btn">Explore cocktails</Link>
        </div>
      </section>

      <section className="featured">
        <div className="cocktails__row">
          <h2 className="cocktails__title">Featured cocktails</h2>
          {isLoading && <Loading />}
          <div className="cocktails__card-grid">
            {featured.map((cocktail) => (
              <CocktailCard key={cocktail.idDrink} cocktail={cocktail} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
