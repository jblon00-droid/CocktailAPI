const fetchJson = (url) => fetch(url).then((response) => response.json());

async function loadCocktails(searchTerm = '') {
  const container = document.querySelector('.cocktails__card-grid');
  const sortSelect = document.querySelector('#sortSelect');
  const searchInput = document.querySelector('#searchInput');
  const searchButton = document.querySelector('#searchButton');

  if (!container || !sortSelect || !searchInput || !searchButton) return;

  try {
    const query = searchTerm.trim() || 'margarita';
    const [searchData, lookupData, lookupDataTwo, filterData] = await Promise.all([
      fetchJson(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`),
      fetchJson('https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=11007'),
      fetchJson('https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=552'),
      fetchJson('https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=Ordinary_Drink')
    ]);

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
      Array.from({ length: 10 }, (_, index) => cocktail[`strIngredient${index + 1}`]).filter(Boolean).length;

    const getSearchScore = (cocktail, term) => {
      const name = (cocktail.strDrink || '').toLowerCase();
      const normalizedTerm = term.toLowerCase();

      if (name === normalizedTerm) return 100;
      if (name.startsWith(normalizedTerm)) return 90;
      if (name.includes(normalizedTerm)) return 80;
      return 0;
    };

    const renderCard = (cocktail) => {
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
    };

    const renderCocktails = (sortType, term = '') => {
      const filteredCocktails = term
        ? uniqueCocktails.filter((cocktail) => (cocktail.strDrink || '').toLowerCase().includes(term.toLowerCase()))
        : uniqueCocktails;

      const sortedCocktails = [...filteredCocktails].sort((a, b) => {
        if (term) {
          const scoreDiff = getSearchScore(b, term) - getSearchScore(a, term);
          if (scoreDiff !== 0) return scoreDiff;
        }

        if (sortType === 'ingredients') {
          return getIngredientCount(b) - getIngredientCount(a);
        }

        if (sortType === 'alphabetical') {
          return (a.strDrink || '').localeCompare(b.strDrink || '');
        }

        return 0;
      });

      container.innerHTML = '';
      sortedCocktails.slice(0, 12).forEach(renderCard);
    };

    const handleSearch = () => {
      const term = searchInput.value.trim();
      loadCocktails(term);
    };

    sortSelect.onchange = (event) => renderCocktails(event.target.value, searchInput.value.trim());
    searchButton.onclick = handleSearch;
    searchInput.onkeydown = (event) => {
      if (event.key === 'Enter') handleSearch();
    };

    renderCocktails(sortSelect.value, searchTerm.trim());
  } catch (error) {
    console.error('Failed to load cocktails:', error);
  }
}

loadCocktails();
