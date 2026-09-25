import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRelatedDrinks } from '../api.js';

export default function RelatedDrinks({ title, type, value, excludeId }) {
  const [drinks, setDrinks] = useState([]);

  useEffect(() => {
    let ignore = false;

    fetchRelatedDrinks(type, value, excludeId)
      .then((data) => {
        if (!ignore) setDrinks(data);
      })
      .catch((error) => console.error(`Failed to load related drinks (${type}):`, error));

    return () => {
      ignore = true;
    };
  }, [type, value, excludeId]);

  if (drinks.length === 0) return null;

  return (
    <section className="related">
      <h2 className="drink__heading">{title}</h2>
      <div className="related__grid">
        {drinks.map((drink) => (
          <Link key={drink.idDrink} to={`/drink/${drink.idDrink}`} className="related__card">
            <img src={`${drink.strDrinkThumb}/small`} alt="" loading="lazy" />
            <span>{drink.strDrink}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
