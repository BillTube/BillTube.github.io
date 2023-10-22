let fontAwesome = document.createElement("script");
fontAwesome.src = "https://kit.fontawesome.com/6a8f656999.js";
fontAwesome.setAttribute("crossorigin", "anonymous");
document.querySelector("head").append(fontAwesome);

let page = 1;
let apiType = "popular";
let currentQuery;
let currentFilter = null;
const apiKey = "?api_key=f21ecd49e65ebcde5093bfa18b67d3ac";
const imgPath = "https://image.tmdb.org/t/p/w500";
let url = `https://api.themoviedb.org/4/list/8271943${apiKey}&language=en-US&region=US&page=${page}`;
const movies = [];
const form = document.querySelector("form");
const searchBox = document.querySelector("input[type='search']");
const homeBtn = document.querySelector("#home");
const filters = document.querySelectorAll(".filter");
let adult = false;

const getM = async function (site, func) {
  let result = await fetch(site)
    .then(res => res.json())
    .then(resJSON => {
        func(resJSON.results);
    })
};
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
    };
}
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
}
const posterPop = function (pg) {
    for (let movie of pg)  {
        const {original_title, vote_average, poster_path, overview} = movie;
        let newContain = document.createElement("div");
        let rating = vote_average.toFixed(1);
        if (rating >= filterToNum(currentFilter)) {
            let desc;
            (overview.split(' ').length <= 55) ? 
                desc = overview : 
                desc = overview.split(' ').slice(0, 54).join(' ')+"...";
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
    }
    if (document.querySelectorAll(".movieBox").length < 8) {
        scroll(apiType, currentQuery);
        getM(url, posterPop);
    };
}

const scroll = function (option, query) {
    page++;
    switch (option) {
        case "popular":
            url = `https://api.themoviedb.org/4/list/8271943${apiKey}&language=en-US&region=US&page=${page}`;
            break;
        case "search":
            url = `https://api.themoviedb.org/3/search/movie${apiKey}&language=en-US&region=US&&query=${encodeURI(query)}&page=${page}&include_adult=${adult}`;
            break;
    };
}

const sendForm = function () {
    let query = searchBox.value;
    currentQuery = query;
    searchBox.value = '';
    document.querySelectorAll(".movieBox").forEach(mov => mov.remove())
    for (let m of movies) {movies.pop()};
    page = 0;
    apiType = "search";
    scroll("search", query);
    getM(url, posterPop);
    document.querySelector("#resultText").innerHTML = `Search results for "${currentQuery}" ...`;
}

getM(url, posterPop);
window.addEventListener("scroll", ()=>{
    if (window.scrollY > 100) {
        document.querySelector("#toTop").style.display = "block";
    } else {
        document.querySelector("#toTop").style.display = "none";
    }
    if (movies[movies.length-1].offsetTop - (window.scrollY+window.innerHeight) <= 0) {
        scroll(apiType, currentQuery);
        getM(url, posterPop);
    }
})
form.addEventListener("submit", (e)=>{
    e.preventDefault();
    sendForm();
})
homeBtn.addEventListener("click", ()=>{
    apiType = "popular";
    currentFilter = null;
    for (let x of filters) {x.classList.remove("selected")};
    page = 0;
    document.querySelectorAll(".movieBox").forEach(mov => mov.remove())
    for (let m of movies) {movies.pop()};
    scroll(apiType, currentQuery);
    getM(url, posterPop);
    document.querySelector("#resultText").innerHTML = "";
    window.scrollTo(0,0)
})
filters.forEach(filter => {
    filter.addEventListener("click", (e)=>{
        if (e.target.classList.contains("selected")) {
            e.target.classList.remove("selected");
            currentFilter = null;
        } else {
            for (let x of filters) {x.classList.remove("selected")};
            e.target.classList.add("selected");
            currentFilter = e.target.getAttribute("id")
        }
        page = 0;
        document.querySelectorAll(".movieBox").forEach(mov => mov.remove())
        for (let m of movies) {movies.pop()};
        scroll(apiType, currentQuery);
        getM(url, posterPop);
    })
})
document.querySelector("#toTop").addEventListener("click", ()=>{window.scrollTo(0,0)});