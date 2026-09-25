import { Link } from 'react-router-dom';
import { getIngredients } from '../api.js';

const PREVIEW_INGREDIENTS = 4;
const PREVIEW_LENGTH = 120;

// Only shows what the API actually provides for the drink — no placeholder values.
export default function CocktailCard({ cocktail }) {
  const ingredients = getIngredients(cocktail);
  const extraIngredients = ingredients.length - PREVIEW_INGREDIENTS;
  const instructions = cocktail.strInstructions?.trim();
  const instructionsPreview =
    instructions && instructions.length > PREVIEW_LENGTH
      ? `${instructions.slice(0, PREVIEW_LENGTH).replace(/\s+\S*$/, '')}…`
      : instructions;

  return (
    <Link to={`/drink/${cocktail.idDrink}`} className="cocktail__card">
      <div className="cocktail__card-info">
        {cocktail.strDrinkThumb && (
          <img src={`${cocktail.strDrinkThumb}/medium`} alt={cocktail.strDrink} loading="lazy" />
        )}
        {cocktail.strAlcoholic && <span className="cocktail__badge">{cocktail.strAlcoholic}</span>}
        <h2 className="cocktail__title">{cocktail.strDrink}</h2>
        {cocktail.strCategory && <p className="cocktail__description">{cocktail.strCategory}</p>}
        {ingredients.length > 0 && (
          <p>
            <strong>Ingredients:</strong> {ingredients.slice(0, PREVIEW_INGREDIENTS).join(', ')}
            {extraIngredients > 0 && ` +${extraIngredients} more`}
          </p>
        )}
        {instructionsPreview && (
          <p><strong>How to make:</strong> {instructionsPreview}</p>
        )}
      </div>
    </Link>
  );
}
