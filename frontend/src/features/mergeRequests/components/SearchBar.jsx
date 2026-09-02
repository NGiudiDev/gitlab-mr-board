function SearchBar({ value = '', onChange }) {
  return (
    <div className="w-full max-w-xs">
      <label htmlFor="search-merge-requests" className="sr-only">Buscar merge requests</label>
      <input
        id="search-merge-requests"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por título, autor o rama..."
        autoComplete="off"
        className="bg-bg text-text-primary placeholder:text-text-faint border border-control rounded-md px-2.5 py-2 text-[13px] w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
    </div>
  )
}

export default SearchBar
