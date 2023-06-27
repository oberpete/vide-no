import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './store'
import { userMgmtApi } from './userMgmtFirestore'
import { UserData } from '../types'

// Define a type for the slice state
export interface AppState {
  numberOfSlides: number,
  user: UserData | undefined,
  sessionId: string | undefined,
  onboardingInProgress: boolean,
  inferencingInProgress: boolean,
  webcamModalOpen: boolean,
  presentationFinished: boolean,
  presenterMode: boolean,
}

// Define the initial state using that type
const initialState: AppState = {
  numberOfSlides: 1,
  user: undefined,
  sessionId: undefined,
  onboardingInProgress: true,
  inferencingInProgress: false,
  webcamModalOpen: true,
  presentationFinished: false,
  presenterMode: false
}

export const appStateSlice = createSlice({
  name: 'AppState',
  initialState,
  reducers: {
    setNumberOfSlides: (state, action) => {
      state.numberOfSlides = action.payload
    },
    setOnBoardingInProgress: (state, action) => {
      console.log('setOnBoardingInProgress called', action.payload)
      state.onboardingInProgress = action.payload
    },
    setInferencingInProgress: (state, action) => {
      state.inferencingInProgress = action.payload
    },
    setWebcamModalOpen: (state, action) => {
      state.webcamModalOpen = action.payload
    },
    setPresentationFinished: (state, action) => {
      state.presentationFinished = action.payload
    },
    setPresenterMode: (state, action) => {
      state.presenterMode = action.payload
    },
    setUser: (state, action) => {
      state.user = action.payload.data
    },
    setSessionId: (state, action) => {
      console.log('setSessionId called', action.payload)
      state.sessionId = action.payload
    }
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      userMgmtApi.endpoints.addUser.matchFulfilled,
      (state, { payload }) => {
        //console.log("extra reducer 1", payload)
        state.user = payload
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        payload?.id && urlParams.append("userId", payload?.id);
        window.history.replaceState(null, "", `?${urlParams}`);
      }
    );
    builder.addMatcher(
      userMgmtApi.endpoints.setUserStatus.matchFulfilled,
      (state, action) => {
        //console.log("extra reducer 2", action.payload)
        //return {...state, user: action.payload}
        return {...state, user: action.payload}
      }
    );
    builder.addMatcher(
      userMgmtApi.endpoints.fetchUserById.matchFulfilled,
      (state, { payload }) => {
        //console.log("extra reducer user found", payload)
        state.user = payload
        state.onboardingInProgress = false
      }
    )
  },
})

export const { 
  setNumberOfSlides, 
  setOnBoardingInProgress, 
  setInferencingInProgress, 
  setWebcamModalOpen, 
  setUser, 
  setPresentationFinished,
  setPresenterMode,
  setSessionId 
} = appStateSlice.actions

// Other code such as selectors can use the imported `RootState` type
export const selectNumberOfSlides = (state: RootState) => state.appState.numberOfSlides
export const selectUser = (state: RootState) => state.appState.user
export const selectUserStatus = (state: RootState) => state.appState.user?.status
export const selectOnboardingInProgress = (state: RootState) => state.appState.onboardingInProgress

export default appStateSlice.reducer