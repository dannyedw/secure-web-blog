const searchBar = document.getElementById("searchBarForm");

searchBar.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Get element from webpage
    let searchQuery = document.getElementById('search').value;

    if(searchQuery === '')
    {
        alert("Search Bar Empty");
    }

    window.location.href = '/searchPage?query=' + searchQuery;
});