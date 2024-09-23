document.addEventListener("DOMContentLoaded", function() {
  // Load FontAwesome for icons (if needed)
  let fontAwesome = document.createElement("script");
  fontAwesome.src = "https://kit.fontawesome.com/6a8f656999.js";
  fontAwesome.setAttribute("crossorigin", "anonymous");
  document.querySelector("head").append(fontAwesome);

  let page = 1;
  let currentQuery = '';
  let currentFilter = null;
  const apiKey = "?api_key=f21ecd49e65ebcde5093bfa18b67d3ac"; // Using your API key
  const imgPath = "https://image.tmdb.org/t/p/w500";
  const baseUrl = "https://api.themoviedb.org/4/list/8426658"; // Base URL for your movie list
  const moviesData = new Map(); // Map to store movie data with id as key
  const form = document.querySelector("form");
  const searchBox = document.querySelector("input[type='search']");
  const homeBtn = document.querySelector("#home");
  const gridSizeBtn = document.querySelector("#gridSize");
  const filters = document.querySelectorAll(".filter");
  const movieResults = document.querySelector(".movieResults");
  const resultText = document.querySelector("#resultText");
  const toTopBtn = document.querySelector("#toTop");
  const loadingIcon = document.querySelector("#loading");

  // Fetch movies from API and process them
  const getMovies = async function (url) {
    try {
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
        newContain.id = `movie-${id}`; // Add unique id to each movie container
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

  // Load all movies before searching
  const loadAllMovies = async function () {
    page = 1;
    let totalPages = 1;
    moviesData.clear(); // Clear existing data
    showLoading();
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
    hideLoading();
  };

  // Virtual scroll function
  const virtualScroll = async function(movies, pageSize = 10) {
    let currentIndex = 0;
    
    const loadNextBatch = async () => {
      if (currentIndex >= movies.length) return;
      
      let batch = movies.slice(currentIndex, currentIndex + pageSize);
      posterPop(batch);
      currentIndex += pageSize;
      
      // Simulate scrolling
      window.scrollTo(0, document.body.scrollHeight);
      
      // Load next batch after a delay
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
      await loadNextBatch();
    };
    
    await loadNextBatch();
  };

  // Perform search
  const performSearch = async function (query) {
    let filteredMovies = Array.from(moviesData.values()).filter(movie => 
      movie.original_title.toLowerCase().includes(query.toLowerCase()) &&
      movie.vote_average >= filterToNum(currentFilter)
    );
    movieResults.innerHTML = ''; // Clear current movie display
    if (filteredMovies.length === 0) {
      resultText.innerHTML = `No results found for "${query}".`;
    } else {
      resultText.innerHTML = `Search results for "${query}":`;
      await virtualScroll(filteredMovies);
    }
  };

  // Handle form submission
  const handleFormSubmit = async function (e) {
    e.preventDefault();
    let query = searchBox.value.trim();
    if (query === '') return;
    currentQuery = query;
    searchBox.value = '';
    resultText.innerHTML = `Loading results for "${currentQuery}"...`;
    showLoading();
    await loadAllMovies();
    await performSearch(currentQuery);
    hideLoading();
  };

  // Initial load with virtual scroll
  const initialLoad = async function () {
    page = 1;
    moviesData.clear();
    movieResults.innerHTML = '';
    resultText.innerHTML = '';
    await loadAllMovies();
    let allMovies = Array.from(moviesData.values()).filter(movie => 
      movie.vote_average >= filterToNum(currentFilter)
    );
    await virtualScroll(allMovies);
  };

  // Event listeners
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      toTopBtn.style.display = "block";
    } else {
      toTopBtn.style.display = "none";
    }
  });

  form.addEventListener("submit", handleFormSubmit);

  homeBtn.addEventListener("click", () => {
    currentQuery = '';
    searchBox.value = '';
    filters.forEach(x => x.classList.remove("selected"));
    currentFilter = null;
    initialLoad();
    window.scrollTo(0, 0);
  });

  gridSizeBtn.addEventListener("click", () => {
    movieResults.classList.toggle("grid-large");
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
      if (currentQuery) {
        // If a search is active, filter the search results
        await performSearch(currentQuery);
      } else {
        // If no search, reset and load movies with new filter
        await initialLoad();
      }
      hideLoading();
    });
  });

  toTopBtn.addEventListener("click", () => { window.scrollTo(0, 0) });

  // Initial load
  initialLoad();
});
