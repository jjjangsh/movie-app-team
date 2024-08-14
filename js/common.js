import { getMoviesByCategory } from "./API.js";
import { formattedMovieData } from "./formatMovie.js";

let movieLists = [];
let filteredMovies = [];

// 영화 데이터 가져오기
const fetchMovieData = async () => {
  try {
    const movies = await getMoviesByCategory('top_rated');
    movieLists = formattedMovieData(movies);
    filteredMovies = [...movieLists];
    return movieLists;
  } catch (err) {
    console.log(err);
  }
}

// 영화 카드 그리기
const createMovieCards = (movies = null) => {
  const moviesToDisplay = movies || movieLists;

  const ul = document.querySelector('.movieCards');
  ul.innerHTML = '';

  moviesToDisplay.forEach(movie => {
    const { id, koTitle, enTitle, imgUrl, overview, rating, date } = movie;
    const li = document.createElement('li');
    li.setAttribute('class', 'movie');
    li.innerHTML = `
      <a href="./detail.html?id=${id}">
        <div class="movieWrapper">
          <span class="moviePoster">
            <img src="https://image.tmdb.org/t/p/w500${imgUrl}" alt="${koTitle}">
          </span>
          <div class="movieKoTitle">${koTitle}</div>
          <div class="movieEnTitle">(${enTitle})</div>
          <div class="movieOverview">${overview}</div>
          <div class="movieInfo">
            <h4 class="movieYear">${date}</h4>
            <div class="movieRating">
              <img src="./images/star.png" alt="별">
              <p>
                <span class="movieGrade">${rating}</span>
                <span class="movieTotal"> / 10</span>
              </p>
            </div>
          </div>
        </div>
      </a>
    `;
    ul.appendChild(li);
  });
};

// 이름 필터
const filterNames = (input) => {
  const value = input.toLowerCase();
  return value
    ? movieLists.filter(movie => movie.koTitle.toLowerCase().includes(value) || movie.enTitle.toLowerCase().includes(value))
    : movieLists;
}

// 필터를 적용하는 함수
const applyFilter = (filterValue) => {
  let moviesToFilter = filteredMovies.length ? filteredMovies : movieLists;

  if (filterValue === 'star') {
    filteredMovies = moviesToFilter.slice().sort((a, b) => b.rating - a.rating);
  } else if (filterValue === 'ko') {
    filteredMovies = moviesToFilter.slice().sort((a, b) => a.koTitle.localeCompare(b.koTitle));
  } else if (filterValue === 'en') {
    filteredMovies = moviesToFilter.slice().sort((a, b) => a.enTitle.localeCompare(b.enTitle));
  } else if (filterValue === 'releaseDate') {
    filteredMovies = moviesToFilter.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  createMovieCards(filteredMovies);
}

// 로컬스토리지에서 필터 값을 가져와서 설정
const applyStoredFilter = () => {
  const selectElement = document.getElementById('selectFilterMovie');
  const storedFilter = localStorage.getItem('selectFilterMovie');

  if (storedFilter) {
    selectElement.value = storedFilter;
    applyFilter(storedFilter);
  } else {
    selectElement.value = 'star';
    applyFilter('star');
  }
}

// 영화 데이터 초기화 함수
const initializeMovies = async () => {
  const selectedCategory = localStorage.getItem('selectedCategory');
  let movies;

  if (selectedCategory) {
    document.getElementById(selectedCategory).classList.add('active');
    movies = await getMoviesByCategory(selectedCategory);
    movieLists = formattedMovieData(movies);
    filteredMovies = [...movieLists];
  } else {
    await fetchMovieData();
  }

  createMovieCards();
  applyStoredFilter(); // 저장된 필터 적용
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', async () => {
  const darkmode = localStorage.getItem('darkmode') || document.body.dataset.theme;
  darkLightImageChange(darkmode)
  document.body.dataset.theme = darkmode;

  await initializeMovies();

  const selectElement = document.getElementById('selectFilterMovie');
  selectElement.addEventListener('change', (event) => {
    const filterValue = event.target.value;
    localStorage.setItem('selectFilterMovie', filterValue); // 필터 값 저장
    applyFilter(filterValue);
  });

  // 카테고리 클릭 이벤트
  document.querySelectorAll('.movieCategory a').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();

      // 모든 카테고리 링크에서 active 클래스 제거
      document.querySelectorAll('.movieCategory a').forEach(item => {
        item.classList.remove('active');
      });

      // 클릭된 링크에 active 클래스 추가
      e.target.classList.add('active');

      // 카테고리별 영화 데이터 가져오고 로컬스토리지에 카테고리 저장
      const category = e.target.id;
      localStorage.setItem('selectedCategory', category);
      localStorage.removeItem('selectFilterMovie');

      const movies = await getMoviesByCategory(category);
      movieLists = formattedMovieData(movies);
      filteredMovies = [...movieLists];

      // 필터 값을 초기화하고 별점순으로 설정
      const selectElement = document.getElementById('selectFilterMovie');
      selectElement.value = 'star';
      applyFilter('star');
    });
  });
});

// 버튼 클릭 or 엔터 입력 시 영화 검색
const form = document.getElementById("searchForm");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById('search').value.trim();
  filteredMovies = filterNames(input); // 검색 결과를 filteredMovies에 저장

  if (filteredMovies.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: '검색 결과가 없습니다.',
      text: '메인 페이지로 이동합니다.',
      confirmButtonText: '확인'
    }).then(() => {
      window.location.href = "/";
    });
  } else {
    createMovieCards(filteredMovies);
    if (!input.length) {
      applyStoredFilter(); // 필터 적용
    }
  }
});

// 로고 클릭하면 로컬스토리지 비우기
document.querySelector('.logo div').addEventListener('click', (e) => {
  localStorage.removeItem('selectedCategory');
  localStorage.removeItem('selectFilterMovie'); // 필터 값도 삭제
  window.location.href = "/";
});

// 라이트-다크 모드
const darkmodeBtn = document.querySelector('.darkmodeBtn')
const darkmodeImage = document.querySelector('.darkmodeBtn > img')
const searchImage = document.querySelector('.searchForm button > img')

darkmodeBtn.addEventListener('click', () => {
  let dataAttr = document.body.dataset

  if (dataAttr.theme.match('light-mode')) {
    darkLightImageChange('dark-mode')
    dataAttr.theme = 'dark-mode';
  } else {
    darkLightImageChange('light-mode')
    dataAttr.theme = 'light-mode';
  }
  localStorage.setItem('darkmode', dataAttr.theme);
})

const darkLightImageChange = (mode) => {
  if (mode === 'light-mode') {
    darkmodeImage.src = 'https://jjjangsh.github.io/movie-app-team/images/moon.png';
    searchImage.src = 'https://jjjangsh.github.io/movie-app-team/images/search_dark.svg';
  } else {
    darkmodeImage.src = 'https://jjjangsh.github.io/movie-app-team/images/sun.png';
    searchImage.src = 'https://jjjangsh.github.io/movie-app-team/images/search_white.svg';
  }
}
