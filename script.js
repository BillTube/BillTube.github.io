document.addEventListener("DOMContentLoaded", function() {
  // Load FontAwesome for icons (if needed)
  let fontAwesome = document.createElement("script");
  fontAwesome.src = "https://kit.fontawesome.com/6a8f656999.js";
  fontAwesome.setAttribute("crossorigin", "anonymous");
  document.querySelector("head").append(fontAwesome);

  // Add CSS for the sorting dropdown
  const style = document.createElement('style');
  style.textContent = `
    #sortOrder {
      background-color: #2c2c2c;
      color: #ffffff;
      border: 1px solid #3c3c3c;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      margin-right: 10px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    #sortOrder:hover {
      background-color: #3c3c3c;
    }

    #sortOrder:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
    }

    #sortOrder option {
      background-color: #2c2c2c;
    }
  `;
  document.head.appendChild(style);

  let page = 1;
  let currentQuery = '';
  let currentSort = "original_order.asc";
  let currentFilter = null;
  const apiKey = "?api_key=f21ecd49e65ebcde5093bfa18b67d3ac";
  const imgPath = "https://image.tmdb.org/t/p/w500";
  const baseUrl = "https://api.themoviedb.org/4/list/8426658";
  const moviesData = new Map();
  const form = document.querySelector("form");
  const searchBox = document.querySelector("input[type='search']");
  const homeBtn = document.querySelector("#home");
  const gridSizeBtn = document.querySelector("#gridSize");
  const filters = document.querySelectorAll(".filter");
  const movieResults = document.querySelector(".movieResults");
  const resultText = document.querySelector("#resultText");
  const toTopBtn = document.querySelector("#toTop");
  const loadingIcon = document.querySelector("#loading");

  // Create and add sort select element
  const sortSelect = document.createElement("select");
  sortSelect.id = "sortOrder";
  sortSelect.innerHTML = `
    <option value="original_order.asc">Sort By</option>
    <option value="popularity.desc">Popularity</option>
    <option value="vote_average.desc">Rating</option>
    <option value="primary_release_date.desc">Release Date</option>
  `;
  form.insertBefore(sortSelect, form.firstChild);

  // Fetch movies from API and process them
  const getMovies = async function (url) {
    try {
      if (currentSort !== "original_order.asc") {
        url += `&sort_by=${currentSort}`;
      }
      let res = await fetch(url);
      let resJSON = await res.json();
      return resJSON;
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  // Determine color based on rating
  const colorByRating = (rating) => {
    switch (true) {
      case rating >= 7:
        return "darkgreen";
      case rating >= 5:
        return "goldenrod";
      case rating >= 3:
        return "#be6709";
      default:
        return "darkred";
    }
  };

  // Convert filter to numerical rating
  const filterToNum = (filter) => {
    switch (filter) {
      case "great":
        return 7;
      case "good":
        return 5;
      case "ok":
        return 3;
      default:
        return 0; // Show all movies if no filter is selected
    }
  };

  // Populate movie posters
  const posterPop = function (moviesList) {
    movieResults.innerHTML = ''; // Clear current movie display
    moviesList.forEach(movie => {
      const { id, original_title, vote_average, poster_path, overview } = movie;
      let rating = vote_average.toFixed(1);
      if (rating >= filterToNum(currentFilter)) {
        let desc = overview ? (overview.split(' ').slice(0, 54).join(' ') + (overview.split(' ').length > 54 ? "..." : "")) : "No overview available.";
        let newContain = document.createElement("div");
        newContain.innerHTML = `
          <div class="movie" data-overview="${desc}" style="background:center / cover url(${imgPath}${poster_path})">
          </div>
          <div class="movieFooter">
            <h2>${original_title}</h2>
            <p style="background-color:${colorByRating(rating)}">${rating}</p>
          </div>`;
        newContain.classList.add("movieBox");
        newContain.id = `movie-${id}`;
        movieResults.append(newContain);
      }
    });
  };

  // Show loading icon
  const showLoading = function () {
    loadingIcon.style.display = "block";
  };

  // Hide loading icon
  const hideLoading = function () {
    loadingIcon.style.display = "none";
  };

  // Load more movies
  const loadMoreMovies = async function (resetPage = false) {
    if (resetPage) {
      page = 1;
      moviesData.clear();
      movieResults.innerHTML = '';
    }
    if (page === null) return; // No more pages to load
    showLoading();
    let currentUrl = `${baseUrl}${apiKey}&language=en-US&region=US&page=${page}`;
    let resJSON = await getMovies(currentUrl);
    let newMovies = resJSON.results.filter(movie => !moviesData.has(movie.id));
    newMovies.forEach(movie => moviesData.set(movie.id, movie));
    
    let filteredMovies = Array.from(moviesData.values()).filter(movie => 
      (!currentQuery || movie.original_title.toLowerCase().includes(currentQuery.toLowerCase())) &&
      movie.vote_average >= filterToNum(currentFilter)
    );
    
    posterPop(filteredMovies);
    
    if (page < resJSON.total_pages) {
      page++;
    } else {
      page = null; // No more pages to load
    }
    hideLoading();
  };

  // Perform search and filter
  const performSearchAndFilter = function () {
    let filteredMovies = Array.from(moviesData.values()).filter(movie => 
      (!currentQuery || movie.original_title.toLowerCase().includes(currentQuery.toLowerCase())) &&
      movie.vote_average >= filterToNum(currentFilter)
    );
    
    if (filteredMovies.length === 0) {
      resultText.innerHTML = currentQuery ? `No results found for "${currentQuery}".` : "No movies match the current filter.";
    } else {
      posterPop(filteredMovies);
      resultText.innerHTML = currentQuery ? `Search results for "${currentQuery}":` : "";
    }
  };

  // Handle form submission
  const handleFormSubmit = async function (e) {
    e.preventDefault();
    let query = searchBox.value.trim();
    if (query === currentQuery) return;
    currentQuery = query;
    searchBox.value = '';
    resultText.innerHTML = `Loading results for "${currentQuery}"...`;
    showLoading();
    await loadAllMovies();
    performSearchAndFilter();
    hideLoading();
  };

  // Load all movies
  const loadAllMovies = async function () {
    page = 1;
    let totalPages = 1;
    moviesData.clear();
    do {
      let currentUrl = `${baseUrl}${apiKey}&language=en-US&region=US&page=${page}`;
      let resJSON = await getMovies(currentUrl);
      resJSON.results.forEach(movie => {
        if (!moviesData.has(movie.id)) {
          moviesData.set(movie.id, movie);
        }
      });
      totalPages = resJSON.total_pages;
      page++;
    } while (page <= totalPages);
  };

  // Initial load
  const initialLoad = async function () {
    page = 1;
    moviesData.clear();
    movieResults.innerHTML = '';
    resultText.innerHTML = '';
    await loadMoreMovies(true);
  };

  // Event listeners
  window.addEventListener("scroll", async () => {
    if (window.scrollY > 100) {
      toTopBtn.style.display = "block";
    } else {
      toTopBtn.style.display = "none";
    }
    if (!currentQuery && page && (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
      await loadMoreMovies();
    }
  });

  form.addEventListener("submit", handleFormSubmit);

  homeBtn.addEventListener("click", () => {
    currentQuery = '';
    searchBox.value = '';
    sortSelect.value = "original_order.asc";
    currentSort = "original_order.asc";
    filters.forEach(x => x.classList.remove("selected"));
    currentFilter = null;
    initialLoad();
  });

  gridSizeBtn.addEventListener("click", () => {
    movieResults.classList.toggle("grid-large");
  });

  sortSelect.addEventListener("change", async () => {
    currentSort = sortSelect.value;
    showLoading();
    await loadAllMovies();
    performSearchAndFilter();
    hideLoading();
  });

  filters.forEach(filter => {
    filter.addEventListener("click", async () => {
      if (filter.classList.contains("selected")) {
        filter.classList.remove("selected");
        currentFilter = null;
      } else {
        filters.forEach(x => x.classList.remove("selected"));
        filter.classList.add("selected");
        currentFilter = filter.getAttribute("id");
      }
      showLoading();
      performSearchAndFilter();
      hideLoading();
    });
  });

  toTopBtn.addEventListener("click", () => { window.scrollTo(0, 0) });

  // Initial load
  initialLoad();
});
