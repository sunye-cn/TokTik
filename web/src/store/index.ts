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
    update_user(state, user) {
      state.user = { ...(state.user || {}), ...user };
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
        nickname: response.data.nickname,
        id: response.data.userId,
        avatar: response.data.avatar,
      };
      localStorage.setItem("token", token);
      commit("auth_success", { token, user: userData });
      return response;
    },
    async fetchProfile({ commit }) {
      try {
        const response = await api.get("/users/profile");
        commit("update_user", response.data);
        return response;
      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token");
          commit("logout");
          return;
        }
        throw error;
      }
    },
    async register(_, user) {
      const response = await api.post("/auth/register", user);
      return response;
    },
    async resetPassword(_, data) {
      const response = await api.post("/auth/reset-password", data);
      return response;
    },
    logout({ commit }) {
      localStorage.removeItem("token");
      commit("logout");
    },
  },
  modules: {},
});
