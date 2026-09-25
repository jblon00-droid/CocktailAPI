import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Loading from '../components/Loading.jsx';
import IngredientList from '../components/IngredientList.jsx';
import RelatedDrinks from '../components/RelatedDrinks.jsx';
import {
  fetchCocktailById,
  getIngredientsWithMeasures,
  getInstructionLanguages,
  getInstructionSteps,
  getTags,
  getVideoEmbedUrl
} from '../api.js';

// Keyed by id so moving to another drink (e.g. from "More in…") starts with fresh state.
export default function Drink() {
  const { id } = useParams();
  return <DrinkPage key={id} id={id} />;
}

function DrinkPage({ id }) {
  const navigate = useNavigate();
  const [drink, setDrink] = useState(null);
  const [status, setStatus] = useState('loading');
  const [language, setLanguage] = useState('strInstructions');

  useEffect(() => {
    let ignore = false;

    fetchCocktailById(id)
      .then((data) => {
        if (ignore) return;
        setDrink(data);
        setStatus(data ? 'ready' : 'not-found');
      })
      .catch((error) => {
        console.error('Failed to load cocktail:', error);
        if (!ignore) setStatus('error');
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const ingredients = useMemo(() => (drink ? getIngredientsWithMeasures(drink) : []), [drink]);

  // Go back to wherever the user came from (keeps their search), or to search on a direct visit.
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/search'));

  return (
    <section className="drink">
      <div className="drink__container">
        <button type="button" className="drink__back" onClick={goBack}>
          &larr; Back to cocktails
        </button>

        {status === 'loading' && <Loading />}

        {status === 'not-found' && (
          <p className="drink__message">
            We couldn&apos;t find that cocktail. <Link to="/search">Search for another one.</Link>
          </p>
        )}

        {status === 'error' && (
          <p className="drink__message">Something went wrong loading this cocktail. Please try again.</p>
        )}

        {status === 'ready' && (
          <DrinkDetails drink={drink} ingredients={ingredients} language={language} onLanguageChange={setLanguage} />
        )}
      </div>
    </section>
  );
}

function DrinkDetails({ drink, ingredients, language, onLanguageChange }) {
  const tags = getTags(drink);
  const languages = getInstructionLanguages(drink);
  const steps = getInstructionSteps(drink[language] || drink.strInstructions);
  const alternateName = drink.strDrinkAlternate;
  const videoUrl = getVideoEmbedUrl(drink.strVideo);

  const facts = [
    { label: 'Category', value: drink.strCategory },
    { label: 'Type', value: drink.strAlcoholic },
    { label: 'Glass', value: drink.strGlass },
    { label: 'IBA classification', value: drink.strIBA },
    { label: 'Ingredients', value: ingredients.length || null }
  ].filter(({ value }) => value);

  return (
    <>
      <article className="drink__sheet">
        <div className="drink__layout">
          <figure className="drink__figure">
            <img className="drink__image" src={drink.strDrinkThumb} alt={drink.strDrink} />
            {drink.strImageAttribution && (
              <figcaption className="drink__credit">
                Photo:{' '}
                {drink.strImageSource ? (
                  <a href={drink.strImageSource} target="_blank" rel="noreferrer">
                    {drink.strImageAttribution}
                  </a>
                ) : (
                  drink.strImageAttribution
                )}
                {drink.strCreativeCommonsConfirmed === 'Yes' && ' (Creative Commons)'}
              </figcaption>
            )}
          </figure>

          <div className="drink__details">
            <span className="cocktail__badge drink__badge">{drink.strAlcoholic || 'Cocktail'}</span>
            <h1 className="drink__title">{drink.strDrink}</h1>
            {alternateName && <p className="drink__alternate">Also known as {alternateName}</p>}

            {tags.length > 0 && (
              <ul className="drink__tags">
                {tags.map((tag) => (
                  <li key={tag} className="chip">#{tag}</li>
                ))}
              </ul>
            )}

            <dl className="drink__facts">
              {facts.map(({ label, value }) => (
                <div key={label} className="drink__fact">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

          </div>
        </div>

        <div className="drink__sections">
          <section className="drink__section">
            <h2 className="drink__heading">Ingredients</h2>
            <IngredientList ingredients={ingredients} />
          </section>

          <section className="drink__section">
            <div className="drink__heading-row">
              <h2 className="drink__heading">How to make</h2>
              {languages.length > 1 && (
                <select
                  className="filter__select drink__language"
                  aria-label="Instructions language"
                  value={language}
                  onChange={(event) => onLanguageChange(event.target.value)}
                >
                  {languages.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              )}
            </div>
            {steps.length > 0 ? (
              <ol className="drink__steps">
                {steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            ) : (
              <p>No instructions available.</p>
            )}
          </section>
        </div>

        {videoUrl && (
          <section className="drink__video">
            <h2 className="drink__heading">Watch how to make it</h2>
            <div className="drink__video-frame">
              <iframe
                src={videoUrl}
                title={`How to make ${drink.strDrink}`}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {drink.dateModified && (
          <p className="drink__updated">
            Last updated {new Date(drink.dateModified.replace(' ', 'T')).toLocaleDateString()}
          </p>
        )}
      </article>

      {drink.strCategory && (
        <RelatedDrinks
          title={`More in ${drink.strCategory}`}
          type="category"
          value={drink.strCategory}
          excludeId={drink.idDrink}
        />
      )}
      {drink.strGlass && (
        <RelatedDrinks
          title={`Also served in: ${drink.strGlass}`}
          type="glass"
          value={drink.strGlass}
          excludeId={drink.idDrink}
        />
      )}
    </>
  );
}
