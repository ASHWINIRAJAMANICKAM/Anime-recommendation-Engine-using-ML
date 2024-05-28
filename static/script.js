// Selecting DOM elements for navigation and overlay
const menu = document.querySelector(".header .menu");
const navigation = document.querySelector(".header .main-navigation");
const links = document.querySelectorAll(".header .main-navigation a");
const overlay = document.querySelector(".overlay");
const overlay1 = document.querySelector(".overlay1");

// Notify function to show success or error messages
var notifyTimeout;

function NotifyUser(ErrorType, message, duration) {
  var errorMessage = document.getElementById("NotifyUser");

  // Clear any existing timeout
  clearTimeout(notifyTimeout);

  errorMessage.innerHTML = "";

  // Set message type and content
  if (ErrorType === "success") {
    errorMessage.classList.add("successMessage");
    errorMessage.innerHTML = `<i class="fa fa-check" style="font-size:20px" aria-hidden="true"></i> ${message}`;
  } else {
    errorMessage.classList.add("errorMessage");
    errorMessage.innerHTML = `<i class="fa fa-exclamation-circle" style="font-size:20px" aria-hidden="true"></i> ${message}`;
  }

  // Show the message and hide it after the duration
  errorMessage.classList.remove("none");
  notifyTimeout = setTimeout(() => {
    errorMessage.classList.add("none");
    errorMessage.classList.remove("errorMessage", "successMessage");
    errorMessage.innerHTML = "";
  }, duration);
}

// Functions to open and close the mobile navigation
function openMobileNavigation() {
  menu.classList.add("open");
  navigation.classList.add("fade-in");
  controlOverlay("open");
}

function closeMobileNavigation() {
  menu.classList.remove("open");
  navigation.classList.remove("fade-in");
  controlOverlay("close");
}

// Event listener for menu click to toggle navigation
menu.addEventListener("click", () => {
  overlay1.classList.remove("fade-in");
  document.querySelector("#loginForm").classList.add("none");
  overlay1.classList.add("fade-out");
  menu.classList.toggle("open");
  navigation.classList.toggle("fade-in");
  controlOverlay(menu.classList.contains("open") ? "open" : "close");
});

// Close mobile navigation when a link is clicked
links.forEach((link) => {
  link.addEventListener("click", closeMobileNavigation);
});

// Close mobile navigation on window resize if width is >= 1024px
window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024 && menu.classList.contains("open")) {
    closeMobileNavigation();
  }
});

// Function to control the overlay visibility
function controlOverlay(status) {
  overlay.classList.toggle("fade-in", status === "open");
  overlay.classList.toggle("fade-out", status !== "open");
}

// Selecting form elements and anime details container
const submit = document.getElementById("submit");
const searchInput = document.getElementById("title");
const animeDetails = document.getElementById("anime-details");

// Function to display anime details in a modal
function showAnimeDetails(anime) {
  overlay1.classList.add("fade-in");
  animeDetails.classList.remove("none");
  overlay1.classList.remove("fade-out");
  animeDetails.innerHTML = `
    <div style="display: flex; justify-content: end" class="close1">
      <i class="fa fa-close" style="font-size: 30px; color: rgb(95, 91, 91)"></i>
    </div>
    <div class="anime-details-div" id="animeDiv">
      <div class="img">
        <img src="${anime.imageUrl}" alt="${anime.title}" />
      </div>
      <div class="anime-details-list">
        <h3 class="anime-title">${anime.title}</h3>
        <h4>Anime synopsis</h4>
        <i>${anime.description}</i>
        <div style="display: flex; flex-direction: column; color: rgb(38, 139, 139); font-weight: 300;">
          <span>Year: ${anime.year}</span>
          <span>Members: ${anime.members}</span>
          <span>Episodes: ${anime.episodes}</span>
          <span>Popularity: ${anime.popularity}</span>
        </div>
      </div>
    </div>
  `;
  document.documentElement.scrollTop = 2;

  // Close icon event listener
  const closeIcon1 = document.querySelector(".close1");
  closeIcon1.style.cursor = "pointer";
  closeIcon1.onclick = () => {
    overlay1.classList.remove("fade-in");
    animeDetails.classList.add("none");
    overlay1.classList.add("fade-out");
  };
}

// Fetch anime data from the Jikan API
function fetchAnimeDetails(anime) {
  return fetch(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(
      anime.title
    )}&limit=1`
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "429") {
        return fetchAnimeDetails(anime); // Retry if rate limited
      } else {
        const animeData = data.data[0];
        return {
          title: animeData.title,
          description: animeData.synopsis,
          year: animeData.aired.prop.from.year,
          episodes: animeData.episodes,
          popularity: animeData.popularity,
          members: animeData.members,
          imageUrl: animeData.images.jpg.image_url,
        };
      }
    })
    .catch((error) => {
      console.error("Error while fetching data:", error);
      throw error;
    });
}

// Submit button click event to show spinner and validate input
submit.addEventListener("click", () => {
  if (!searchInput.value) {
    NotifyUser("error", "Please enter an Anime Name...", 3500);
  } else {
    document.getElementById("spinner").classList.add("fa-spinner", "fa-spin");
  }
});

// Form submit event to fetch and display recommendations
document
  .getElementById("recommendationForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    if (!searchInput.value) {
      NotifyUser("error", "Please enter an Anime Name...", 3500);
      return;
    }

    // Show spinner
    document.getElementById("spinner").classList.add("fa-spinner", "fa-spin");

    // Fetch recommendations from the server
    fetch("/recommend", { method: "POST", body: new FormData(event.target) })
      .then((response) => response.json())
      .then((data) => {
        document
          .getElementById("spinner")
          .classList.remove("fa-spinner", "fa-spin");
        const recommendationsDiv = document.getElementById("recommendations");
        recommendationsDiv.innerHTML = "";

        if (data.message) {
          NotifyUser("error", `${data.message}`, 3500);
        } else {
          NotifyUser(
            "success",
            `Recommendations For ${searchInput.value}`,
            3500
          );
          data.forEach((anime) => {
            const animeItem = document.createElement("div");
            animeItem.classList.add("anime-item");
            animeItem.innerHTML = `
            <img src="/static/media/loadingSkeleton.svg" alt="${anime.title}" class="zoom-effect">
            <h3 style="color: rgb(0,0,0);">${anime.title}</h3>
            <p><h4 style="color: red;">Rating: ${anime.rating}</h4></p>
          `;
            recommendationsDiv.appendChild(animeItem);

            // Fetch anime details and update the anime item
            fetchAnimeDetails(anime)
              .then((animeDetails) => {
                animeItem.querySelector("img").src = animeDetails.imageUrl;
                animeItem.addEventListener("click", () =>
                  showAnimeDetails(animeDetails)
                );
              })
              .catch((error) => console.error("Failed to fetch data:", error));
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching recommendations:", error);
        document
          .getElementById("spinner")
          .classList.remove("fa-spinner", "fa-spin");
        NotifyUser(
          "error",
          "Failed to get recommendations. Please try again.",
          5000
        );
      });
  });
