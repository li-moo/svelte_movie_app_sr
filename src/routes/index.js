import Home from './Home.svelte';
import About from './About.svelte';
import Movie from './Movie.svelte';
import NotFound from './NotFound.svelte';

// svelte-spa-rouer
const routes = {
  '/': Home,
  '/movie/:id': Movie, // 파라미터가 있는 페이지
  '/about': About,
  '*': NotFound,
};

export default routes;
