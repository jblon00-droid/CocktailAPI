export default function SearchBar({ value, onChange, onSearch }) {
  return (
    <div className="nav__search" id="searchPanel">
      <input
        id="searchInput"
        type="text"
        placeholder="Search cocktails"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSearch();
        }}
      />
      <button id="searchButton" type="button" onClick={onSearch}>Search</button>
    </div>
  );
}
