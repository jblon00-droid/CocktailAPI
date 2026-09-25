import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar.jsx';
import CocktailCard from '../components/CocktailCard.jsx';
import Loading from '../components/Loading.jsx';
import Pagination from '../components/Pagination.jsx';
import { fetchCocktails, sortCocktails } from '../api.js';

const PAGE_SIZE = 12;
const EMPTY = [];

export default function Search() {
  // Search term, sort and page live in the URL so they survive navigating to a drink and back.
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const sortType = searchParams.get('sort') || 'unsorted';
  const requestedPage = Number.parseInt(searchParams.get('page'), 10) || 1;
  const resultsTop = useRef(null);

  const [searchInput, setSearchInput] = useState(searchTerm);
  // Results are stored with the term they were fetched for; until they match the
  // current term, the page is loading.
  const [result, setResult] = useState({ term: null, cocktails: [], hasError: false });
  const isLoading = result.term !== searchTerm;
  const cocktails = isLoading ? EMPTY : result.cocktails;
  const hasError = !isLoading && result.hasError;

  // A new search or sort starts back at page 1.
  const updateParams = (updates, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    if (resetPage) next.delete('page');
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'unsorted' && value !== 1) next.set(key, value);
      else next.delete(key);
    });
    // Page changes get their own history entry so the Back button steps through pages.
    setSearchParams(next, { replace: resetPage });
  };

  const goToPage = (page) => {
    updateParams({ page }, { resetPage: false });
    resultsTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    let ignore = false;

    fetchCocktails(searchTerm)
      .then((data) => {
        if (!ignore) setResult({ term: searchTerm, cocktails: data, hasError: false });
      })
      .catch((error) => {
        console.error('Failed to load cocktails:', error);
        if (!ignore) setResult({ term: searchTerm, cocktails: [], hasError: true });
      });

    return () => {
      ignore = true;
    };
  }, [searchTerm]);

  const sortedCocktails = useMemo(
    () => sortCocktails(cocktails, sortType, searchTerm),
    [cocktails, sortType, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(sortedCocktails.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleCocktails = sortedCocktails.slice(firstIndex, firstIndex + PAGE_SIZE);

  return (
    <section id="cocktails">
      <div className="cocktails__container">
        <div className="cocktails__row">
          <h1 className="cocktails__title">Cocktail Explorer</h1>
          <p className="cocktails__description">
            Browse hundreds of cocktails from TheCocktailDB. Search by name, sort the list, and open any drink
            for the full recipe.
          </p>
          <div className="filter__label" ref={resultsTop}>
            <label htmlFor="sortSelect">
              Sort cocktails:
              <select
                id="sortSelect"
                className="filter__select"
                value={sortType}
                onChange={(event) => updateParams({ sort: event.target.value })}
              >
                <option value="unsorted">Unsorted</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="ingredients">Ingredients</option>
              </select>
            </label>
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={() => updateParams({ q: searchInput.trim() })}
            />
          </div>
          {isLoading && <Loading />}
          {!isLoading && sortedCocktails.length > 0 && (
            <p className="pagination__summary">
              Showing {firstIndex + 1}–{firstIndex + visibleCocktails.length} of {sortedCocktails.length} cocktails
            </p>
          )}
          <div className="cocktails__card-grid">
            {visibleCocktails.map((cocktail) => (
              <CocktailCard key={cocktail.idDrink} cocktail={cocktail} />
            ))}
          </div>
          {!isLoading && hasError && (
            <p className="cocktails__description">
              We couldn&apos;t reach the cocktail database. Check your connection and try again.
            </p>
          )}
          {!isLoading && !hasError && visibleCocktails.length === 0 && (
            <p className="cocktails__description">No cocktails found. Try another search.</p>
          )}
          {!isLoading && (
            <>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
              {totalPages > 1 && (
                <p className="pagination__summary" aria-live="polite">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
