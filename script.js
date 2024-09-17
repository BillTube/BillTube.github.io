document.addEventListener("DOMContentLoaded", function() {
  // Load FontAwesome for icons
  let fontAwesome = document.createElement("script");
  fontAwesome.src = "https://kit.fontawesome.com/6a8f656999.js";
  fontAwesome.setAttribute("crossorigin", "anonymous");
  document.querySelector("head").append(fontAwesome);

  let page = 1;
  let apiType = "popular";
  let currentQuery;
  let currentFilter = null;
  const apiKey = "?api_key=f21ecd49e65ebcde5093bfa18b67d3ac"; // Replace with your API key
  const imgPath = "https://image.tmdb.org/t/p/w500";
  let url = `https://api.themoviedb.org/4/list/1${apiKey}&language=en-US&region=US&page=${page}`;
  const movies = [];
  const moviesData = []; // Array to store movie data
  const favorites = JSON.parse(localStorage.getItem('favorites')) || []; // Load favorites from localStorage
  const form = document.querySelector("form");
  const searchBox = document.querySelector("input[type='search']");
  const homeBtn = document.querySelector("#home");
  const favoritesBtn = document.querySelector("#favorites");
  const gridSizeBtn = document.querySelector("#gridSize");
  const filters = document.querySelectorAll(".filter");
  let adult = false;

  // Fetch movies from API and process them
  const getM = async function (site, func) {
    try {
      let res = await fetch(site);
      let resJSON = await res.json();
      func(resJSON.results);
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
        return 1;
    }
  };

  // Populate movie posters
  const posterPop = function (pg) {
    for (let movie of pg) {
      const { id, original_title, vote_average, poster_path, overview } = movie;
      let newContain = document.createElement("div");
      let rating = vote_average.toFixed(1);
      if (rating >= filterToNum(currentFilter)) {
        let desc;
        (overview && overview.split(' ').length <= 55) ?
          desc = overview :
          desc = (overview ? overview.split(' ').slice(0, 54).join(' ') + "..." : "No overview available.");
        newContain.innerHTML = `
        <div class="movie" data-overview="${desc}" style="background:center / cover url(${imgPath}${poster_path})">
          <button class="favorite-btn" data-id="${id}">
            <i class="fas fa-star ${favorites.includes(id) ? 'favorited' : ''}"></i>
          </button>
        </div>
        <div class="movieFooter">
          <h2>${original_title}</h2>
          <p style="background-color:${colorByRating(rating)}">${rating}</p>
        </div>`;
        newContain.classList.add("movieBox");
        document.querySelector(".movieResults").append(newContain);
        movies.push(newContain);
        moviesData.push(movie); // Store movie data
      }
    }
    // Load more movies if less than 8 are displayed
    if (document.querySelectorAll(".movieBox").length < 8) {
      scroll(apiType, currentQuery);
      getM(url, posterPop);
    };
  };

  // Handle infinite scrolling
  const scroll = function (option, query) {
    page++;
    switch (option) {
      case "popular":
        url = `https://api.themoviedb.org/4/list/1${apiKey}&language=en-US&region=US&page=${page}`;
        break;
      case "search":
        url = `https://api.themoviedb.org/3/search/movie${apiKey}&language=en-US&region=US&query=${encodeURI(query)}&page=${page}&include_adult=${adult}`;
        break;
    };
  };

  // Perform local search
  const localSearch = function (query) {
    let filteredMovies = moviesData.filter(movie => movie.original_title.toLowerCase().includes(query.toLowerCase()));
    document.querySelectorAll(".movieBox").forEach(mov => mov.remove());
    movies.length = 0; // Clear movies array
    filteredMovies.forEach(movie => posterPop([movie]));
  };

  // Handle form submission
  const sendForm = function () {
    let query = searchBox.value.trim();
    currentQuery = query;
    searchBox.value = '';
    if (query === '') return;
    document.querySelectorAll(".movieBox").forEach(mov => mov.remove());
    movies.length = 0;
    localSearch(query); // Perform local search
    document.querySelector("#resultText").innerHTML = `Search results for "${currentQuery}" ...`;
  };

  // Initial fetch of movies (load first 5 pages)
  const initialLoad = async function () {
    for (let i = 0; i < 5; i++) {
      await getM(url, posterPop);
      scroll(apiType, currentQuery);
    }
  };

  // Load favorites
  const loadFavorites = function () {
    document.querySelectorAll(".movieBox").forEach(mov => mov.remove());
    movies.length = 0;
    let favoriteMovies = moviesData.filter(movie => favorites.includes(movie.id));
    if (favoriteMovies.length === 0) {
      document.querySelector("#resultText").innerHTML = "No favorites yet.";
    } else {
      favoriteMovies.forEach(movie => posterPop([movie]));
      document.querySelector("#resultText").innerHTML = "Your Favorites:";
    }
  };

  // Event listeners
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      document.querySelector("#toTop").style.display = "block";
    } else {
      document.querySelector("#toTop").style.display = "none";
    }
    if (movies.length && movies[movies.length - 1].offsetTop - (window.scrollY + window.innerHeight) <= 0) {
      scroll(apiType, currentQuery);
      getM(url, posterPop);
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendForm();
  });

  homeBtn.addEventListener("click", () => {
    apiType = "popular";
    currentFilter = null;
    for (let x of filters) { x.classList.remove("selected") };
    page = 1;
    document.querySelectorAll(".movieBox").forEach(mov => mov.remove());
    movies.length = 0;
    moviesData.length = 0; // Clear movie data
    url = `https://api.themoviedb.org/4/list/1${apiKey}&language=en-US&region=US&page=${page}`;
    initialLoad();
    document.querySelector("#resultText").innerHTML = "";
    window.scrollTo(0, 0);
  });

  favoritesBtn.addEventListener("click", () => {
    loadFavorites();
    window.scrollTo(0, 0);
  });

  gridSizeBtn.addEventListener("click", () => {
    document.querySelector(".movieResults").classList.toggle("grid-large");
  });

  filters.forEach(filter => {
    filter.addEventListener("click", (e) => {
      if (e.target.classList.contains("selected")) {
        e.target.classList.remove("selected");
        currentFilter = null;
      } else {
        for (let x of filters) { x.classList.remove("selected") };
        e.target.classList.add("selected");
        currentFilter = e.target.getAttribute("id");
      }
      page = 1;
      document.querySelectorAll(".movieBox").forEach(mov => mov.remove());
      movies.length = 0;
      moviesData.length = 0; // Clear movie data
      url = `https://api.themoviedb.org/4/list/1${apiKey}&language=en-US&region=US&page=${page}`;
      initialLoad();
    });
  });

  document.querySelector("#toTop").addEventListener("click", () => { window.scrollTo(0, 0) });

  // Delegate event for favorite buttons
  document.querySelector(".movieResults").addEventListener("click", (e) => {
    if (e.target.closest('.favorite-btn')) {
      let btn = e.target.closest('.favorite-btn');
      let movieId = parseInt(btn.getAttribute('data-id'));
      if (favorites.includes(movieId)) {
        favorites.splice(favorites.indexOf(movieId), 1);
        btn.querySelector('i').classList.remove('favorited');
      } else {
        favorites.push(movieId);
        btn.querySelector('i').classList.add('favorited');
      }
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  });

  // Initial load
  initialLoad();
});
