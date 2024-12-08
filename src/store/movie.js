import axios from 'axios';
import { writable, get } from 'svelte/store';
import _unionBy from 'lodash/unionBy';

// 스토어 생성 export coonst 객체 이름 = writavle(초기값), 상태관리 여러 컴포넌트에서 공유 가능
// js에서 객체는 참조에 의한 호출(Call by Reference) <-> 기본 데이터 타입(Call by Value): 숫자, 문자열, Boolean
export const movies = writable([]);
export const loading = writable(false);
export const theMovie = writable({});
export const message = writable('Search for the movie title!');

// 스토어 초기화 함수
export function initMovies() {
  movies.set([]); // 리스트를 빈 배열로 초기화
  message.set('Search for the movie title!');
  loading.set(false);
}

// 사용자가 영화 검색했을 때  OMDB API에서 데이터를 가져옴
export async function searchMovies(payload) {
  if (get(loading)) return; // 로딩 중이면 함수 종료
  loading.set(true);
  message.set('');

  let total = 0;

  try { // ...전개 구문(Spread Syntax) 객체 혹은 배열 전개 혹은 분해
    const res = await _fetchMovie({ ...payload, page: 1 }); // payload속성 가져옴
    const { Search, totalResults } = res.data; // 구조 분해 할당 
    movies.set(Search); // 검색된 영화 목록 배열
    total = totalResults; // 검색 결과의 총 개수
  } catch (msg) { 
    movies.set([]);
    message.set(msg);
    loading.set(false);
    return;
  }

  // 페이지 수 계산
  const pageLength = Math.ceil(total / 10);
  if (pageLength > 1) { // 추가 페이지 있는지?있으면 for문 실행
    for (let page = 2; page <= pageLength; page += 1) {
      if (page > payload.number / 10) break;
      const res = await _fetchMovie({ ...payload, page }); // 각 페이지의 데이터를 가져온다.
      const { Search } = res.data;
      movies.update(($movies) => _unionBy($movies, Search, 'imdbID'));
      // _unionBy Lodash의 유틸리티 함수 (중복 데이터 제거)
      // _.unionBy(기준 배열, [병합할 배열], [중복 판단 기준 속성(key)])
      // 기존 영화 리스트와 새로운 영화 리스트를 imdbID 기준으로 중복 없이 병합.
    }
  }
  loading.set(false);
}

export async function searchMovieWithId(id) {
  if (get(loading)) return; // 로딩 상태인지 확인
  loading.set(true);

  // i로 특정 영화 정보 확인
  const res = await _fetchMovie({ id });

  theMovie.set(res.data); // 받은 데이터를 상태 변수에 저장
  loading.set(false);
}

// 영화 데이터 가져오는 함수 _fetchMovie
function _fetchMovie(payload) {

  // payload: 요청 보낼 때 필요한 데이터를 담은 객체
  // res: 응답으로 받아온 데이터를 담은 객체
  const { title, type, year, page, id } = payload;
  const API_KEY = '7035c60c';

  const url = id // id 가 존재할 셩우 : id가 없을 경우
    ? `https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}&plot=full`
    : `https://www.omdbapi.com/?apikey=${API_KEY}&s=${title}&type=${type}&y=${year}&page=${page}`;

    // resolve 비동기 작업 완료일 때 호출, reject 실패 or 에러 발생 했을 때
  return new Promise(async (resolve, reject) => {
    try { // 호출 결과 res에 저장
      const res = await axios.get(url);
      if (res.data.Error) {
        reject(res.data.Error);
      }
      resolve(res);
    } catch (error) { //에러
      console.error(error.response.status);
      reject(error.message);
    }
  });
}
