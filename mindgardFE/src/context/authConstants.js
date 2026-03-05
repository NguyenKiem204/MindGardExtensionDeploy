export const AUTH_ACTIONS = {
    LOGIN_START: "LOGIN_START",
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILURE: "LOGIN_FAILURE",
    LOGOUT: "LOGOUT",
    REFRESH_SUCCESS: "REFRESH_SUCCESS",
    REFRESH_FAILURE: "REFRESH_FAILURE",
    SET_USER: "SET_USER",
    CLEAR_ERROR: "CLEAR_ERROR",
  };
  
  export const INITIAL_AUTH_STATE = {
    isAuthenticated: false,
    user: null,
    accessToken: null, 
    loading: false,
    error: null,
  };