import { configureStore, createSlice } from '@reduxjs/toolkit'
import appStateSlice from './appStateSlice'
import { firestoreApi } from './firestoreApi';

export const store = configureStore({
  reducer: {
    [firestoreApi.reducerPath]: firestoreApi.reducer,
    appState: appStateSlice
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(firestoreApi.middleware);
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

