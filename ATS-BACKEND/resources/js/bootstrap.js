import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// Send cookies for cross-site requests (required for Sanctum cookie auth)
window.axios.defaults.withCredentials = true;
