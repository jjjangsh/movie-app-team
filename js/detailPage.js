import { getMovieDetail, getCredits } from "./API.js";
import { formattedDetailData } from "./formatMovie.js";

const urlParams = new URLSearchParams(window.location.search); // URL query parameter 가져오기
const movieId = urlParams.get("id"); // 매개변수 id 값 가져오기

// 영화 디테일 정보 가져오기
const fetchMovieDetail = async () => {
  try {
    const response = await getMovieDetail("detail", movieId);
    const movieDetailData = [];

    if (response) {
      movieDetailData.push(formattedDetailData(response));
    } else {
      throw new Error("영화 디테일 정보를 가져오는데 실패했습니다.");
    }

    return movieDetailData;
  } catch (err) {
    console.error(err);
  }
};

// 출연진 사진 정보 가져오기
const fetchActorsData = async () => {
  try {
    const response = await getCredits("credits", movieId);
    const actorData = [];

    if (response) {
      actorData.push(response);
    } else {
      throw new Error("출연진 사진을 가져오지 못했습니다.");
    }
    return actorData;
  } catch (err) {
    console.error(err);
  }
};

// UI 요소 선택자
const selectors = {
  skeletonDetail: document.querySelector(".skeletons.movieDetails"),
  movieDetails: document.querySelector(".movieDetails:not(.skeletons)"),
  genreList: document.querySelector(".genre"),
  posterDiv: document.querySelector(".movieDetails:not(.skeletons) .poster"),
  koTitleDiv: document.querySelector(".koTitle"),
  enTitleDiv: document.querySelector(".enTitle"),
  yearDiv: document.querySelector(".year"),
  runtimeDiv: document.querySelector(".runtime"),
  gradeDiv: document.querySelector(".grade"),
  totalDiv: document.querySelector(".total"),
  overviewDiv: document.querySelector(".overview:not(.skeleton)"),
  mainDiv: document.querySelector(".main"),
  starImg: document.querySelector(".star"),
  directorLabelDiv: document.querySelector(".director .label"),
  directorNameDiv: document.querySelector(".director .name"),
  skeletonActor: document.querySelector(".skeletons.actorContainer"),
  actorContainer: document.querySelector(".actorContainer:not(.skeletons)"),
  actorTitleDiv: document.querySelector(".actorContainer .actorTitle h2"),
  actorsDiv: document.querySelector(".actorContainer .actors"),
  sliderDiv: document.querySelector(".actorContainer .actors .slider"),
  prevButton: document.getElementById('prevButton'),
  nextButton: document.getElementById('nextButton'),
};

// 출연진 이미지 그리기
const createActorsImage = async () => {
  // 데이터가 로드되기 전 스켈레톤 UI 보여줌
  selectors.skeletonActor.style.display = "flex";
  selectors.actorContainer.style.display = "none";

  const actors = await fetchActorsData();

  if (!actors || actors.length === 0) {
    console.log("들어온 출연진 데이터가 없습니다.");
    return;
  }

  const IMAGE_LENGTH = 15;

  // 1. 출연진 이름, 사진
  const actorInfo = actors[0].cast
    .filter((_, index) => index < IMAGE_LENGTH)
    .map((actor) => ({
      name: actor.name,
      profile_path: actor.profile_path,
    }));
    
  selectors.actorTitleDiv.textContent = "출연진";

  const actorSlider = actorInfo.map((actor) => createActorContainer(actor));
  actorSlider.forEach((actor) => selectors.sliderDiv.appendChild(actor));

  selectors.prevButton.innerHTML = '<img src="./images/navigate_prev.png" alt="Previous">';
  selectors.nextButton.innerHTML = '<img src="./images/navigate_next.png" alt="Next">';
  
  // 2. 영화 감독 이름
  const director = actors[0].crew.find((member) => member.job === "Director");

  selectors.directorLabelDiv.textContent = "감독 : ";
  selectors.directorNameDiv.textContent = `${director.name}`;
};

// 출연진 컨테이너 생성
const createActorContainer = (actor) => {
  const profilePath = actor.profile_path
    ? `https://image.tmdb.org/t/p/w300${actor.profile_path}`
    : './images/default_profile.png';

  const actorDiv = document.createElement('div');
  actorDiv.classList.add('actor');
  
  const actorImg = document.createElement('img');
  actorImg.src = profilePath;
  actorImg.alt = actor.name;
  
  const actorName = document.createElement('span');
  actorName.textContent = actor.name;

  actorDiv.appendChild(actorImg);
  actorDiv.appendChild(actorName);

  return actorDiv;
};

// 영화 디테일 그리기
const createMovieDetailCard = async () => {
  // 데이터가 로드되기 전 스켈레톤 UI 보여줌
  selectors.skeletonDetail.style.display = "flex";
  selectors.movieDetails.style.display = "none";

  const movieDetail = await fetchMovieDetail();

  if (!movieDetail || movieDetail.length === 0) {
    console.log("들어온 detail 데이터가 없습니다.");
    return;
  }

  const {
    id,
    koTitle,
    enTitle,
    genres,
    imgUrl,
    backdropUrl,
    overview,
    date,
    rating,
    runtime,
  } = movieDetail[0];

  // 영화 디테일 데이터 추가
  selectors.koTitleDiv.textContent = koTitle;
  selectors.enTitleDiv.textContent = enTitle;
  selectors.yearDiv.textContent = date;
  selectors.runtimeDiv.textContent = `${runtime}분`;
  selectors.gradeDiv.textContent = rating;
  selectors.overviewDiv.textContent = overview;
  selectors.totalDiv.textContent = " / 10";

  // 배경 이미지 설정
  selectors.mainDiv.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${backdropUrl})`;

  // 영화 포스터 추가
  const img = document.createElement("img");
  img.src = `https://image.tmdb.org/t/p/w300${imgUrl}`;
  img.alt = koTitle;
  selectors.posterDiv.appendChild(img);

  // rating 이미지 추가
  selectors.starImg.src = "https://i.ibb.co/yFS3gHB/star.png";
  selectors.starImg.alt = "별";

  // 장르 리스트 추가
  selectors.genreList.innerHTML = genres
    .map(
      (genre) => `
    <div class="genreContainer">
      <span class="genreValue">${genre}</span>
    </div>
  `
    )
    .join("");
};

// 모든 이미지 로드 완료 확인
const checkImagesLoaded = (callback) => {
  const images = document.querySelectorAll("img");

  let loadedCount = 0;
  let failedCount = 0;

  const totalImages = images.length;

  const imageLoadHandler = (event) => {
    if (!event) {
      loadedCount++;
    } else {
      if (event.type === "load") {
        loadedCount++;
      } else {
        failedCount++;
      }
    }

    if (loadedCount + failedCount === totalImages) {
      callback();
    }
  };

  images.forEach((image) => {
    if (image.complete) {
      imageLoadHandler();
    } else {
      image.addEventListener("load", imageLoadHandler);
      image.addEventListener("error", imageLoadHandler);
    }
  });
};

// 이미지 슬라이드
const createImageSlider = () => {
  let currentIndex = 0;
  let actors = document.querySelectorAll('.actor:not(.skeleton)');
  let slider = document.querySelector('.slider');
  let totalActors = actors.length;

  const nextSlide = () => {
    currentIndex == totalActors - 5  ? (currentIndex = 0) : currentIndex++;
    updateSlider();
  }
  
  const prevSlide = () => {
    currentIndex == 0 ? (currentIndex = totalActors - 5 ) : currentIndex--;
    updateSlider();
  }
  
  const updateSlider = () => {
    const slideWidth = actors[0].clientWidth; // 한 이미지의 너비
    const totalWidth = slideWidth * totalActors;
    slider.style.width = `${totalWidth}px`;
    slider.style.transform = `translateX(-${(slideWidth * currentIndex)+(currentIndex * 16)}px)`;
  }

  document.getElementById('nextButton').addEventListener('click', nextSlide);
  document.getElementById('prevButton').addEventListener('click', prevSlide);
}

// 상세에서 로고 누르면 메인으로 이동하고 로컬스토리지 비우기
document.querySelector(".logo div").addEventListener('click',() => {
  localStorage.removeItem('selectedCategory');
  localStorage.removeItem('selectFilterMovie');
  window.location.href = "/";
})

// 로드 시
document.addEventListener("DOMContentLoaded", () => {
  const darkmode = localStorage.getItem('darkmode') || document.body.dataset.theme;
  darkLightImageChange(darkmode)
  document.body.dataset.theme = darkmode;

  Promise.all([createMovieDetailCard(), createActorsImage()]).then(() => {
    // 이미지 슬라이드
    createImageSlider();

    checkImagesLoaded(() => {
      // 데이터가 로드되면 스켈레톤 UI 숨김
      selectors.skeletonDetail.style.display = "none";
      selectors.movieDetails.style.display = "flex";
      
      selectors.skeletonActor.style.display = "none";
      selectors.actorContainer.style.display = "flex";  
    });
  });
});


// 라이트-다크 모드
const darkmodeBtn = document.querySelector('.darkmodeBtn')
const darkmodeImage = document.querySelector('.darkmodeBtn > img')

darkmodeBtn.addEventListener('click', () => {
  let dataAttr = document.body.dataset

  if(dataAttr.theme.match('light-mode')){
    darkLightImageChange('dark-mode')
    dataAttr.theme = 'dark-mode';
  }else{
    darkLightImageChange('light-mode')
    dataAttr.theme = 'light-mode';
  }
  localStorage.setItem('darkmode', dataAttr.theme);
})

const darkLightImageChange = (mode) => {
  if(mode === 'light-mode'){
    darkmodeImage.src = 'https://jjjangsh.github.io/movie-app-team/images/moon.png';
  }else{
    darkmodeImage.src = 'https://jjjangsh.github.io/movie-app-team/images/sun.png';
  }
}
