import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import API from '../api/axiosConfig';
import { AxiosResponse } from 'axios';
import { Test } from './testStore';
import uploadImg from '../services/uploadService';

interface IStore {
    errText: string,
    isUpdated: boolean,
    isMenuOpen: boolean,
    isLogged: boolean,
    isRegistered: boolean,
    dropArea: boolean
    user: IUser | null,
    userPage: IUser | null,
    tests: Test[],
    isLoading: boolean,
    register: (email: string, username: string, password: string) => void,
    login: (email: string, password: string) => void,
    setError: (err: string) => void,
    logout: () => void,
    refresh: () => void,
    getUser: () => void,
    updateUser: (username: string, bio: string) => void,
    getUserTests: (userId: string) => void,
    handleIsLogged: (val: boolean) => void,
    handleIsRegistered: (val: boolean) => void,
    handleIsUpdated: (val: boolean) => void,
    handleDropArea: (val: boolean) => void,
    like: (testId: string) => void,
    save: (testId: string) => void,
    toggleMenu: () => void,
    follow: (userId: string) => void,
    unfollow: (userId: string) => void,
    getUserPage: (userid: string) => void,
    setAvatar: (img: File) => void, 
}

type PassedTest = {
    testId: string,
    score: number
}

interface IUser {
    _id: string,
    username: string,
    email: string,
    bio: string,
    avatarUrl: string,
    isActivated: boolean,
    likes: number,
    followers: [],
    followings: [],
    likedPosts: [],
    savedPosts: [],
    passedTests: PassedTest[]
    likedComments: [],
    likedAnswers: [],
    createdTests: [],
    posts: [],
    __v: number,
}

const useUserStore = create<IStore>()(devtools(immer((set, get) => ({
    errText: '',
    isUpdated: false,
    isLogged: false,
    isMenuOpen: false,
    isRegistered: false,
    dropArea: false,
    user: null,
    userPage: null,
    tests: [],
    isLoading: false,
    register: async (email, username, password) => {
        await API.post(`/auth/register`, { email, username, password }).then(res => {
            if (res.data.message === 'Success') {
                set({ isRegistered: true });
            }
        });
    },
    login: async (email, password) => {
        await API.post(`/auth/login`, { email, password }).then((res: AxiosResponse<any>) => {
            if (res.data.accessToken) {
                document.cookie = `token=${res.data.accessToken};`;
                set({ isLogged: true, user: res.data.user });
            } else {
                set({ errText: 'Invalid email or password' });
                set({ isLogged: false });
            }
        }).catch(err => {
            set({ errText: 'Invalid password or email' });
            console.log(err);
        });
    },
    logout: async () => {
        await API.post(`/auth/logout`).then(res => {
            if (res.data.message === 'Success') {
                document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
                set({ isLogged: false, isRegistered: false });

            } else {
                console.log('something went wrong')
            }
        });
    },
    refresh: async () => {
        await API.get(`/auth/refresh`).then(res => {
            if (res.data.accessToken.length) {
                document.cookie = `token=${res.data.accessToken};`;
                set({ isLogged: true, user: res.data.user });
            } else {
                set({ isLogged: false });
            }
        }).catch(err => console.log(err));
    },
    getUser: async () => {
        await API.get(`/user`).then(res => {
            if (res.data.user) {
                set({ user: res.data.user });
            }
        }).catch(err => console.log(err));
    },
    updateUser: async (username, bio) => {
        await API.put(`/user`, {username, bio}).then(res => {
            if(res.data.message !== 'Success') {
                set({errText: res.data.message});
            }
        }).catch(err => console.log(err));
    },
    getUserTests: async (userId) => {
        set({ isLoading: true });
        await API.get(`/tests/${userId}`).then(res => {
            set({ tests: res.data.tests });
            set({ isLoading: false });
        }).catch(err => console.log(err))
    },
    setError: (err) => {
        set({ errText: err });
    },
    handleIsLogged: (val) => {
        set({ isLogged: val });
    },
    handleIsRegistered: (val) => {
        set({ isRegistered: val });
    },
    handleIsUpdated: (val) => {
        set({isUpdated: val});
    },
    handleDropArea: (val) => {
        set({dropArea: val});
    },
    like: async (testId) => {
        await API.put(`/likeTest/${testId}`).catch(err => console.log(err));
    },
    save: async (testId) => {
        await API.put(`/saveTest/${testId}`).catch(err => console.log(err));
    },
    toggleMenu: () => {
        const isMenuOpen = get().isMenuOpen;
        set({ isMenuOpen: !isMenuOpen });
    },
    follow: async (userId) => {
        await API.put(`/follow/${userId}`, { userId }).catch(err => console.log(err));
    },
    unfollow: async (userId) => {
        await API.put(`/unfollow/${userId}`).catch(err => console.log(err));
    },
    getUserPage: async (userId) => {
        await API.get(`/userPage/${userId}`).then(res => {
            if (res.data.user) {
                set({ userPage: res.data.user });
            }
        }).catch(err => console.log(err));
    },
    setAvatar: async (img) => {
        const avatarUrl = await uploadImg(img);
        await API.put(`/avatar`, {avatarUrl}).catch(err => console.log(err));
    }
})
),
),
);

export default useUserStore;