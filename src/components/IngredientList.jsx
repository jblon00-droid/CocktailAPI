import { useEffect, useState } from 'react';
import { fetchIngredient, getIngredientImage } from '../api.js';

export default function IngredientList({ ingredients }) {
  // Extra details (type, ABV, description) keyed by lowercase ingredient name.
  const [details, setDetails] = useState({});

  useEffect(() => {
    let ignore = false;

    Promise.allSettled(ingredients.map(({ ingredient }) => fetchIngredient(ingredient))).then((results) => {
      if (ignore) return;
      const byName = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          byName[ingredients[index].ingredient.toLowerCase()] = result.value;
        }
      });
      setDetails(byName);
    });

    return () => {
      ignore = true;
    };
  }, [ingredients]);

  return (
    <ul className="ingredients">
      {ingredients.map(({ ingredient, measure }) => {
        const info = details[ingredient.toLowerCase()];

        return (
          <li key={ingredient} className="ingredient">
            <img
              className="ingredient__image"
              src={getIngredientImage(ingredient)}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.visibility = 'hidden';
              }}
            />
            <div className="ingredient__body">
              <div className="ingredient__header">
                <span className="ingredient__name">{ingredient}</span>
                {measure && <span className="ingredient__measure">{measure}</span>}
              </div>

              {info && (
                <div className="ingredient__tags">
                  {info.strType && <span className="chip chip--small">{info.strType}</span>}
                  {info.strAlcohol === 'Yes' && (
                    <span className="chip chip--small">{info.strABV ? `${info.strABV}% ABV` : 'Alcoholic'}</span>
                  )}
                  {info.strAlcohol === 'No' && <span className="chip chip--small">Non-alcoholic</span>}
                </div>
              )}

              {info?.strDescription && (
                <details className="ingredient__details">
                  <summary>About {info.strIngredient}</summary>
                  <p>{info.strDescription}</p>
                </details>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
