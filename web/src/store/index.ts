import { createStore } from "vuex";
import api from "../services/api";

export default createStore({
  state: {
    token: localStorage.getItem("token") || "",
    user: null,
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
  },
  mutations: {
    auth_success(state, { token, user }) {
      state.token = token;
      state.user = user;
    },
    logout(state) {
      state.token = "";
      state.user = null;
    },
  },
  actions: {
    async login({ commit }, user) {
      const response = await api.post("/auth/login", user);
      const token = response.data.token;
      const userData = {
        username: response.data.username,
        id: response.data.userId,
      };
      localStorage.setItem("token", token);
      commit("auth_success", { token, user: userData });
      return response;
    },
    async register(_, user) {
      const response = await api.post("/auth/register", user);
      return response;
    },
    logout({ commit }) {
      localStorage.removeItem("token");
      commit("logout");
    },
  },
  modules: {},
});
