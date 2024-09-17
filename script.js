document.addEventListener("DOMContentLoaded", function() {
  // Load FontAwesome for icons (if needed)
  let fontAwesome = document.createElement("script");
  fontAwesome.src = "https://kit.fontawesome.com/6a8f656999.js";
  fontAwesome.setAttribute("crossorigin", "anonymous");
  document.querySelector("head").append(fontAwesome);

  let page = 1;
  let apiType = "popular";
  let currentQuery;
  let currentFilter = null;
  const apiKey = "?api_key=f21ecd49e65ebcde5093bfa18b67d3ac"; // Using your API key
  const imgPath = "https://image.tmdb.org/t/p/w500";
  let url = `https://api.themoviedb.org/4/list/8271943${apiKey}&language=en-US&region=US&page=${page}`;
  const movies = [];
  const moviesData = []; // Array to store all movie data
  const form = document.querySelector("form");
  const searchBox = document.querySelector("input[type='search']");
  const homeBtn = document.querySelector("#home");
  const gridSizeBtn = document.querySelector("#gridSize");
  const filters = document.querySelectorAll(".filter");

  // Fetch movies from API and process them
  const getM = async function (site) {
    try {
      let res = await fetch(site);
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
      const { original_title, vote_average, poster_path, overview } = movie;
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
        document.querySelector(".movieResults").append(newContain);
        movies.push(newContain);
      }
    });
  };

  // Handle infinite scroll
  const scroll = function () {
    page++;
    url = `https://api.themoviedb.org/4/list/8271943${apiKey}&language=en-US&region=US&page=${page}`;
  };

  // Handle form submission
  const sendForm = async function () {
    let query = searchBox.value.trim();
    currentQuery = query;
    searchBox.value = '';
    if (query === '') return;
    document.querySelector("#resultText").innerHTML = `Loading results for "${currentQuery}"...`;
    document.querySelectorAll(".movieBox").forEach(mov => mov.remove());
    movies.length = 0;
    moviesData.length = 0;
    await loadAllMovies();
    localSearch(query);
  };

  // Load all movies before searching
  const loadAllMovies = async function () {
    page = 1;
    let totalPages = 1;
    do {
      let currentUrl = `https://api.themoviedb.org/4/list/8271943${apiKey}&language=en-US&region=US&page=${page}`;
      let resJSON = await getM(currentUrl);
      moviesData.push(...resJSON.results);
      totalPages = resJSON.total_pages;
      page++;
    } while (page <= totalPages);
  };

  // Perform local search
  const localSearch = function (query) {
    let filteredMovies = moviesData.filter(movie => movie.original_title.toLowerCase().includes(query.toLowerCase()));
    if (filteredMovies.length === 0) {
      document.querySelector("#resultText").innerHTML = `No results found for "${currentQuery}".`;
    } else {
      posterPop(filteredMovies);
      document.querySelector("#resultText").innerHTML = `Search results for "${currentQuery}":`;
    }
  };

  // Initial load with infinite scroll
  const initialLoad = async function () {
    let resJSON = await getM(url);
    posterPop(resJSON.results);
    moviesData.push(...resJSON.results);
    if (resJSON.page < resJSON.total_pages) {
      scroll();
    }
  };

  // Event listeners
  window.addEventListener("scroll", async () => {
    if (window.scrollY > 100) {
      document.querySelector("#toTop").style.display = "block";
    } else {
      document.querySelector("#toTop").style.display = "none";
    }
    if (movies.length && movies[movies.length - 1].offsetTop - (window.scrollY + window.innerHeight) <= 0) {
      let resJSON = await getM(url);
      posterPop(resJSON.results);
      moviesData.push(...resJSON.results);
      if (resJSON.page < resJSON.total_pages) {
        scroll();
      }
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendForm();
  });

  homeBtn.addEventListener("click", () => {
    currentFilter = null;
    filters.forEach(x => x.classList.remove("selected"));
    document.querySelectorAll(".movieBox").forEach(mov => mov.remove());
    movies.length = 0;
    moviesData.length = 0;
    page = 1;
    url = `https://api.themoviedb.org/4/list/8271943${apiKey}&language=en-US&region=US&page=${page}`;
    initialLoad();
    document.querySelector("#resultText").innerHTML = "";
    window.scrollTo(0, 0);
  });

  gridSizeBtn.addEventListener("click", () => {
    document.querySelector(".movieResults").classList.toggle("grid-large");
  });

  filters.forEach(filter => {
    filter.addEventListener("click", () => {
      if (filter.classList.contains("selected")) {
        filter.classList.remove("selected");
        currentFilter = null;
      } else {
        filters.forEach(x => x.classList.remove("selected"));
        filter.classList.add("selected");
        currentFilter = filter.getAttribute("id");
      }
      document.querySelectorAll(".movieBox").forEach(mov => mov.remove());
      movies.length = 0;
      page = 1;
      url = `https://api.themoviedb.org/4/list/8271943${apiKey}&language=en-US&region=US&page=${page}`;
      initialLoad();
    });
  });

  document.querySelector("#toTop").addEventListener("click", () => { window.scrollTo(0, 0) });

  // Initial load
  initialLoad();
});
