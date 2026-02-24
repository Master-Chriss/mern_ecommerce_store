import {create} from 'zustand';
import axios from '../lib/axios';
import {toast} from 'react-hot-toast';

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,
  signup: async ({name, email, password, confirmPassword}) => {
    set({loading: true});

    if(password !== confirmPassword) {
      set({loading: false});
      return toast.error("Passwords do not match");
    }

    try {
      const res = await axios.post('/auth/signup', {name, email, password});
      set({user: res.data, loading: false});
    } catch (error) {
      set({loading: false});
      toast.error(error.response.data.message || "Something went wrong");
    }
  },

  login: async ({email, password}) => {
    set({loading: true});

    try {
      const res = await axios.post('/auth/login', {email, password});
      
      if(!res.data) console.log("No user fetched!");

      set({user: res.data, loading: false});
      console.log("Logged in as:", res.data?.role);
    } catch (error) {
      set({loading: false});
      toast.error(error.response.data.message || "Something went wrong");
    }
  },

    logout: async () => {
      try {
        await axios.post('/auth/logout');
        set({user: null});
        console.log("You are successfully logged out :(")
      } catch (error) {
        toast.error(error.response?.data?.message || "An error occurred during logout.");
      }
    },

  checkAuth: async () => {
    set({checkingAuth: true});
    try {
      const response = await axios.get('/auth/profile');
      set({user: response.data, checkingAuth: false});
    } catch (error) {
      set({checkingAuth: false, user: null});
      console.log(error);
    }
  }
}));

// TODO: Implement axios interceptors for refreshing access token every 15 minutes


