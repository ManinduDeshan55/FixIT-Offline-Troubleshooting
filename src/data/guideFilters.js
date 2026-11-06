export function filterGuides(guides, { searchText = '', categoryId = 'all', difficulty = 'all' } = {}) {
  const searchTerm = searchText.trim().toLowerCase();

  return guides.filter((guide) => {
    const matchesSearch =
      searchTerm.length === 0 ||
      guide.title.toLowerCase().includes(searchTerm) ||
      guide.description.toLowerCase().includes(searchTerm);
    const matchesCategory = categoryId === 'all' || guide.categoryId === categoryId;
    const matchesDifficulty = difficulty === 'all' || guide.difficulty === difficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });
}
