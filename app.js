async function loadCocktails() {
  try {
    const [searchData, lookupData, lookupDataTwo, filterData] = await Promise.all([
      fetch('https://www.thecocktaildb.com/api/json/v1/1/search.php?s=margarita').then((res) => res.json()),
      fetch('https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=11007').then((res) => res.json()),
      fetch('https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=552').then((res) => res.json()),
      fetch('https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=Ordinary_Drink').then((res) => res.json())
    ]);

    const container = document.querySelector('.cocktails__card-grid');
    const select = document.querySelector('#sortSelect');
    if (!container || !select) return;

    const cocktails = [
      ...(searchData.drinks || []),
      ...(lookupData.drinks || []),
      ...(lookupDataTwo.drinks || []),
      ...(filterData.drinks || [])
    ];

    const uniqueCocktails = cocktails.filter(
      (cocktail, index, array) => array.findIndex((item) => item.idDrink === cocktail.idDrink) === index
    );

    const getIngredientCount = (cocktail) =>
      Array.from({ length: 10 }, (_, index) => cocktail[`strIngredient${index + 1}`])
        .filter(Boolean).length;

    const renderCocktails = (sortType) => {
      const sortedCocktails = [...uniqueCocktails].sort((a, b) => {
        if (sortType === 'ingredients') {
          return getIngredientCount(b) - getIngredientCount(a);
        }
        return (a.strDrink || '').localeCompare(b.strDrink || '');
      });

      container.innerHTML = '';

      sortedCocktails.slice(0, 12).forEach((cocktail) => {
        const imageUrl = cocktail.strDrinkThumb
          ? `${cocktail.strDrinkThumb}/medium`
          : 'https://www.thecocktaildb.com/images/media/drink/vrwquq1478252802.jpg/medium';

        const ingredients = Array.from({ length: 4 }, (_, index) => cocktail[`strIngredient${index + 1}`])
          .filter(Boolean)
          .join(', ');

        const instructions = cocktail.strInstructions ? cocktail.strInstructions.slice(0, 120) : 'No instructions available.';

        const card = document.createElement('div');
        card.className = 'cocktail__card';
        card.innerHTML = `
          <div class="cocktail__card-info">
            <img src="${imageUrl}" alt="${cocktail.strDrink}">
            <span class="cocktail__badge">${cocktail.strAlcoholic || 'Cocktail'}</span>
            <h2 class="cocktail__title">${cocktail.strDrink}</h2>
            <p class="cocktail__description">${cocktail.strCategory || 'Classic cocktail'}</p>
            <p><strong>Ingredients:</strong> ${ingredients || 'Not listed'}</p>
            <p><strong>How to make:</strong> ${instructions}</p>
          </div>
        `;
        container.appendChild(card);
      });
    };

    renderCocktails(select.value);
    select.addEventListener('change', (event) => renderCocktails(event.target.value));
  } catch (error) {
    console.error('Failed to load cocktails:', error);
  }
}

loadCocktails();
